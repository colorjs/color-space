// Prominent-color extraction: k-means++ over Oklab — the library's own perceptual metric,
// so cluster distance ≈ ΔEok (RGB k-means splits blues and merges skin tones; median-cut
// boxes axis-aligned RGB). Each centroid then snaps to its cluster's nearest REAL sample
// (medoid), so the palette is made of colors the image actually contains, not muddy means.
// ≤96px bitmap ≈ 9k samples, ~2ms; returns prominence-ordered sRGB byte triples.
import { space } from './core.js'

const D=(a,b)=>{ const x=a[0]-b[0], y=a[1]-b[1], z=a[2]-b[2]; return x*x+y*y+z*z }

/** The image as sRGB byte triples for statistics (≤S px on the long side — density enough
 *  for histograms and clouds), stripped of transparent pixels. The FULL image rides along
 *  as .src (capped at 2048 — larger only spends memory no picker can aim at): the floater
 *  displays it crisp and reads exact pixels from it. */
// A decoder is never stopped for being slow: a large image decodes for seconds, and a deadline once failed all three in
// turn (a 100 MP PNG, 1.5 s each – "could not read that image", the file already among the recent). One silent past its
// patience may be one that never answers (createImageBitmap under software GL): the next starts beside it, the first to
// finish is the image, and the read fails only once every one has – or none has answered four patiences on.
// HEIC/HEIF: only Safari decodes it natively — everywhere else a vendored libheif steps
// in, lazy-loaded (1.4MB) only when such a file actually arrives
const HEIC=/hei[cf]/i
const patience=src=>Math.min(15000,1500+(src.size||0)/2000)   // ms: 1.5 s, and a second more for every 2 MB of the file
const nativeBitmap=src=>createImageBitmap(src)
const codecBitmap=async src=>{ if(typeof ImageDecoder==='undefined'||!src.type) throw new Error('WebCodecs image decode unavailable')
	const decoder=new ImageDecoder({data:src.stream(),type:src.type})
	try{ return (await decoder.decode({frameIndex:0})).image }finally{ decoder.close() } }   // the frame outlives its decoder
// loaded, not decode()d: Chromium's decode() refuses a large image (EncodingError) that it draws all the same
const elementBitmap=src=>new Promise((resolve,reject)=>{ const url=URL.createObjectURL(src), img=new Image(); img.decoding='async'
	img.close=()=>URL.revokeObjectURL(url)   // let go once drawn, as a bitmap is
	img.onload=()=>img.naturalWidth&&img.naturalHeight?resolve(img):(img.close(),reject(new Error('image element decoded no pixels')))
	img.onerror=()=>{ img.close(); reject(new Error('image element could not load')) }
	img.src=url })
const firstOf=(src,ways)=>new Promise((resolve,reject)=>{ let i=0, live=0, done=false, err, timer
	const wait=patience(src), fail=()=>{ if(done) return; done=true; clearTimeout(timer); reject(err||new Error('image decode timed out')) }
	const next=()=>{ clearTimeout(timer); if(done) return
		if(i>=ways.length){ timer=setTimeout(fail,4*wait); return }
		live++; timer=setTimeout(next,wait)
		ways[i++](src).then(bmp=>{ if(done) return void bmp.close?.(); done=true; clearTimeout(timer); resolve(bmp) },
			e=>{ err??=e; live--; if(i<ways.length) next(); else if(!live) fail() }) }   // one failed: the next at once – or, none left and none at work, the read has
	next() })
async function decodeBitmap(src){
	try{ return await firstOf(src,[nativeBitmap,codecBitmap,elementBitmap]) }catch(error){
		if(!HEIC.test(src.type||'')&&!/\.hei[cf]$/i.test(src.name||'')) throw error
		const lib=await (await import('../vendor/libheif.mjs')).default()
		const img=new lib.HeifDecoder().decode(await src.arrayBuffer())[0]
		if(!img) throw error
		const id=new ImageData(img.get_width(),img.get_height())
		await new Promise((res,rej)=>img.display(id,ok=>ok?res():rej(error)))
		const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(id.width,id.height):Object.assign(document.createElement('canvas'),{width:id.width,height:id.height})
		cv.getContext('2d').putImageData(id,0,0); return cv } }

