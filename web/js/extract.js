// Prominent-color extraction: k-means++ over Oklab — the library's own perceptual metric,
// so cluster distance ≈ ΔEok (RGB k-means splits blues and merges skin tones; median-cut
// boxes axis-aligned RGB). Each centroid then snaps to its cluster's nearest REAL sample
// (medoid), so the palette is made of colors the image actually contains, not muddy means.
// ≤96px bitmap ≈ 9k samples, ~2ms; returns prominence-ordered sRGB byte triples.
import { space } from './core.js'

const D=(a,b)=>{ const x=a[0]-b[0], y=a[1]-b[1], z=a[2]-b[2]; return x*x+y*y+z*z }

export async function extractPalette(src,k=5){
	const bmp=await createImageBitmap(src)
	const S=96, sc=Math.min(1,S/Math.max(bmp.width,bmp.height))
	const w=Math.max(1,Math.round(bmp.width*sc)), h=Math.max(1,Math.round(bmp.height*sc))
	const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h})
	const cx=cv.getContext('2d',{willReadFrequently:true})
	cx.drawImage(bmp,0,0,w,h); bmp.close?.()
	const px=cx.getImageData(0,0,w,h).data, pts=[]
	for(let i=0;i<px.length;i+=4){ if(px[i+3]<128) continue   // transparent pixels are not colors
		pts.push(space.rgb.oklab(px[i],px[i+1],px[i+2])) }
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
