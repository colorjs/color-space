// The third study uses the production GPU tessellation, gamut sources and shaders.
// Frame fitting below follows index.html's wire3d (declared ranges, singularity guards,
// caps and soft overflow), so the new ink grid cannot change the color geometry.
import { space, classify, clamp, toSpace } from './core.js'
import { has3dGL, mesh3Canvas, drawMesh3GL, warmMesh3, visSurf, lightSurf } from './gl.js'
const inBaseCache=new Map(), frames=new Map()
function boxInBase(s){ if(inBaseCache.has(s)) return inBaseCache.get(s)
	const cls=classify(s)
	let ib=cls.archetype!=='additive'
	if(ib) try{ for(let a=0;a<5&&ib;a++)for(let b2=0;b2<5&&ib;b2++)for(let c2=0;c2<5&&ib;c2++){
			const v=cls.ch.map((c3,k)=>c3.min+(c3.max-c3.min)*[a,b2,c2][k]/4)
			const r=space[s].rgb(...v)
			if(!r.every(x2=>isFinite(x2)&&x2>-2.5&&x2<258)) ib=false } }catch{ ib=false }
	inBaseCache.set(s,ib); return ib }
const hueIdx=c2=>{ if(c2.angle) return c2.angle.i
	if(c2.ch.length!==3) return -1
	return c2.ch.findIndex(c3=>/hue/i.test(c3.name||'')) }
// tone(vertical) · hue(angle) · magnitude(radial) axis picks — ONE assignment for the
// 3D solid AND the 2D planes, so a disc reads as the solid's top view (wire3d uses it too)
const axes3=c2=>{ const ai=hueIdx(c2)
	if(ai<0) return { ai:-1, ti:c2.tone?c2.tone.i:0, mi:-1 }
	const rest=[0,1,2].filter(k=>k!==ai)
	const ti=c2.tone&&c2.tone.i!==ai?c2.tone.i:rest[1]
	return { ai, ti, mi:rest.find(k=>k!==ti) } }