export async function sampleImage(src,S=256){
	const bmp=await decodeBitmap(src), bw=bmp.displayWidth||bmp.naturalWidth||bmp.width, bh=bmp.displayHeight||bmp.naturalHeight||bmp.height   // a frame's, an element's, a bitmap's or a canvas's
	const fsc=Math.min(1,2048/Math.max(bw,bh))
	const fw=Math.max(1,Math.round(bw*fsc)), fh=Math.max(1,Math.round(bh*fsc))
	const full=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(fw,fh):Object.assign(document.createElement('canvas'),{width:fw,height:fh})
	full.getContext('2d').drawImage(bmp,0,0,fw,fh)
	const sc=Math.min(1,S/Math.max(bw,bh))
	const w=Math.max(1,Math.round(bw*sc)), h=Math.max(1,Math.round(bh*sc))
	const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h})
	const cx=cv.getContext('2d',{willReadFrequently:true})
	cx.drawImage(bmp,0,0,w,h); bmp.close?.()
	const px=cx.getImageData(0,0,w,h).data, out=new Uint8Array(px.length/4*3)
	let n=0
	for(let i=0;i<px.length;i+=4){ if(px[i+3]<128) continue   // transparent pixels are not colors
		out[n++]=px[i]; out[n++]=px[i+1]; out[n++]=px[i+2] }
	const rgb=out.subarray(0,n)
	rgb.src=full   // the full image rides along: display and pixel picks share one decode
	return rgb
}

/** Prominent colors from already-sampled pixels. */
export function paletteOf(rgb,k=5){
	const pts=[]
	for(let i=0;i<rgb.length;i+=3) pts.push(space.rgb.oklab(rgb[i],rgb[i+1],rgb[i+2]))
	if(!pts.length) return []
	k=Math.min(k,pts.length)
	// k-means++ seeding: each next seed drawn by squared distance from the seeds so far
	const C=[pts[(Math.random()*pts.length)|0].slice()]
	const d2=new Float64Array(pts.length).fill(Infinity)
	while(C.length<k){ const c0=C[C.length-1]; let sum=0
		for(let i=0;i<pts.length;i++){ const d=D(pts[i],c0); if(d<d2[i]) d2[i]=d; sum+=d2[i] }
		let r=Math.random()*sum, j=0
		while(j<pts.length-1&&(r-=d2[j])>0) j++
		C.push(pts[j].slice()) }
	// Lloyd iterations to (near) convergence
	const idx=new Uint8Array(pts.length), cnt=new Array(k).fill(0)
	for(let it=0;it<16;it++){ let moved=0
		for(let i=0;i<pts.length;i++){ let b=0, bd=Infinity
			for(let c=0;c<C.length;c++){ const d=D(pts[i],C[c]); if(d<bd){ bd=d; b=c } }
			if(idx[i]!==b){ idx[i]=b; moved++ } }
		const sum=C.map(()=>[0,0,0,0])
		for(let i=0;i<pts.length;i++){ const s=sum[idx[i]], p=pts[i]; s[0]+=p[0]; s[1]+=p[1]; s[2]+=p[2]; s[3]++ }
		sum.forEach((s,c)=>{ cnt[c]=s[3]; if(s[3]) C[c]=[s[0]/s[3],s[1]/s[3],s[2]/s[3]] })
		if(!moved) break }
	// medoid snap: the nearest actual sample stands in for each mean
	const best=C.map(()=>Infinity), med=C.map((c,i)=>c)
	for(let i=0;i<pts.length;i++){ const c=idx[i], d=D(pts[i],C[c]); if(d<best[c]){ best[c]=d; med[c]=pts[i] } }
	// prominence order; near-twin clusters (≲ JND) fold into the larger one
	const out=med.map((c,i)=>({ c, n:cnt[i]||0 })).filter(o=>o.n).sort((a,b)=>b.n-a.n), kept=[]
	for(const o of out){ const t=kept.find(x=>D(x.c,o.c)<0.0009); if(t) t.n+=o.n; else kept.push(o) }
	return kept.map(o=>space.oklab.rgb(...o.c).map(x=>Math.round(Math.min(255,Math.max(0,x)))))
}

/** Decode and extract in one call — the original entry point. */
export const extractPalette=async(src,k=5)=>paletteOf(await sampleImage(src),k)