function frameOf(s,gamut) {
	const cls=classify(s)
	// the solid's source volume follows the gamut switch: a display cube (sRGB by
	// default, P3/Rec.2020 widen it) or the visible gamut itself — the Rösch–MacAdam
	// optimal-color surface, arriving as raw XYZ
	let g3=gamut   // light carries its own body now – the spectral cone up to the Y=100 lid (gl.lightSurf)
	// a box-in-base space caps its view at sRGB — a wider volume decodes through
	// out-of-base light into non-canonical junk sheets, never new shape
	const inBase=boxInBase(s)
	if(inBase) g3='srgb'
	const gH=g3==='vis'||g3==='locus'   // both human-class bodies (surface zonoid, light cone) arrive as raw XYZ
	const conv=g3==='srgb'?(v=>toSpace(s,v)):gH?(v=>s==='xyz'?v.slice():space.xyz[s](...v)):(v=>space[g3][s](...v.map(x2=>x2/255)))
	// smooth achromatic taper (mirrors the GPU): 1 = full chroma, 0 = on the gray
	// axis — a hard cliff saws the surface where real chroma meets a collapsed row.
	// Box-in-base spaces collapse all-or-nothing instead: partially tapered junk
	// (HPLuv's exploding near-white P) would land back inside the guarded box.
	const gfCube=v=>{ const mx=Math.max(...v), dlt=mx-Math.min(...v)
		return Math.min(clamp(dlt/2.5,0,1),clamp((mx-2)/6,0,1)) }
	// the human solid tapers by LUMINANCE (mirrors gl.js): its near-black boundary is the
	// spectral MacAdam cusps — near-monochromatic colours at ~0% luminance whose appearance-
	// model chroma inflates to full (a violet at Y=0.02 reads C≈60), a black spike into space.
	// smoothstep(0,7) collapses them to the black point so the solid pinches to a clean
	// spindle, and reaches 1 by the deepest sRGB primary (blue, Y=7.2) so real colour is exact.
	const gfVis=v=>{ const t=clamp(v[1]/7,0,1); return t*t*(3-2*t) }
	const gfRaw=gH?gfVis:gfCube
	const grayF=inBase?(v=>gfRaw(v)<1?0:1):gfRaw
	// tone/hue/radius axes — the SAME assignment the 2D planes use (axes3), so the
	// solid and its plane slices always agree. Renamed wheels count as the hue angle.
	const {ai:aiX,ti,mi}=axes3(cls), ai=aiX<0?null:aiX
	// the sanity window for the cone-wall bisection: an additive space's coords can
	// never go below the zero-light code (below-min = sign-mirrored garbage); other
	// spaces may genuinely overflow by up to a whole span before it's junk
	const win=[cls.ch.map((c,k)=>c.min-(c.max-c.min)*(k!==ai&&cls.archetype==='additive'?0.02:1)),
		cls.ch.map(c=>c.max+(c.max-c.min))]
	// ── two extents, one law: the FRAME is a stable reference box per space —
	// identical across the gamut switch (grid planes, axes and scale never move) —
	// while the SOLID is the full, never-cropped shape of the selected volume ──
	const fmin=cls.ch.map(c=>c.min), fmax=cls.ch.map(c=>c.max)
	const dmin=fmin.slice(), dmax=fmax.slice()   // unpadded solid extents — where caps sit
	let capMask=0, cutMask=0, out3=false
	// hwb family: distance from gray is 1−W−B (not W) — maps the true HSV-style cone,
	// and the non-canonical W+B>100 region collapses onto the axis (zero area)
	const wI=cls.ch.findIndex(c=>/White/i.test(c.name)), bI=cls.ch.findIndex(c=>/Black/i.test(c.name))
	const wb=ai!=null&&wI>=0&&bI>=0
	{	const cubeProbes=()=>{ const out=[]
			for(let f=0;f<6;f++) for(let i2=0;i2<=12;i2++) for(let j2=0;j2<=12;j2++){
				const u=i2/12*255, w=j2/12*255
				out.push([[0,u,w],[255,u,w],[u,0,w],[u,255,w],[u,w,0],[u,w,255]][f]) }
			return out }
		const visProbes=()=>{ const out=[], vp=(g3==='locus'?lightSurf:visSurf)(12).pos
			for(let q=0;q<vp.length;q+=3) out.push([vp[q],vp[q+1],vp[q+2]])
			return out }
		// mirror the mesh's achromatic taper — else near-black chroma noise
		// (OSA-UCS's exploding ratios) inflates the extents
		const scan=(probes,cv2,gfn)=>{ const smp=[[],[],[]], pts=[]
			for(const pr of probes){ let v; try{ v=cv2(pr) }catch{ continue }
				const gf2=gfn(pr)
				if(gf2<1){ if(ai!=null&&!wb&&mi!=null) v[mi]*=gf2
					for(const b2 of cls.bips) v[b2.i]*=gf2 }
				if(v.every(isFinite)) pts.push(v)
				for(let k=0;k<3;k++) if(isFinite(v[k])) smp[k].push(v[k]) }
			return { smp, pts } }
		const solidScan=scan(gH?visProbes():cubeProbes(), conv, grayF)
		// the frame IS the declared channel range: the box axes match the sliders and
		// planes exactly (a tick at the range limit sits on the box wall), so the frame
		// measures instead of merely surrounding. The solid fills whatever part of that
		// range its gamut reaches — never cropped — and empty headroom (osaucs tops out
		// near L≈8 of 10) shows honestly. fmin/fmax stay the declared min/max above.
		// the solid: FULL data extent — the shape is never cropped. Only a space whose
		// box is its entire sayable world (box ⊆ sRGB) clips at the declared bound:
		// past it lies solver noise and duplicate encodings (okhwb's cusp teeth,
		// HPLuv's beyond-safe shell), not shape — and the cut wall gets a cap.
		cls.ch.forEach((c,k)=>{ const da=solidScan.smp[k].sort((x,y)=>x-y)
			if(k===ai||da.length<24) return
			let lo=da[0], hi=da[da.length-1]
			if(inBase){ const l2=Math.max(lo,c.min), h2=Math.min(hi,c.max)
				if(l2>lo+1e-9) cutMask|=1<<(k*2)
				if(h2<hi-1e-9) cutMask|=1<<(k*2+1)
				lo=l2; hi=h2 }
			// "pierces" means genuinely, not by float fuzz — a solid grazing its own
			// box face (lab's L=0) must not grow a spurious cap or dissolve pass
			else if(lo<c.min-(c.max-c.min)*0.004||hi>c.max+(c.max-c.min)*0.004) out3=true
			if(hi-lo<(c.max-c.min)*0.05) return
			dmin[k]=lo; dmax[k]=hi })
		// caps only where the solid genuinely flattens against the box — a cap on a
		// face the solid merely touches sticks out as a nub (the Y-family boxes);
		// polar solids need none at all (their walls and domes are the cube-surface
		// image, while degenerate coords near white make cap roundtrips lie), and an
		// additive cube IS its box: a cap would z-fight the surface lattice with its
		// own Gouraud shading (scRGB's diagonal seam)
		for(let k=0;k<3;k++){ if(ai!=null||cls.archetype==='additive') break
			let nLo=0, nHi=0
			for(const v of solidScan.pts){ const r=(v[k]-fmin[k])/(fmax[k]-fmin[k])
				if(r<0.06) nLo++; else if(r>0.94) nHi++ }
			if(nLo>=30) capMask|=1<<(k*2)
			if(nHi>=30) capMask|=1<<(k*2+1) }
		// a CUT face is a slice through the solid — close it with a cap: the cap pass
		// paints only pixels that are in-gamut and roundtrip canonically, which is
		// exactly the cross-section (HPLuv's P=100 wall). The human view cuts at the
		// DECLARED box instead: caps close every pierced face with the visible
		// cross-section, so the in-range body reads whole under the dissolving shell.
		capMask|=cutMask
		if(gH){ capMask=0
			cls.ch.forEach((c,k)=>{ if(k===ai) return
				const eps3=(c.max-c.min)*0.004
				if(dmin[k]<c.min-eps3) capMask|=1<<(k*2)
				if(dmax[k]>c.max+eps3) capMask|=1<<(k*2+1) }) } }
	// slice at the range box: SEAL the cut with a flat cap (its colour = the gamut cross-
	// section at the wall, painted through the SAME soft-knee display projection as the body
	// (gl.js softDisp) — so the seal reads as continuous solid: no colour seam, no doubled edge.
	// Cap every pierced face; box-in-base keeps its clips.
	capMask=cutMask
	cls.ch.forEach((c,k)=>{ if(k===ai) return
		const eps3=(c.max-c.min)*0.004
		if(dmin[k]<c.min-eps3) capMask|=1<<(k*2)
		if(dmax[k]>c.max+eps3) capMask|=1<<(k*2+1) })
	// a clip space's near-white collapse can OPEN its tone dome (HPLuv: exploding-P
	// rows pinch to the spine, leaving the L=100 lid a hole into the shell) — seal it.
	// The cap lattice sits 1.2% inset, below the degenerate zone, and its per-pixel
	// roundtrip paints exactly the valid cross-section; under a closed dome it hides.
	if(inBase&&ai!=null&&ti!=null) capMask|=1<<(ti*2+1)
	const norm=(v,k)=>clamp((v[k]-fmin[k])/(fmax[k]-fmin[k]),-0.2,1.2)
	const others=[0,1,2].filter(k=>k!==ti)
	const hueRad=v=>(v[ai]-fmin[ai])/(fmax[ai]-fmin[ai])*2*Math.PI
	const map3=v=>{
		if(wb){ const r=Math.max(0,1-norm(v,wI)-norm(v,bI))*0.55, h=hueRad(v)
			return [0.5-norm(v,bI), r*Math.cos(h), r*Math.sin(h)] }
		const y=norm(v,ti)-0.5
		if(ai!=null){ const r=norm(v,mi)*0.55, h=hueRad(v)
			return [y, r*Math.cos(h), r*Math.sin(h)] }
		return [y, norm(v,others[0])-0.5, norm(v,others[1])-0.5] }

	// the fit: the solid's own extent in the normalized frame (the clamp above bounds it), taken
	// as a bounding sphere so no turn pushes it past the canvas – the main page fits scale3 the same way
	const ext=k=>Math.max(...[dmin[k],dmax[k]].map(x=>Math.abs(clamp((x-fmin[k])/(fmax[k]-fmin[k]),-0.2,1.2)-0.5)))
	const R=wb?Math.hypot(ext(ti),0.55):ai!=null?Math.hypot(ext(ti),0.55*(ext(mi)+0.5)):Math.hypot(ext(ti),ext(others[0]),ext(others[1]))
	const fit=Math.min(1.5,0.92/Math.max(R,0.3))
	const winV=ai!=null ? [cls.ch.map((c,k)=>k===ai?win[0][k]:dmin[k]-(c.max-c.min)*.08),cls.ch.map((c,k)=>k===ai?win[1][k]:dmax[k]+(c.max-c.min)*.08)] : win
	return { map3, fit, map:{gam:g3,win:winV,min:fmin,max:fmax,caps:capMask,cmin:dmin.map((x,k)=>Math.max(x,cls.ch[k].min)),cmax:dmax.map((x,k)=>Math.min(x,cls.ch[k].max)),dcl:[fmin,fmax],out:out3,clip:inBase,ti,ai:ai??-1,mi:mi??0,wI:wb?wI:-1,bI:wb?bI:-1,bip:cls.bips.slice(0,2).map(c=>c.i),grid:true} }
}
export function drawSolid(host,s,vals,gamut,quant,rot,color) {
	if(!has3dGL(s)) { host.dataset.render='unavailable'; return false }
	const key=s+':'+gamut
	if(!frames.has(key))frames.set(key,frameOf(s,gamut))
	const {map,map3,fit}=frames.get(key), cv=mesh3Canvas(), hud=host.querySelector('.solid-hud')
	if(cv.parentElement!==host) { cv.className='solid'; cv.id='psolid'; host.prepend(cv) }
	const size=Math.max(1,Math.round(host.clientWidth*Math.min(devicePixelRatio||1,2)))
	if(cv.width!==size){cv.width=cv.height=size;hud.width=hud.height=size}
	const rotation={a:rot[0],b:rot[1]}, scale=fit
	warmMesh3(s,map.gam)
	const ready=drawMesh3GL(cv,s,map,rotation,scale,null,null,null,quant)
	host.dataset.render=ready?'ready':'loading'
	const ctx=hud.getContext('2d');ctx.clearRect(0,0,size,size)
	if(!ready)return false
	const ca=Math.cos(rot[0]),sa=Math.sin(rot[0]),cb=Math.cos(rot[1]),sb=Math.sin(rot[1])
	const project=v=>{ const [y,x,z]=map3(v), X=x*ca+z*sa, Z=-x*sa+z*ca;return [size/2+X*scale*size/2,size/2-(y*cb-Z*sb)*scale*size/2] }
	const css=getComputedStyle(host), ink=css.getPropertyValue('--ink'), paper=css.getPropertyValue('--paper'), unit=parseFloat(css.getPropertyValue('--s2'))||8
	const [x,y]=project(vals)
	if(Number.isFinite(x)&&Number.isFinite(y)){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=color;ctx.fillRect(-unit/2,-unit/2,unit,unit);ctx.strokeStyle=paper;ctx.lineWidth=2;ctx.strokeRect(-unit/2,-unit/2,unit,unit);ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.strokeRect(-unit/2-1,-unit/2-1,unit+2,unit+2);ctx.restore()}
	return true
}
