// GPU kernels for the dossier — the plane fields, the channel bars and the 3D
// solid rendered by the library's own verified shader chunks (color-space/gl),
// compiled per space. Exact math on every pixel: OSA-UCS's bracketed inverse,
// CAM16, HCT run at full resolution with no cost-fitted degradation; gamut
// limits (sRGB/P3/Rec.2020) cut per-pixel through the real conversion chain;
// a re-render is one uniform update, so everything tracks a drag live.
//
// Programs link ASYNCHRONOUSLY (KHR_parallel_shader_compile when available):
// callers get 'pending' and paint their JS fallback instantly; setGLReady's
// callback fires when a program lands, and the next paint upgrades to GPU —
// the modal never waits on a shader compile. JS paths remain the no-WebGL2
// fallback; numeric and palette lenses run here too. Measured-dataset spaces (munsell)
// ride the same chunks via the `lut` contract — see bindLuts.
import { glsl, graph, chunks, luts } from '../../dist/color-space-gl.js'
import { physBound, space, meta, pathToRgb, classify, locus, d65, visSolid, visWhite } from './core.js'
import NAMES from './names.js'
import * as PALS from './palettes.js'

const san = s => s.replace(/-/g, '')
const dimOf = s => chunks[s]?.dim || 3
const VT = { 1: 'float', 2: 'vec2', 3: 'vec3', 4: 'vec4' }

// one shared offscreen WebGL2 canvas renders every plane and bar, blitted into
// each 2d canvas — existing DOM, cluster modes and fallbacks stay intact.
// An OffscreenCanvas where supported: only it offers transferToImageBitmap, the
// GPU-side frame transport the catalog strips ride (see paintBarGL) — drawImage
// into a small 2D canvas looks like a blit but is a sync pipeline flush + CPU
// readback (small canvases are CPU-backed).
const CV = typeof document !== 'undefined' ? (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas')) : null
const G = CV && (CV.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false }) || null)

let readyCb = null
/** Called whenever an async program finishes linking — repaint to upgrade. */
export const setGLReady = fn => { readyCb = fn }

// async link tracking: create+link now, read status later (no compile stall).
// ONE shared poller walks every linking program — a timer per program meant a
// sync GPU-process round trip per program per 25ms while the driver was busiest.
const linking = new Set()
let linkT = 0
function pollLinks() {
	linkT = 0
	for (const st of linking) {
		const gl = st.gl
		const ext = gl._pcExt !== undefined ? gl._pcExt : (gl._pcExt = gl.getExtension('KHR_parallel_shader_compile'))
		if (ext && !gl.getProgramParameter(st.pr, ext.COMPLETION_STATUS_KHR)) continue
		linking.delete(st)
		st.pending = false
		if (!gl.getProgramParameter(st.pr, gl.LINK_STATUS)) {
			const shaders=gl.getAttachedShaders(st.pr)||[], logs=shaders.map(s=>gl.getShaderInfoLog(s)).filter(Boolean).join('\n')
			console.warn(`color-space/gl link${st.label?' '+st.label:''}:`,gl.getProgramInfoLog(st.pr),logs)
			st.bad = true
		} else st.resolve && st.resolve(st)
		st.onSettle && st.onSettle()
		readyCb && readyCb()
	}
	if (linking.size) linkT = setTimeout(pollLinks, 25)
}
function track(gl, pr, resolve, st = {}) {
	st.pr = pr; st.pending = true; st.bad = false; st.gl = gl; st.resolve = resolve
	linking.add(st)
	if (!linkT) linkT = setTimeout(pollLinks, 0)
	return st
}
function build(gl, vsSrc, fsSrc, resolve, preLink, st) {
	const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o }
	const pr = gl.createProgram()
	gl.attachShader(pr, sh(gl.VERTEX_SHADER, vsSrc))
	gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fsSrc))
	if (preLink) preLink(pr)   // transform-feedback varyings must precede the link
	gl.linkProgram(pr)
	return track(gl, pr, resolve, st)
}

/** Is the GPU plane kernel possible for this space? */
export const hasPlaneGL = s => !!G && (s === 'rgb' || !!graph[s]) && dimOf(s) >= 2 && dimOf(s) <= 4

// ── measured-dataset LUTs (munsell's renotation): a composed source that reads one
// declares `uniform sampler2D <name>tex` — upload the chunk-declared data once per
// context (RGBA32F, NEAREST — texelFetch is exact) and rebind at draw ──
const lutTex = new WeakMap()   // gl context → { lut name: WebGLTexture }
const lutNames = (src) => Object.keys(luts).filter(n => src.includes(n + 'tex'))
const LUT0 = 8   // first texture unit for LUTs — clear of the image unit
function bindLuts(gl, st) {
	if (!st.lutN || !st.lutN.length) return
	const cache = lutTex.get(gl) ?? lutTex.set(gl, {}).get(gl)
	st.lutN.forEach((n, k) => {
		gl.activeTexture(gl.TEXTURE0 + LUT0 + k)
		if (cache[n]) gl.bindTexture(gl.TEXTURE_2D, cache[n])
		else { const t = cache[n] = gl.createTexture(), l = luts[n]
			gl.bindTexture(gl.TEXTURE_2D, t)
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, l.w, l.h, 0, gl.RGBA, gl.FLOAT, l.data())
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE) }
		gl.uniform1i(gl.getUniformLocation(st.pr, n + 'tex'), LUT0 + k) })
	gl.activeTexture(gl.TEXTURE0)
}

// ── plane/bar kernel: fragment shader sweeps channel a (and b unless b<0) ──
const FSQ_VS = `#version 300 es
void main() { gl_Position = vec4(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0, 0.0, 1.0); }`

// ONE program per space: the swept channel indices ride a uniform (uAB), so all
// three bars and every plane pair share a single compile — six programs' worth of
// identical conversion library collapsed into one. Compiles run through a small
// QUEUE (max 4 in flight): a burst of new spaces (fast scroll) no longer jams the
// GPU process, so the page's sync GL calls never stall behind a deep driver queue.
const planeProgs = new Map()   // s → { pr, pending, bad, u?, lutN }
const QMAX = 4, compileQ = []
let compiling = 0
const pump = () => { while (compiling < QMAX && compileQ.length) compileQ.shift()() }

// The canonical-roundtrip lens presumes a faithful inverse: space→rgb→clamp→space
// must return the coordinate it left for every REAL (in-gamut) address. Folds fail
// it DEEP — hwb's w+b>100 collapse, hsm's mirror land 20–50% of span away — and
// deserve the ghost. But a space whose inverse is only approximate (coloroid's
// inconsistent hue table, oklch's achromatic hue) fails SHALLOW, a few % past the
// 3% law, and there the lens measures imprecision, not aliasing: at f32 the
// boundary flickers pixel-to-pixel into salt-noise dots over real colors. Probed
// here once per space in f64 over an off-lattice grid: failures with a shallow
// median (< 15% of span) mean no folds to catch — the lens is omitted.
const rtFaith = new Map()
export function rtFaithful(s) {
	if (rtFaith.has(s)) return rtFaith.get(s)
	let ok = true
	try {
		const ch = space[s].range, d = ch.length, spans = ch.map(([a, b]) => b - a)
		const errs = [], N = 9
		for (let n = 0; n < N ** d; n++) {
			let m = n; const v = ch.map((r, k) => { const t = ((m % N) + 0.37) / N; m = Math.floor(m / N); return r[0] + spans[k] * t })
			let rgb; try { rgb = space[s].rgb(...v) } catch { continue }
			if (!rgb.every(u => u >= -0.5 && u <= 255.5)) continue
			let bk; try { bk = space.rgb[s](...rgb.map(u => u < 0 ? 0 : u > 255 ? 255 : u)) } catch { continue }
			if (!bk.every(isFinite)) { errs.push(1); continue }
			const e = Math.max(...bk.map((b, k) => { let dd = Math.abs(b - v[k]); if (ch[k][1] === 360) dd = Math.min(dd, 360 - dd); return dd / spans[k] }))
			if (e > 0.03) errs.push(e)
		}
		errs.sort((a, b) => a - b)
		ok = !errs.length || errs[Math.floor((errs.length - 1) / 2)] >= 0.15
	} catch { ok = true }
	rtFaith.set(s, ok)
	return ok
}

function planeFS(s) {
	const d = dimOf(s), vt = VT[d]
	// Munsell's measured solid has a direct local-rim predicate in its LUT. Using
	// its iterative inverse merely to rediscover that boundary made every plane
	// compile and execute the 760-node search per pixel.
	const faithful = s !== 'rgb' && d <= 3 && s !== 'munsell' && rtFaithful(s)
	const pairs = s === 'rgb' ? [['rgb', 'xyz']] : [[s, 'rgb'], [s, 'xyz']]
	pairs.push(['xyz', 'lrgb'], ['xyz', 'p3-linear'], ['xyz', 'rec2020-linear'], ['rgb', 'oklab'], ['oklab', 'rgb'], ['rgb', 'lab'])   // oklab both ways — the cluster lenses (uClu) live in it
	// the canonical-roundtrip lens (below) needs the INTO-space edge per display gamut
	if (faithful) pairs.push(['rgb', s], [s, 'p3'], ['p3', s], [s, 'rec2020'], ['rec2020', s])
	const lib = glsl(pairs)
	// a folded coordinate (HSM's mirrored inverse) converts to a plausible color yet
	// reads back DIFFERENT — not a real color of the shown volume. Same law as the
	// solid's caps and the picker line: 3% of span, hue wrap-aware. Spans are baked
	// as literals per space; NaN roundtrips fail the comparison too.
	const cch = s === 'rgb' ? null : classify(s).ch
	const hueK = s === 'rgb' ? -1 : (classify(s).angle?.i ?? -1)
	const spans = s === 'rgb' ? '' : `const float SPAN[${d}] = float[${d}](${cch.slice(0, d).map(c => (c.max - c.min).toFixed(6)).join(', ')});`
	// dim>3 over the 3D color manifold is many-to-one BY DESIGN (cmyk's undercolor
	// freedom): every coordinate is a legitimate address of the color it shows, so the
	// canonical-roundtrip lens would ghost nearly the whole field — skip it.
	// The lens also presumes a FAITHFUL inverse — see rtFaithful.
	const rt = !faithful ? '' : `
		else {
			${vt} bk;
			if (uGam == 1) bk = rgb_${san(s)}(clamp(${san(s)}_rgb(v), 0.0, 255.0));
			else if (uGam == 2) bk = p3_${san(s)}(clamp(${san(s)}_p3(v), 0.0, 1.0));
			else bk = rec2020_${san(s)}(clamp(${san(s)}_rec2020(v), 0.0, 1.0));
			for (int k = 0; k < ${d}; k++) {
				float dq = abs(bk[k] - v[k]);
				${hueK >= 0 ? `if (k == ${hueK}) dq = min(dq, SPAN[k] - dq);` : ''}
				if (!(dq <= SPAN[k] * 0.03)) al = 0.5;
			}
		}`
	const nativeRim = s === 'munsell' ? `
	else if (v.z > munsell_maxc_(v.x, v.y) + 0.0001) al = 0.0;` : ''
	const vswz = 'xyzw'.slice(0, d).split('').map(c => `uV.${c}`).join(', ')
	return `#version 300 es
precision highp float;
precision highp int;
${lib}
${spans}
${locusGLSL()}
${namedGLSL()}
${visSolidGLSL()}
uniform vec4 uV;          // held channel values
uniform ivec2 uAB;        // swept channel indices: x horizontal, y vertical (-1 = bar)
uniform vec2 uRX, uRY;    // swept ranges (pan/zoom-windowed)
uniform vec2 uRes;
uniform float uQ;         // numeric coordinate lattice (0 = smooth)
uniform int uGam;         // 0 off · 1 srgb · 2 p3 · 3 rec2020 · 4 human (spectral locus)
uniform int uWeb;         // web-safe output snap
uniform int uPolar;       // 1 → the field is a hue DISC: angle→a, radius→b
uniform int uTri;         // cone-family vertical section: 1 cone · 2 bicone · 3 W+B triangle
uniform int uClu;         // color-cluster lens: 1 nearest CSS named color · 2 even OKLab grid
out vec4 O;
void main() {
	vec2 f = gl_FragCoord.xy / uRes;
	float fa, fb;
	if (uPolar == 1) {
		vec2 pc = f * 2.0 - 1.0;
		float rr = length(pc);
		if (rr > 1.0) { O = vec4(0.0); return; }
		// clockwise from +x — the same handedness as the solid seen from ABOVE,
		// so the disc reads as the 3D top view
		fa = fract(-atan(pc.y, pc.x) / 6.283185307179586);
		fb = rr;
	} else { fa = f.x; fb = f.y; }
	if (uTri != 0) {   // the solid's own silhouette, centred in the frame: outside it there is no coordinate at all
		if (uTri == 3) {   // W+B wedge, barycentric: white top-left, black bottom-left, pure hue at the right apex
			float lw = fb - 0.5 * fa, lb = 1.0 - fb - 0.5 * fa;
			if (lw < 0.0 || lb < 0.0) { O = vec4(0.0); return; }
			fa = lw; fb = lb;
		} else {
			float tw = uTri == 1 ? fb : 1.0 - abs(2.0 * fb - 1.0);   // row width: cone tapers to black, bicone to both poles
			float x0 = 0.5 - 0.5 * tw;   // centred row — the gray axis is the left slanted edge
			if (tw <= 0.0 || fa < x0 || fa > x0 + tw) { O = vec4(0.0); return; }
			fa = (fa - x0) / tw;
		}
	}
	if (uQ > 0.5) { fa = (min(uQ - 1.0, floor(fa * uQ)) + 0.5) / uQ; fb = (min(uQ - 1.0, floor(fb * uQ)) + 0.5) / uQ; }
	${vt} v = ${vt}(${vswz});
	for (int k = 0; k < ${d}; k++) {
		if (k == uAB.x) v[k] = uRX.x + (uRX.y - uRX.x) * fa;
		else if (k == uAB.y) v[k] = uRY.x + (uRY.y - uRY.x) * fb;
	}
	vec3 rgb = ${s === 'rgb' ? 'vec3(v[0], v[1], v[2])' : `${san(s)}_rgb(v)`};
	if (isnan(rgb.x) || isnan(rgb.y) || isnan(rgb.z)) rgb = vec3(0.0);
	rgb = clamp(rgb, 0.0, 255.0);
	if (uClu == 1) {   // a palette lens — OKLab Voronoi cells of the bound palette's sites
		rgb = named_(floor(rgb + 0.5));
	} else if (uClu == 2) {   // the JND lens — a neutral-centered OKLab grid at ~one just-noticeable step
		vec3 okp = rgb_oklab(floor(rgb + 0.5));
		okp = vec3((floor(min(okp.x, .9999) / .023) + .5) * .023, round(okp.y / .023) * .023, round(okp.z / .023) * .023);
		rgb = floor(clamp(oklab_rgb(okp), 0.0, 255.0) + 0.5);
	} else if (uClu == 3) {   // the 16-bit lens — RGB565 hardware depth
		rgb = floor(floor(rgb / 255.0 * vec3(31.0, 63.0, 31.0) + 0.5) / vec3(31.0, 63.0, 31.0) * 255.0 + 0.5);
	}
	float al = 1.0;
	// physicality is lens-independent: past the space's linear-light ceiling (±4×
	// diffuse white for SDR display spaces, 500× for scene-referred/HDR) the formula's
	// continuation is clamp noise, not color (Luv's v'→0 pole, CAM16 divergence) —
	// void. The gamut ghost applies only when a lens is selected.
	vec3 xyz = ${s === 'rgb' ? 'rgb_xyz(vec3(v[0], v[1], v[2]))' : `${san(s)}_xyz(v)`};
	vec3 lin = uGam == 2 ? xyz_p3linear(xyz) : uGam == 3 ? xyz_rec2020linear(xyz) : xyz_lrgb(xyz);
	if (!(lin.x > -4.0 && lin.x < ${physBound(s)}.0 && lin.y > -4.0 && lin.y < ${physBound(s)}.0 && lin.z > -4.0 && lin.z < ${physBound(s)}.0)) al = 0.0;${nativeRim}
	// a chromaticity off the spectral locus is imaginary at ANY luminance — not a colour
	// under ANY lens — so it VOIDS, always (not only under the human lens). Lab/OKLab/…
	// range boxes reach far past the visible spectrum; without this the plane paints those
	// imaginary coords as pickable ghost, so the gamut looks vastly bigger than the eye's.
	else if (uWeb == 0 && uClu == 0 && !visXYZ(xyz)) al = 0.0;
	// the HUMAN lens then cuts by the object-colour solid — the very body the 3D view
	// tessellates. The locus alone admits any luminance for a real chromaticity, so the
	// picker used to paint a far larger field than the solid's cross-section: same word,
	// two shapes, and the plane read as if zoomed against the solid.
	else if (uGam == 4 && uWeb == 0 && uClu == 0 && !inVisSolid(xyz)) al = 0.0;
	// the display lenses instead GHOST real-but-undisplayable colours on top
	else if (uGam != 0 && uGam != 4 && uWeb == 0 && uClu == 0) {
		// gamut pad in ENCODED units (±half a code value) — a linear pad is ~16 code
		// values near black, over-painting scale-invariant chroma there (TSL's dark
		// saturation swept far past the solid's own wall)
		vec3 enc = mix(lin * 12.92, 1.055 * pow(max(lin, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
		if (any(lessThan(enc, vec3(-0.002))) || any(greaterThan(enc, vec3(1.002)))) al = 0.5;${rt}
	}
	if (uWeb == 1) rgb = floor(rgb / 51.0 + 0.5) * 51.0;
	O = vec4(rgb / 255.0, al);
}`
}

function planeProg(s) {
	if (planeProgs.has(s)) return planeProgs.get(s)
	const st = { pr: null, pending: true, bad: false, u: null, lutN: null, label:`plane ${s}` }
	planeProgs.set(s, st)
	compileQ.push(() => {
		compiling++
		st.onSettle = () => { compiling--; pump() }
		// one try over codegen AND program creation — any throw must settle the slot,
		// or the queue would jam with `compiling` stuck high
		try { const fs = planeFS(s); st.lutN = lutNames(fs); build(G, FSQ_VS, fs, null, null, st) }
		catch(e) { console.warn(`color-space/gl plane ${s}:`,e.message); st.pending = false; st.bad = true; st.onSettle() }
	})
	pump()
	return st
}

/** 'ready' | 'pending' | 'no' — starts the async compile on first ask. */
export function planeGLStatus(s) {
	if (!hasPlaneGL(s)) return 'no'
	const st = planeProg(s)
	return st.bad ? 'no' : st.pending ? 'pending' : 'ready'
}

/**
 * Start compiling a space's programs ahead of need (hover, prev/next neighbours):
 * the shared plane/bar program and the 3D solid link in the background, so the
 * dossier opens straight into full-quality GPU paint.
 * @param {string} s space name
 */
export function warmGL(s) {
	if (hasPlaneGL(s)) planeProg(s)
	if (has3dGL(s)) mesh3Progs(mesh3State(mesh3Canvas()), s)
}

// 4 = the HUMAN lens: not a display gamut but the object-colour solid the 3D view
// draws — see visSolidGLSL (the locus below still voids imaginary coords in EVERY lens)
const GAMI = { srgb: 1, p3: 2, rec2020: 3, vis: 4 }

// The spectral locus as shader source: the polygon plus the even-odd test that says
// whether a chromaticity is a colour at all. ONE law, three surfaces — the xy panel
// draws this boundary, and the plane and bar kernels void past it under the human
// lens, so a coordinate no light can produce reads as void everywhere it appears.
// Every fixed palette shares one machinery. Palette sites are preconverted to
// OKLab on the CPU and uploaded beside their RGB values; each fragment converts its
// input once. A compact RGB lattice supplies 27 nearby candidates, whose exact
// OKLab distances keep edges smooth without scanning hundreds of sites per pixel.
// Small palettes are both cheaper and exact as a direct texture loop.
const PAL_UNIT=7, SITE_UNIT=6, PAL_DIRECT=32
const dedupe=(list)=>[...new Map(list.map(([,rgb])=>[rgb.join(','),rgb])).values()]
const PALETTES={ names:{rgb:dedupe(Object.entries(NAMES).map(([n,v])=>[n,v])),N:65},
	xkcd:{rgb:dedupe(PALS.xkcd),N:33}, tailwind:{rgb:dedupe(PALS.tailwind),N:49},
	pico8:{rgb:dedupe(PALS.pico8),N:65}, ansi:{rgb:dedupe(PALS.ansi),N:49} }
const palTex=new WeakMap()   // gl → Map(pal → {idx,sites})
// nearest-site ORDER under each metric — one source for shader and page (index.html imports these)
export const METRICS=['oklab','de2000','de76','redmean']
// CIEDE2000, Sharma/Wu/Dalal 2005 — reproduces their canonical pairs exactly (2.0425 · 2.8615 · 3.4412)
const de2000=(p,s)=>{ const R=Math.PI/180
	const C1=Math.hypot(p[1],p[2]),C2=Math.hypot(s[1],s[2]),Cm0=(C1+C2)/2
	const G=.5*(1-Math.sqrt(Cm0**7/(Cm0**7+25**7)))
	const A1=p[1]*(1+G),A2=s[1]*(1+G)
	const c1=Math.hypot(A1,p[2]),c2=Math.hypot(A2,s[2])
	const h1=c1?(Math.atan2(p[2],A1)/R+360)%360:0, h2=c2?(Math.atan2(s[2],A2)/R+360)%360:0
	const dL=s[0]-p[0], dC=c2-c1
	let dh=h2-h1; if(c1*c2===0) dh=0; else if(dh>180) dh-=360; else if(dh<-180) dh+=360
	const dH=2*Math.sqrt(c1*c2)*Math.sin(dh/2*R)
	const Lm=(p[0]+s[0])/2, cm=(c1+c2)/2
	let hm=h1+h2; if(c1*c2!==0){ hm=(h1+h2)/2; if(Math.abs(h1-h2)>180) hm+=(h1+h2)<360?180:-180 }
	const T=1-.17*Math.cos((hm-30)*R)+.24*Math.cos(2*hm*R)+.32*Math.cos((3*hm+6)*R)-.20*Math.cos((4*hm-63)*R)
	const SL=1+.015*(Lm-50)**2/Math.sqrt(20+(Lm-50)**2), SC=1+.045*cm, SH=1+.015*cm*T
	const RT=-Math.sin(2*30*Math.exp(-(((hm-275)/25)**2))*R)*2*Math.sqrt(cm**7/(cm**7+25**7))
	return Math.sqrt((dL/SL)**2+(dC/SC)**2+(dH/SH)**2+RT*(dC/SC)*(dH/SH)) }
export const siteDist=(m,q,s)=>m==='de2000'?de2000(q.lab,s.lab)
	:m==='de76'?(q.lab[0]-s.lab[0])**2+(q.lab[1]-s.lab[1])**2+(q.lab[2]-s.lab[2])**2
	:m==='redmean'?(rm=>(2+rm/256)*(q.rgb[0]-s.rgb[0])**2+4*(q.rgb[1]-s.rgb[1])**2+(2+(255-rm)/256)*(q.rgb[2]-s.rgb[2])**2)((q.rgb[0]+s.rgb[0])/2)
	:(q.ok[0]-s.ok[0])**2+(q.ok[1]-s.ok[1])**2+(q.ok[2]-s.ok[2])**2
const palData=(p,metric='oklab')=>{ const P=PALETTES[p]
	P.sites??=P.rgb.map(rgb=>({rgb,ok:space.rgb.oklab(...rgb),lab:space.rgb.lab(...rgb)}))
	// Small palettes are cheaper AND exact as a direct texture loop, under ANY metric —
	// no accelerator at all; bindPalette supplies a 1-texel dummy. Big palettes memoize
	// one candidate lattice per METRIC: nearest-site regions move when "near" changes.
	// (The lattice stays the same fast-but-not-exhaustive candidate scheme — see named_.)
	const direct=P.sites.length<=PAL_DIRECT
	P.lat??={}
	if(!P.lat[metric]){ const N=direct?1:P.N, out=new Uint16Array(N**3); let o=0
		// ΔE2000 is ~50 flops a pair — the full lattice×sites product froze the page for
		// seconds. Shortlist by ΔE76 (same Lab space, 3 flops), exact ΔE2000 only on the
		// top-K: the winner virtually always survives the shortlist, and the fragment
		// re-ranks its candidates under TRUE ΔE2000 anyway (the lattice proposes, the
		// pixel decides — the machinery's standing fast-not-exhaustive contract).
		const K=8, kd=new Float64Array(K), ki=new Int32Array(K)
		if(!direct) for(let z=0;z<N;z++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
			const rgb=[x,y,z].map(v=>Math.round(v/(N-1)*255))
			const q={rgb,ok:space.rgb.oklab(...rgb),lab:space.rgb.lab(...rgb)}
			let bi=0, bd=Infinity
			if(metric==='de2000'&&P.sites.length>K){
				kd.fill(Infinity)
				for(let i=0;i<P.sites.length;i++){ const s=P.sites[i]
					const d=(q.lab[0]-s.lab[0])**2+(q.lab[1]-s.lab[1])**2+(q.lab[2]-s.lab[2])**2
					if(d<kd[K-1]){ let j=K-1; while(j>0&&kd[j-1]>d){ kd[j]=kd[j-1]; ki[j]=ki[j-1]; j-- } kd[j]=d; ki[j]=i } }
				for(let k=0;k<K;k++){ const d=siteDist(metric,q,P.sites[ki[k]]); if(d<bd){bd=d;bi=ki[k]} } }
			else for(let i=0;i<P.sites.length;i++){ const d=siteDist(metric,q,P.sites[i]); if(d<bd){bd=d;bi=i} }
			out[o++]=bi }
		P.lat[metric]={N,out} }
	if(!P.siteData){ const sd=new Float32Array(P.sites.length*3*3)
		P.sites.forEach((s,i)=>{ sd.set(s.ok,i*3); sd.set(s.rgb,(P.sites.length+i)*3); sd.set(s.lab,(P.sites.length*2+i)*3) })
		P.siteData=sd }
	return { sites:P.sites, siteData:P.siteData, texN:P.lat[metric].N, data:P.lat[metric].out } }
let PAL_SRC=null
const namedGLSL=()=>PAL_SRC??=`uniform highp usampler3D uPalIdx;   // per-cell nearest-site index, the ACTIVE palette×metric lattice
uniform highp sampler2D uPalSites;  // row 0: sites in OKLab · row 1: RGB · row 2: CIELAB
uniform int uMetric;                // 0 oklab · 1 de2000 · 2 de76 · 3 redmean — METRICS order, page and shader alike
float de2000_(vec3 p, vec3 s) {   // CIEDE2000, Sharma/Wu/Dalal 2005 — mirrors the JS above line for line
	float R = 0.01745329252;
	float C1 = length(p.yz), C2 = length(s.yz), Cm0 = (C1 + C2) * 0.5;
	float c7 = pow(Cm0, 7.0);
	float G = 0.5 * (1.0 - sqrt(c7 / (c7 + pow(25.0, 7.0))));
	float A1 = p.y * (1.0 + G), A2 = s.y * (1.0 + G);
	float c1 = length(vec2(A1, p.z)), c2 = length(vec2(A2, s.z));
	float h1 = c1 > 0.0 ? mod(degrees(atan(p.z, A1)) + 360.0, 360.0) : 0.0;
	float h2 = c2 > 0.0 ? mod(degrees(atan(s.z, A2)) + 360.0, 360.0) : 0.0;
	float dL = s.x - p.x, dC = c2 - c1;
	float dh = h2 - h1;
	if (c1 * c2 == 0.0) dh = 0.0; else if (dh > 180.0) dh -= 360.0; else if (dh < -180.0) dh += 360.0;
	float dH = 2.0 * sqrt(c1 * c2) * sin(dh * 0.5 * R);
	float Lm = (p.x + s.x) * 0.5, cm = (c1 + c2) * 0.5;
	float hm = h1 + h2;
	if (c1 * c2 != 0.0) { hm = (h1 + h2) * 0.5; if (abs(h1 - h2) > 180.0) hm += (h1 + h2) < 360.0 ? 180.0 : -180.0; }
	float T = 1.0 - 0.17 * cos((hm - 30.0) * R) + 0.24 * cos(2.0 * hm * R) + 0.32 * cos((3.0 * hm + 6.0) * R) - 0.20 * cos((4.0 * hm - 63.0) * R);
	float SL = 1.0 + 0.015 * (Lm - 50.0) * (Lm - 50.0) / sqrt(20.0 + (Lm - 50.0) * (Lm - 50.0));
	float SC = 1.0 + 0.045 * cm, SH = 1.0 + 0.015 * cm * T;
	float m7 = pow(cm, 7.0);
	float RT = -sin(2.0 * 30.0 * exp(-pow((hm - 275.0) / 25.0, 2.0)) * R) * 2.0 * sqrt(m7 / (m7 + pow(25.0, 7.0)));
	float qa = dL / SL, qb = dC / SC, qc = dH / SH;
	return sqrt(qa * qa + qb * qb + qc * qc + RT * qb * qc);
}
float siteDist_(vec3 rgb, vec3 okp, vec3 labp, int i) {
	if (uMetric == 1) return de2000_(labp, texelFetch(uPalSites, ivec2(i, 2), 0).rgb);
	if (uMetric == 2) { vec3 d = labp - texelFetch(uPalSites, ivec2(i, 2), 0).rgb; return dot(d, d); }
	if (uMetric == 3) { vec3 sr = texelFetch(uPalSites, ivec2(i, 1), 0).rgb;
		float rm = (rgb.r + sr.r) * 0.5; vec3 d = rgb - sr;
		return (2.0 + rm / 256.0) * d.r * d.r + 4.0 * d.g * d.g + (2.0 + (255.0 - rm) / 256.0) * d.b * d.b; }
	vec3 d = okp - texelFetch(uPalSites, ivec2(i, 0), 0).rgb; return dot(d, d);
}
vec3 named_(vec3 rgb) {
	int S = textureSize(uPalSites, 0).x;
	vec3 okp = rgb_oklab(rgb); vec3 labp = rgb_lab(rgb); float bd = 1e9; int bi = 0;
	// For a small set (PICO-8), one compact exact loop beats lattice + site fetches —
	// exact under every metric. The big-palette lattice below remains the fast,
	// not-globally-exhaustive candidate scheme.
	if (S <= ${PAL_DIRECT}) {
		for (int i = 0; i < ${PAL_DIRECT}; i++) { if (i >= S) break;
			float ds = siteDist_(rgb, okp, labp, i); if (ds < bd) { bd = ds; bi = i; }
		}
		return texelFetch(uPalSites, ivec2(bi, 1), 0).rgb;
	}
	int N = textureSize(uPalIdx, 0).x;
	vec3 p = clamp(rgb, 0.0, 255.0) / 255.0 * float(N - 1);
	ivec3 c = ivec3(floor(p + 0.5));
	for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
		ivec3 q = clamp(c + ivec3(x,y,z), ivec3(0), ivec3(N - 1));
		int i = int(texelFetch(uPalIdx, q, 0).r);
		float ds = siteDist_(rgb, okp, labp, i); if (ds < bd) { bd = ds; bi = i; }
	}
	return texelFetch(uPalSites, ivec2(bi, 1), 0).rgb;
}`
function bindPalette(gl,locIdx,locSites,pal,metric='oklab'){ if(!locIdx) return
	let m=palTex.get(gl); if(!m){ m=new Map(); palTex.set(gl,m) }
	const key=pal+':'+metric
	let t=m.get(key)
	if(!t){ const P=palData(pal,metric)
		t={ idx:gl.createTexture(), sites:gl.createTexture() }; m.set(key,t)
		gl.activeTexture(gl.TEXTURE0+PAL_UNIT); gl.bindTexture(gl.TEXTURE_3D,t.idx)
		gl.pixelStorei(gl.UNPACK_ALIGNMENT,1)
		gl.texImage3D(gl.TEXTURE_3D,0,gl.R16UI,P.texN,P.texN,P.texN,0,gl.RED_INTEGER,gl.UNSIGNED_SHORT,P.data)
		for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_R,gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_3D,k,v)
		gl.activeTexture(gl.TEXTURE0+SITE_UNIT); gl.bindTexture(gl.TEXTURE_2D,t.sites)
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB32F,P.sites.length,3,0,gl.RGB,gl.FLOAT,P.siteData)
		for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D,k,v) }
	else{ gl.activeTexture(gl.TEXTURE0+PAL_UNIT); gl.bindTexture(gl.TEXTURE_3D,t.idx)
		gl.activeTexture(gl.TEXTURE0+SITE_UNIT); gl.bindTexture(gl.TEXTURE_2D,t.sites) }
	gl.uniform1i(locIdx,PAL_UNIT); if(locSites) gl.uniform1i(locSites,SITE_UNIT); gl.activeTexture(gl.TEXTURE0) }
const Q3I = { web: 101, names: 102, xkcd: 102, tailwind: 102, pico8: 102, ansi: 102, jnd: 103, 565: 104 }
const q3Mode = q => typeof q === 'number' ? q : Q3I[q] || 0
const quant3GLSL = () => `${namedGLSL()}
vec3 quant3_(vec3 c, int mode) {
	vec3 rgb = floor(clamp(c, 0.0, 1.0) * 255.0 + 0.5);
	if (mode == 101) return floor(rgb / 51.0 + 0.5) * 51.0 / 255.0;
	if (mode == 102) return named_(rgb) / 255.0;
	if (mode == 104) return floor(floor(rgb / 255.0 * vec3(31.0, 63.0, 31.0) + 0.5) / vec3(31.0, 63.0, 31.0) * 255.0 + 0.5) / 255.0;
	vec3 okp = rgb_oklab(rgb);   // 103 — the JND grid: ~2.3 ΔE*ab, the eye's own step
	okp = vec3((floor(min(okp.x, .9999) / .023) + .5) * .023, round(okp.y / .023) * .023, round(okp.z / .023) * .023);
	return floor(clamp(oklab_rgb(okp), 0.0, 255.0) + 0.5) / 255.0;
}`

let LOCUS_SRC = null
const locusGLSL = () => LOCUS_SRC ??= ((P) => `const vec2 LOC[${P.length}] = vec2[${P.length}](${P.map((q) => `vec2(${q[0].toFixed(5)}, ${q[1].toFixed(5)})`).join(', ')});
bool inside(vec2 p) {   // even-odd over the closed locus + purple line
	bool c = false;
	for (int i = 0, j = ${P.length} - 1; i < ${P.length}; j = i++) {
		vec2 a = LOC[i], b2 = LOC[j];
		if ((a.y > p.y) != (b2.y > p.y) && p.x < (b2.x - a.x) * (p.y - a.y) / (b2.y - a.y) + a.x) c = !c;
	}
	return c;
}
bool visXYZ(vec3 c) {   // black is a colour; a chromaticity off the locus is imaginary
	float s = c.x + c.y + c.z;
	if (s <= 1e-6) return c.x > -1e-4 && c.y > -1e-4 && c.z > -1e-4;
	return inside(vec2(c.x / s, c.y / s));
}`)(locus())

// The HUMAN solid as shader source — the SAME body visSurf tessellates for the 3D view,
// so the picker's field and the solid's cross-section are one shape. A zonoid is convex,
// so membership is a support test (u·p ≤ h(u)) over sampled directions; the polytope
// CONTAINS the body, so it never clips a real colour.
let VSOL_SRC = null
const visSolidGLSL = () => VSOL_SRC ??= ((D) => `const vec4 VSD[${D.length}] = vec4[${D.length}](${D.map((d) => `vec4(${d[0].toFixed(5)}, ${d[1].toFixed(5)}, ${d[2].toFixed(5)}, ${d[3].toFixed(3)})`).join(', ')});
bool inVisSolid(vec3 c) {   // a colour a surface can show under D65
	for (int i = 0; i < ${D.length}; i++) { vec4 d = VSD[i];
		if (dot(d.xyz, c) > d.w * 1.002) return false;
	}
	return true;
}`)(visSolid())

function drawKernel(st, w, h, vals, a, b, rx, ry, gamut, quant, polar, tri, metric) {
	if (CV.width !== w || CV.height !== h) { CV.width = w; CV.height = h }
	G.viewport(0, 0, w, h)
	G.disable(G.DEPTH_TEST)
	// Flat cluster fills must survive readback byte-for-byte (marker centering uses
	// the painted run); retain hardware dithering only for genuinely smooth fields.
	quant ? G.disable(G.DITHER) : G.enable(G.DITHER)
	G.clearColor(0, 0, 0, 0)
	G.clear(G.COLOR_BUFFER_BIT)
	G.useProgram(st.pr)
	// uniform locations resolve lazily at FIRST DRAW — at resolve time the GPU
	// process is mid-compile-burst and each lookup stalls behind the whole queue
	st.u ??= Object.fromEntries(['uV', 'uAB', 'uRX', 'uRY', 'uRes', 'uQ', 'uGam', 'uWeb', 'uPolar', 'uTri', 'uClu', 'uMetric', 'uPalIdx', 'uPalSites'].map(n => [n, G.getUniformLocation(st.pr, n)]))
	bindLuts(G, st)
	const v4 = [0, 0, 0, 0]; for (let i = 0; i < Math.min(4, vals.length); i++) v4[i] = vals[i]
	G.uniform4f(st.u.uV, ...v4)
	G.uniform2i(st.u.uAB, a, b)
	G.uniform2f(st.u.uRX, rx[0], rx[1])
	G.uniform2f(st.u.uRY, ry[0], ry[1])
	G.uniform2f(st.u.uRes, w, h)
	G.uniform1f(st.u.uQ, typeof quant === 'number' ? quant : 0)
	G.uniform1i(st.u.uGam, GAMI[gamut] || 0)
	G.uniform1i(st.u.uWeb, quant === 'web' ? 1 : 0)
	G.uniform1i(st.u.uPolar, polar ? 1 : 0)
	G.uniform1i(st.u.uTri, tri || 0)
	G.uniform1i(st.u.uClu, PALETTES[quant] ? 1 : quant === 'jnd' ? 2 : quant === '565' ? 3 : 0)
	// sampler units are program state and DEFAULT TO 0 — an int 3D sampler and a float 2D
	// sampler colliding on unit 0 is GL_INVALID_OPERATION on every draw, palette bound or not
	if (st.u.uPalIdx) G.uniform1i(st.u.uPalIdx, PAL_UNIT)
	if (st.u.uPalSites) G.uniform1i(st.u.uPalSites, SITE_UNIT)
	if (st.u.uMetric) G.uniform1i(st.u.uMetric, Math.max(0, METRICS.indexOf(metric || 'oklab')))
	if (PALETTES[quant]) bindPalette(G, st.u.uPalIdx, st.u.uPalSites, quant, metric)
	G.drawArrays(G.TRIANGLES, 0, 3)
}

/**
 * Paint one plane on the GPU and blit it into the plane's 2d canvas.
 * Call only when planeGLStatus(s) is 'ready'. quant is a numeric lattice or one
 * of the output-palette/JND/RGB565 lenses; every lens stays on the GPU path.
 */
export function paintPlaneGL(cv2d, s, vals, a, b, rx, ry, gamut, quant, polar, tri, metric) {
	const st = planeProg(s)
	if (!st.pr || st.bad || st.pending) return false
	drawKernel(st, cv2d.width, cv2d.height, vals, a, b, rx, ry, gamut, quant, polar, tri, metric)
	const ctx = cv2d.getContext('2d')
	ctx.clearRect(0, 0, cv2d.width, cv2d.height)
	ctx.drawImage(CV, 0, 0)
	return true
}

/**
 * Paint a channel bar (1-D sweep of channel `i`, held others) with per-pixel
 * gamut alpha — the smooth version of the stepped CSS mask.
 */
export function paintBarGL(cv2d, s, vals, i, ri, gamut, quant = 0) {
	const st = planeProg(s)
	if (!st.pr || st.bad || st.pending) return false
	drawKernel(st, cv2d.width, cv2d.height, vals, i, -1, ri, [0, 0], gamut, quant)
	// destinations marked ._bmr (catalog strips — never read back) take the frame as
	// an ImageBitmap: transferToImageBitmap + transferFromImageBitmap are synchronous
	// and stay on the GPU. The 2D path remains for the dossier bars, whose pixels
	// paintedBarCenter reads back for palette marker centering.
	if (cv2d._bmr && CV.transferToImageBitmap) { cv2d._bmr.transferFromImageBitmap(CV.transferToImageBitmap()); return true }
	const ctx = cv2d.getContext('2d')
	ctx.clearRect(0, 0, cv2d.width, cv2d.height)
	ctx.drawImage(CV, 0, 0)
	return true
}

/**
 * The same 1-D sweep as a data-URL image, for CSS background use — at rest the
 * catalog strips stay plain DOM (a standing canvas per strip cost a compositor
 * layer each; ~100 of them made every scroll re-Layerize the page). toDataURL on
 * the GL canvas is a SYNC pipeline flush + readback + PNG encode — ~7ms per strip,
 * not the sub-ms it looks like — so this is paid ONLY on the catalog's idle bake
 * walk, budgeted per channel; every interactive paint (boot, scroll-in, drags,
 * settle sweeps) rides paintBarGL's readback-free blit onto the .bgc canvas.
 */
let BAKE = null   // toDataURL lives on HTMLCanvasElement only — the OffscreenCanvas kernel serializes through this bitmap holder
export function barImageURL(s, vals, i, ri, gamut) {
	const st = planeProg(s)
	if (!st.pr || st.bad || st.pending) return null
	drawKernel(st, 512, 1, vals, i, -1, ri, [0, 0], gamut, 0)
	if (!CV.transferToImageBitmap) return CV.toDataURL()
	BAKE ??= Object.assign(document.createElement('canvas'), { width: 512, height: 1 })
	;(BAKE._bmr ??= BAKE.getContext('bitmaprenderer')).transferFromImageBitmap(CV.transferToImageBitmap())
	return BAKE.toDataURL()
}

// ── 3D solid: static cube-surface lattice, converted rgb→space in the VERTEX
// shader — switching spaces is a program switch, no mesh rebuild. A dense
// smooth-shaded surface (no dot cloud), plus the space's own range-box caps
// kept only where the coords are in-sRGB and canonical, tested per PIXEL. ──
// One persistent canvas hosts the solid across modal opens: contexts are a
// scarce browser resource, and reusing it keeps geometry and programs warm.
let M3CV = null
export function mesh3Canvas() {
	if (!M3CV && typeof document !== 'undefined') { M3CV = document.createElement('canvas'); M3CV.className = 'mesh3' }
	return M3CV
}
export const has3dGL = s => (s === 'rgb' || (!!graph[s] && dimOf(s) === 3)) && !!(mesh3Canvas() && mesh3State(mesh3Canvas()))

// shared geometry, built once
let GEO = null
function geometry() {
	if (GEO) return GEO
	const GRID = 128
	// corner-biased lattice: HSL-family maps explode near the white/black corners
	// (the razor-thin tint wall). Mild bias only — over-biasing coarsens the MIDDLE
	// of each face, and cells straddling the ok-family cusp lines then trip the
	// chord discard, punching see-through holes
	const bias = t => { const q = t < 0.5 ? 0.5 * Math.pow(2 * t, 1.35) : 1 - 0.5 * Math.pow(2 * (1 - t), 1.35); return q * 255 }
	const tpos = [], tidx = []
	for (let f = 0; f < 6; f++) {
		const base = tpos.length / 3
		for (let i = 0; i <= GRID; i++) for (let j = 0; j <= GRID; j++) {
			const u = bias(i / GRID), w = bias(j / GRID)
			tpos.push(...[[0, u, w], [255, u, w], [u, 0, w], [u, 255, w], [u, w, 0], [u, w, 255]][f])
		}
		for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
			const k = base + i * (GRID + 1) + j
			tidx.push(k, k + GRID + 1, k + 1, k + GRID + 1, k + GRID + 2, k + 1)
		}
	}
	// range-box cap faces as fractional coords (inset on the fixed axis)
	const CAP = 56, eps = 0.012
	const cpos = [], cidx = []
	for (let fi = 0; fi < 3; fi++) for (let side = 0; side < 2; side++) {
		const [ua, ub] = [0, 1, 2].filter(k => k !== fi)
		const base = cpos.length / 3
		for (let i = 0; i <= CAP; i++) for (let j = 0; j <= CAP; j++) {
			const fr = [0, 0, 0]
			fr[fi] = side ? 1 - eps : eps; fr[ua] = i / CAP; fr[ub] = j / CAP
			cpos.push(...fr)
		}
		for (let i = 0; i < CAP; i++) for (let j = 0; j < CAP; j++) {
			const k = base + i * (CAP + 1) + j
			cidx.push(k, k + CAP + 1, k + 1, k + CAP + 1, k + CAP + 2, k + 1)
		}
	}
	return GEO = {
		tpos: new Float32Array(tpos), tidx: new Uint32Array(tidx),
		cpos: new Float32Array(cpos), cidx: new Uint32Array(cidx),
	}
}

// map3 + view rotation, shared by both vertex shaders (mirrors the JS map3)
const MAP_GLSL = `
uniform vec3 uMin, uMax;  // the box FITTED to the solid (robust extent), not the declared range
uniform vec3 uCMin, uCMax;   // the UNPADDED data extent — where the solid truly ends
uniform ivec4 uMap;   // x=ti  y=ai(-1: none)  z=mi  w unused
uniform ivec2 uWb;    // (wI, bI) for the hwb family, else (-1,-1)
uniform vec2 uRot;
uniform float uScale;
float raw_(vec3 v, int k) { return (v[k] - uMin[k]) / (uMax[k] - uMin[k]); }
// positions are NOT clamped: beyond-fit vertices keep their true direction and the
// fragment clip cuts the triangle exactly at the box — a crisp planar cross-section.
// Clamping instead flattened those triangles onto the box plane as dark spike fans.
// The bake's cone-wall bisection is what bounds a wild formula (HSI's S at optimal
// colors) — every vertex lands ON the sanity window, never past it.
float nrm_(vec3 v, int k) { return raw_(v, k); }
vec3 map3_(vec3 v) {
	if (uWb.x >= 0) {
		float r = max(0.0, 1.0 - nrm_(v, uWb.x) - nrm_(v, uWb.y)) * 0.55;
		float h = raw_(v, uMap.y) * 6.283185307179586;
		return vec3(0.5 - nrm_(v, uWb.y), r * cos(h), r * sin(h));
	}
	float y = nrm_(v, uMap.x) - 0.5;
	if (uMap.y >= 0) {
		float r = nrm_(v, uMap.z) * 0.55;
		float h = raw_(v, uMap.y) * 6.283185307179586;
		return vec3(y, r * cos(h), r * sin(h));
	}
	int o0 = uMap.x == 0 ? 1 : 0;
	int o1 = uMap.x == 2 ? 1 : 2;
	return vec3(y, nrm_(v, o0) - 0.5, nrm_(v, o1) - 0.5);
}
vec4 view_(vec3 n, float zoff) {
	float y = n.x, x = n.y, z = n.z;
	float ca = cos(uRot.x), sa = sin(uRot.x), cb = cos(uRot.y), sb = sin(uRot.y);
	float X1 = x * ca + z * sa;
	float Z1 = -x * sa + z * ca;
	return vec4(X1 * uScale, (y * cb - Z1 * sb) * uScale, -(y * sb + Z1 * cb) * 0.7 - zoff, 1.0);
}`

// soft-knee display projection — the ONE way an out-of-sRGB colour becomes a pixel
// here: desaturate toward its own luma until representable, holding hue and
// lightness, instead of a flat per-channel clamp that over-saturates and hue-shifts
// wide-gamut colours. The surface body computes this same knee in its vertex stage;
// the caps reuse it so a sealed cut face reads the SAME colour as the wall beside it.
const SOFT_DISP = `vec3 softDisp(vec3 disp) {
	float lum = clamp(dot(disp, vec3(0.2126, 0.7152, 0.0722)), 0.0, 255.0);
	float tq = 1.0;
	for (int k = 0; k < 3; k++) {
		float dv = disp[k] - lum;
		if (disp[k] > 255.0) tq = min(tq, (255.0 - lum) / dv);
		if (disp[k] < 0.0) tq = min(tq, (0.0 - lum) / dv);
	}
	return clamp(mix(vec3(lum), disp, pow(clamp(tq, 0.0, 1.0), 0.4)), 0.0, 255.0) / 255.0;
}`

// ── the visible gamut itself: the Rösch–MacAdam optimal-color surface ──
// Every boundary color of human vision is a band reflectance — 1 on a cyclic
// wavelength arc, 0 off it (Schrödinger 1920; MacAdam 1935). Sweeping (arc start,
// arc width) covers the whole closed surface: zero width pinches to black, the
// full band is white, and arcs crossing the 700→380 wrap are the purples.
// Illuminant D65: XYZ integrates the 1931 CMFs WEIGHTED by the D65 spectrum over the
// arc, Y peaks 100 — so a perfect reflector is the D65 white point. Equal-energy E put
// display white (and 3% of sRGB) outside the very solid the atlas compares gamuts to;
// under D65 the whole cube fits, and the pickers can cut by the same body (core's
// inVisSolid) instead of the looser spectral locus.
const VIS = new Map()
export function visSurf(G = 96) {
	if (VIS.has(G)) return VIS.get(G)
	const N = 160   // 380–700 nm at 2 nm
	const cum = [[0, 0, 0]]
	for (let i = 0; i < N; i++) {
		const nm = 380 + (i + 0.5) * 2, w = d65(nm)
		const [X, Y, Z] = space.wavelength.xyz(nm)
		const p = cum[i]
		cum.push([p[0] + X * w, p[1] + Y * w, p[2] + Z * w])
	}
	const tot = cum[N][1]
	const pos = new Float32Array((G + 1) * (G + 1) * 3)
	let o = 0
	for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
		// arc-width rows biased toward the black pole (width→0): opponent spaces
		// stretch the dark skirt wide, and uniform rows leave it faceted
		const a = Math.round(i / G * N) % N, b = a + Math.round(Math.pow(j / G, 1.6) * N)
		let X = cum[Math.min(b, N)][0] - cum[a][0]
		let Y = cum[Math.min(b, N)][1] - cum[a][1]
		let Z = cum[Math.min(b, N)][2] - cum[a][2]
		if (b > N) { X += cum[b - N][0]; Y += cum[b - N][1]; Z += cum[b - N][2] }
		pos[o++] = X / tot * 100; pos[o++] = Y / tot * 100; pos[o++] = Z / tot * 100
	}
	const idx = new Uint32Array(G * G * 6)
	o = 0
	for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
		const q = i * (G + 1) + j
		idx[o++] = q; idx[o++] = q + G + 1; idx[o++] = q + 1
		idx[o++] = q + G + 1; idx[o++] = q + G + 2; idx[o++] = q + 1
	}
	const out = { G, pos, idx }
	VIS.set(G, out)
	return out
}

const mesh3States = new WeakMap()   // canvas → { gl, progs: Map, buffers }
function mesh3State(cv) {
	if (mesh3States.has(cv)) return mesh3States.get(cv)
	// premultiplied compositing: translucent draws (the overflow shell, the slice pane)
	// must read at their own color over the page — a straight-alpha canvas displays
	// blended pixels at source×alpha (the white pane rendered 50% GRAY over paper)
	const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, stencil: true })
	if (!gl) { mesh3States.set(cv, null); return null }
	const geo = geometry(), vsf = visSurf(256)   // dense: the overflow silhouette is the mesh's own edge
	const buf = (data) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b }
	const ibuf = (data) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW); return b }
	const st = { gl, progs: new Map(), draws: new Map(),
		tb: buf(geo.tpos), ti: ibuf(geo.tidx), tn: geo.tidx.length, tvn: geo.tpos.length / 3,
		vb: buf(vsf.pos), vi: ibuf(vsf.idx), vn: vsf.idx.length, vvn: vsf.pos.length / 3,
		cb: buf(geo.cpos), ci: ibuf(geo.cidx), cn: geo.cidx.length }
	// the conversion BAKE lands here (v, rgb, bad — 7 floats a vertex), sized for
	// the larger lattice; one slot — a space/gamut switch simply rebakes
	st.bakeBuf = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, st.bakeBuf)
	gl.bufferData(gl.ARRAY_BUFFER, Math.max(st.tvn, st.vvn) * 28, gl.DYNAMIC_COPY)
	st.bakeKey = null
	mesh3States.set(cv, st)
	return st
}

// the per-frame half of the solid: one shared vertex program maps and rotates BAKED
// attributes. Fragment programs are per space only because 10/20 must color each
// native-coordinate cell by that space's inverse; smooth and output-palette modes
// still consume the baked RGB directly.
const DRAW_VS = `#version 300 es
precision highp float;
precision highp int;
${MAP_GLSL}
in vec3 aV;
in vec3 aRgb;
in float aBad;
out vec3 vRgb;
out vec3 vN;
out vec2 vHueV;
out vec3 vF;
out float vBad;
void main() {
	vec3 v = aV;
	vec3 n = map3_(v);
	vF = v;
	vRgb = aRgb;
	vBad = aBad;
	if (aBad > 0.5 || isnan(n.x) || isnan(n.y) || isnan(n.z)) { vBad = 1.0; gl_Position = vec4(2e4, 2e4, 2e4, 1.0); vRgb = vec3(0.0); vN = vec3(0.0); vHueV = vec2(0.0); vF = vec3(0.0); return; }
	float h = uMap.y >= 0 ? raw_(v, uMap.y) * 6.283185307179586 : 0.0;
	vHueV = vec2(cos(h), sin(h));
	vN = n;
	gl_Position = view_(n, 0.0);
}`


function mesh3Progs(st, s, gam = 'srgb') {
	const key = s + '|' + gam
	if (st.progs.has(key)) return st.progs.get(key)
	const gl = st.gl, S = san(s)
	let out = null
	try {
		const faithful = s !== 'munsell' && rtFaithful(s)
		// the solid's source volume: a display-gamut cube fed through gamut→space, or
		// the visible (Rösch–MacAdam) surface, whose vertices arrive as raw XYZ
		const src = gam === 'vis' ? 'xyz' : gam === 'srgb' ? 'rgb' : gam
		const SRC = san(src)
		const unit = src === 'rgb' || src === 'xyz' ? 'aSrc' : '(aSrc / 255.0)'
		const pairs = []
		if (s !== src) pairs.push([src, s])
		if (src !== 'rgb' && s !== 'rgb') pairs.push([src, 'rgb'])
		// the BAKE: the space conversion, singularity collapse, achromatic taper and
		// display knee run ONCE per (space, gamut) — captured per lattice vertex by
		// transform feedback; the shared DRAW program consumes the capture per frame
		const vs = `#version 300 es
precision highp float;
precision highp int;
${pairs.length ? glsl(pairs) : ''}
${SOFT_DISP}
in vec3 aSrc;
uniform ivec4 uMap;
uniform ivec2 uWb;
uniform ivec2 uBip;   // bipolar (opponent) channel indexes, else -1
uniform int uClip;    // 1 → box-in-base space (all-or-nothing achromatic collapse)
uniform vec3 uWLo, uWHi;   // sanity window for the cone-wall bisection
out vec3 tV;
out vec3 tRgb;
out float tBad;
void main() {
	${VT[3]} v = ${s === src ? unit : `${SRC}_${S}(${unit})`};
	${s !== src ? `// past the encodable cone the coords go non-finite (log of negative light) or
	// fold into finite garbage (a sign-mirrored transfer, HSI's S at optimal colors),
	// and a lone bad vertex shreds its triangles. "Bad" = outside the sanity window;
	// bisect toward the neutral spine until the vertex lands ON the window wall,
	// closing the surface along the intersection. NaN fails the comparisons too.
	vec3 blo = uWLo, bhi = uWHi;
	if (!(v.x > blo.x && v.x < bhi.x && v.y > blo.y && v.y < bhi.y && v.z > blo.z && v.z < bhi.z)) {
		vec3 nw = ${src === 'xyz' ? 'vec3(aSrc.y * 0.9504559, aSrc.y, aSrc.y * 1.0890578)' : 'vec3((aSrc.r + aSrc.g + aSrc.b) / 3.0)'};
		float lo = 0.0, hi = 1.0;
		for (int i = 0; i < 18; i++) {
			float md = (lo + hi) * 0.5;
			vec3 vt = ${SRC}_${S}(mix(nw, aSrc, md) ${src === 'rgb' || src === 'xyz' ? '' : '/ 255.0'});
			if (vt.x > blo.x && vt.x < bhi.x && vt.y > blo.y && vt.y < bhi.y && vt.z > blo.z && vt.z < bhi.z) { lo = md; } else { hi = md; }
		}
		v = ${SRC}_${S}(mix(nw, aSrc, lo) ${src === 'rgb' || src === 'xyz' ? '' : '/ 255.0'});
		if (!(v.x > blo.x && v.x < bhi.x && v.y > blo.y && v.y < bhi.y && v.z > blo.z && v.z < bhi.z)) { v = ${SRC}_${S}(nw ${src === 'rgb' || src === 'xyz' ? '' : '/ 255.0'}); }
	}` : ''}
	// a color indistinguishable from gray (sub-integer channel delta) — or too dark
	// to carry chroma at all (chroma ratios degenerate at black: OSA-UCS's C divides
	// by zero there) — has noise for chroma coordinates (okhsl S at near-white is
	// 0..103 at random). Taper the chroma coords toward the gray axis SMOOTHLY — a
	// hard cliff saws the surface where real chroma meets the collapsed row.
	// ONE law, two sources: the human solid's XYZ is divided by the white it integrates
	// to, which puts its gray axis at r=g=b — the cube's own units — so the same two
	// factors read it. (Judging its darkness by luminance alone crushed deep saturated
	// colours, all of which sit below Y=1, onto the axis: a flat skirt and a needle.)
	${src === 'xyz'
		? `vec3 q = aSrc / vec3(${visWhite().map(v => v.toFixed(4)).join(', ')}) * 255.0;`
		: 'vec3 q = aSrc;'}
	float mx = max(q.r, max(q.g, q.b));
	float dlt = mx - min(q.r, min(q.g, q.b));
	float gf = min(clamp(dlt / 2.5, 0.0, 1.0), clamp((mx - 2.0) / 6.0, 0.0, 1.0));
	// a box-in-base space must collapse all-or-nothing: partially tapered junk
	// (HPLuv's exploding near-white P) would land back INSIDE the box the clip
	// guards — while whole-shape solids need the smooth taper, or the cliff where
	// real chroma meets a collapsed row saws the surface into teeth
	if (uClip == 1 && gf < 1.0) gf = 0.0;
	if (gf < 1.0) {
		if (uMap.y >= 0 && uWb.x < 0) v[uMap.z] *= gf;
		if (uBip.x >= 0) v[uBip.x] *= gf;
		if (uBip.y >= 0) v[uBip.y] *= gf;
	}
	tV = v;
	tBad = (isnan(v.x) || isnan(v.y) || isnan(v.z)) ? 1.0 : 0.0;
	${src === 'rgb' ? 'tRgb = aSrc / 255.0;' : `// an out-of-sRGB vertex desaturates toward its own luma until representable — the
	// closest ACTUAL color, hue and lightness held (vs the flat channel-clamp that
	// painted hyper-greens as one solid green). The caps seal with this SAME knee.
	tRgb = softDisp(${SRC}_rgb(${unit}));`}
	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}`
		const nativeQ=s==='rgb'?'clamp(qv / 255.0, 0.0, 1.0)':`softDisp(${S}_rgb(qv))`
		const fsSurf = `#version 300 es
precision highp float;
precision highp int;
${glsl([['rgb', 'oklab'], ['oklab', 'rgb'], ['rgb', 'lab'], ...(s==='rgb'?[]:[[s, 'rgb']])])}
${SOFT_DISP}
${quant3GLSL()}
in vec3 vRgb; in vec3 vN; in vec2 vHueV; in vec3 vF; in float vBad;
uniform vec3 uCMin, uCMax;
uniform vec3 uDMin, uDMax;   // the DECLARED box — where the slice outline is drawn
uniform int uOut;            // 1 → the solid pierces the declared box
uniform int uClip;           // 1 → box-in-base space: shave past-the-box noise
uniform int uPass;           // 0 = opaque in-box · 1 = translucent beyond-box
uniform ivec4 uMap;
uniform int uHasHue;
uniform int uQuant;          // 0 smooth · 10/20 native-channel cells · 101/102/103 safe/name/even
uniform ivec2 uBip;   // bipolar (opponent) chroma channels, else (-1,-1) — marks a lightness-axis space
uniform ivec2 uCapK;  // pass 2: the capped face (axis, side) whose clipped sheet is stencilled
uniform ivec2 uCut;   // the hovered plane's HELD axis (x, -1 = none) and whether it wraps (y)
uniform vec2 uCutV;   // that axis's held value (x) and full span (y)
out vec4 O;
void main() {
	if (vBad > 0.001) discard;
	// ONLY a box-in-base space clips, at its declared box (tiny ε): past it lies
	// solver wobble (okhsv S at the blue cusp) and the duplicate shell (HPLuv's
	// beyond-safe continuum) — never real shape; the cut wall is closed by the caps.
	// The position bound (spike guard) likewise applies only where clipping does.
	if (uClip == 1) {
		for (int k = 0; k < 3; k++) {
			if (k == uMap.y) continue;
			float sp = (uCMax[k] - uCMin[k]) * 0.004;
			if (vF[k] < uCMin[k] - sp || vF[k] > uCMax[k] + sp) discard;
		}
		if (any(greaterThan(abs(vN), vec3(0.72)))) discard;
	}
	// hue chords: near the gray corners a cell fans across far-apart hues and
	// strings through the solid — where the interpolated hue vector disagrees
	// with the position's own angle, the fragment is off-surface: drop it
	if (uHasHue == 1) {
		float r = length(vN.yz);
		float sat = max(vRgb.r, max(vRgb.g, vRgb.b)) - min(vRgb.r, min(vRgb.g, vRgb.b));
		// achromatic fragments never chord visibly — and at the white/black corners the
		// degenerate fan (hue is float noise there) must render, or the lid opens
		if (r > 0.1 && sat > 0.15) {
			float lh = length(vHueV);
			if (lh < 0.45 || dot(vHueV / lh, normalize(vN.yz)) < 0.5) discard;
		}
	}
	// beyond the DECLARED box the material DISSOLVES: the in-box body is covered
	// whole (opaque pass, writes depth), and the overflow fades from near-solid at
	// the wall to nothing within ~18% of the span (second pass, no depth write) —
	// the full blob isn't viewable anyway; this shows where and how it continues.
	float ob = -1.0;
	if (uOut == 1) for (int k = 0; k < 3; k++) {
		if (k == uMap.y) continue;
		float sp = uDMax[k] - uDMin[k];
		ob = max(ob, max(uDMin[k] - vF[k], vF[k] - uDMax[k]) / sp);
	}
	O = vec4(vRgb, 1.0);
	// The same lens as the bars and planes reaches the solid. Palette lenses posterize
	// sRGB output; 10/20 quantize the interpolated NATIVE coordinate and color the
	// whole cell by its center — filled sections, without changing the gamut geometry.
	if (uQuant >= 101) O.rgb = quant3_(vRgb, uQuant);
	else if (uQuant > 1) {
		vec3 span = max(uDMax - uDMin, vec3(1e-9));
		vec3 f = clamp((vF - uDMin) / span, 0.0, 0.999999);
		vec3 qv = uDMin + (floor(f * float(uQuant)) + 0.5) / float(uQuant) * span;
		O.rgb = ${nativeQ};
	}
	// the tone is clipped HARD to its range: below the floor lies OSA-UCS's chroma pole and its
	// pass 2 — the STENCIL parity sheet for one capped face: exactly the fragments the
	// body clips away past THAT wall (tone-floor clips included: the floor cap seals
	// them). An eye ray crossing this sheet an odd number of times is inside the solid
	// at the cut — the cap quad then paints only there, so the cross-section follows
	// the sliced mesh itself, with no per-pixel inverse validity guessing.
	if (uPass == 2) {
		float dw = uCapK.y == 1 ? vF[uCapK.x] - uDMax[uCapK.x] : uDMin[uCapK.x] - vF[uCapK.x];
		if (dw <= 0.0) discard;
		O = vec4(0.0);
		return;
	}
	// sign-flipped coords, above lies nothing. Only genuine CHROMA overflow haloes past the box;
	// the cap seals the floor. (No outline crease — it read misplaced and off-colour.)
	// clip below the tone floor only, and ONLY for spaces with a real lightness axis (polar/opponent
	// — a hue or bipolar-chroma channel present): the dark/pole side. Additive spaces (ch0 = Red, not
	// a tone) and a high ceiling for HDR/scene spaces are left alone.
	if (uOut == 1 && (uMap.y >= 0 || uBip.x >= 0) && vF[uMap.x] < uDMin[uMap.x]) discard;
	if ((uPass == 0 || uPass == 3) && ob > 0.0) discard;
	if (uPass == 1) {
		if (ob <= 0.0 || ob > 0.3) discard;   // near chroma overflow shows; far pole-fan dropped
		float a = 1.0 - ob / 0.3;
		O.a = a * a * 0.6;   // near-solid at the wall, DISSOLVING to nothing — a constant
		// alpha ends the ghost in a hard angled chop at the 0.3 cutoff instead of a fade
	}
	// the plane∩solid CURVE, as a per-pixel test on the shape itself: a fragment lies on
	// the cut when its held coordinate equals the plane's. fwidth sets the band's width in
	// SCREEN pixels, so the outline rides the real tessellated edge — exactly, everywhere,
	// with none of a marching polyline's coarse chords or dropped segments.
	bool onCut = false;
	if (uCut.x >= 0) {
		float c = vF[uCut.x], w = fwidth(c), d = c - uCutV.x;
		if (uCut.y == 1) d = mod(d + uCutV.y * 1.5, uCutV.y) - uCutV.y * 0.5;   // a hue axis wraps
		// a seam or fold spikes the derivative — banding there would smear across the solid
		onCut = w < uCutV.y * 0.2 && abs(d) < w * 1.1;
	}
	// pass 3 paints the curve ALONE, drawn depth-GREATER so it lands exactly where the body
	// hides it: the far arc still reads, at half weight, the way a hidden line should
	if (uPass == 3) { if (!onCut) discard; O = vec4(1.0, 1.0, 1.0, 0.38); return; }
	if (onCut) O = vec4(1.0, 1.0, 1.0, O.a);
}`
		// caps: the space's own range-box faces. Display gamuts keep them only where
		// the coords are in-gamut AND canonical (roundtrip), tested per PIXEL; the
		// human view instead stencils the sliced mesh itself (see the uPass-2 parity)
		const vsCap = `#version 300 es
precision highp float;
precision highp int;
${MAP_GLSL}
in vec3 aFrac;
out vec3 vV;
void main() {
	vec3 v = uCMin + aFrac * (uCMax - uCMin);
	vV = v;
	gl_Position = view_(map3_(v), 0.002);
}`
		// human-view caps carry NO per-pixel validity of their own: the stencil parity
		// pass (uPass 2) marks exactly where the eye ray is inside the sliced solid at
		// the wall — a per-pixel inverse can pick a wrong root at a fold and either
		// paint impossible colors or shave the true cross-section. The quad only colors.
		const fsCapVis = gam === 'vis' && s !== src && `#version 300 es
precision highp float;
precision highp int;
${glsl([[s, 'rgb']])}
${SOFT_DISP}
in vec3 vV;
out vec4 O;
void main() {
	vec3 disp = ${S}_rgb(vV);
	if (isnan(disp.x) || isnan(disp.y) || isnan(disp.z)) discard;
	O = vec4(softDisp(disp), 1.0);
}`
		const glin = { srgb: 'lrgb', p3: 'p3-linear', rec2020: 'rec2020-linear' }[gam]
		const GLIN = glin && san(glin), G0 = san(gam === 'srgb' ? 'rgb' : gam)
		const capPairs = glin && [[s, 'rgb'], [s, 'xyz'], ['xyz', glin], [s, gam === 'srgb' ? 'rgb' : gam]]
		if (faithful && glin) capPairs.push([gam === 'srgb' ? 'rgb' : gam, s])
		const fsCap = fsCapVis || glin && `#version 300 es
precision highp float;
precision highp int;
${glsl(capPairs)}
${SOFT_DISP}
in vec3 vV;
uniform vec3 uMin, uMax;
uniform ivec4 uMap;
out vec4 O;
void main() {
	vec3 lin = xyz_${GLIN}(${S}_xyz(vV));
	// pad in ENCODED units — a linear pad is several code values wide at black
	vec3 enc = mix(lin * 12.92, 1.055 * pow(max(lin, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
	if (!(enc.x >= -0.002 && enc.x <= 1.002 && enc.y >= -0.002 && enc.y <= 1.002 && enc.z >= -0.002 && enc.z <= 1.002)) discard;
	vec3 disp = ${S}_rgb(vV);
	if (isnan(disp.x) || isnan(disp.y) || isnan(disp.z)) discard;
	${s === 'munsell' ? 'if (vV.z > munsell_maxc_(vV.x, vV.y) + 0.0001) discard;' : ''}
	${faithful ? `vec3 gv = ${gam === 'srgb' ? 'clamp(disp, 0.0, 255.0)' : `clamp(${S}_${G0}(vV), 0.0, 1.0)`};
	vec3 back = ${G0}_${S}(gv);
	for (int k = 0; k < 3; k++) {
		float d = abs(back[k] - vV[k]);
		if (uMap.y == k) d = min(d, 360.0 - d);
		if (!(d <= (uMax[k] - uMin[k]) * 0.03)) discard;   // NaN fails too
	}` : `// canonical-roundtrip discard omitted: this space's inverse is approximate
	// (see rtFaithful) — the law would speckle-discard real cap fragments`}
	O = vec4(softDisp(disp), 1.0);
}`
		const U = ['uMin', 'uMax', 'uCMin', 'uCMax', 'uDMin', 'uDMax', 'uWLo', 'uWHi', 'uOut', 'uClip', 'uPass', 'uMap', 'uWb', 'uBip', 'uCapK', 'uCut', 'uCutV', 'uRot', 'uScale', 'uHasHue', 'uQuant', 'uMetric', 'uPalIdx', 'uPalSites']
		const uset = (o) => { o.u = Object.fromEntries(U.map(n => [n, gl.getUniformLocation(o.pr, n)])) }
		const bake = build(gl, vs, '#version 300 es\nprecision highp float;\nvoid main() {}', (o) => {
			o.aSrc = gl.getAttribLocation(o.pr, 'aSrc'); uset(o)
		}, (pr) => gl.transformFeedbackVaryings(pr, ['tV', 'tRgb', 'tBad'], gl.INTERLEAVED_ATTRIBS))
		bake.lutN = lutNames(vs)
		// The draw program is shared across gamuts but not spaces: native 10/20 cells
		// need this space's own inverse to color each section by its coordinate center.
		if (!st.draws.has(s)) st.draws.set(s,build(gl, DRAW_VS, fsSurf, (o) => {
			o.aV = gl.getAttribLocation(o.pr, 'aV'); o.aRgb = gl.getAttribLocation(o.pr, 'aRgb'); o.aBad = gl.getAttribLocation(o.pr, 'aBad')
			uset(o)
		}))
		const draw=st.draws.get(s)
		// Native 10/20 coloring runs space→RGB in the DRAW fragment shader. Measured
		// spaces therefore need their LUT here too; without it Munsell sections read
		// the default unit-0 texture and the whole quantized solid rendered black.
		draw.lutN = lutNames(fsSurf)
		const caps = !fsCap || s === src ? null : build(gl, vsCap, fsCap, (o) => {
			o.aFrac = gl.getAttribLocation(o.pr, 'aFrac'); uset(o)
		})
		if (caps) caps.lutN = lutNames(fsCap)
		out = { bake, caps, draw }
	} catch(e) { console.warn(`color-space/gl solid ${s}:`,e.message); out = null }
	st.progs.set(key, out)
	return out
}

/**
 * Draw the sRGB solid of space `s` on the GPU (false → JS fallback / pending;
 * a pending program repaints via the setGLReady callback once linked).
 * map = { min:[3], max:[3], ti, ai, mi, wI, bI } — the same axes the JS map3 uses.
 */
/** Compile a space's 3-D programs ahead of need (hover, neighbours) — the modal
 *  then opens straight into the full-quality solid instead of a preview. */
export function warmMesh3(s, gam = 'srgb') {
	if (!has3dGL(s)) return
	const st = mesh3State(mesh3Canvas())
	if (st) mesh3Progs(st, s, gam)
}

// the hovered slice plane, drawn as GEOMETRY in the same scene: the depth buffer
// resolves the intersection with the body per pixel — hidden inside and behind it,
// visible in front and beyond — the classic way. Vertices arrive in model space.
function sheetProg(st) {
	if (st.sheetP !== undefined) return st.sheetP
	const gl = st.gl
	const mk = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o)
		return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null }
	const vs = mk(gl.VERTEX_SHADER, `#version 300 es
precision highp float;
in vec3 aPos;
uniform vec2 uRot;
uniform float uScale;
void main() {
	float y = aPos.x, x = aPos.y, z = aPos.z;
	float ca = cos(uRot.x), sa = sin(uRot.x), cb = cos(uRot.y), sb = sin(uRot.y);
	float X1 = x * ca + z * sa;
	float Z1 = -x * sa + z * ca;
	gl_Position = vec4(X1 * uScale, (y * cb - Z1 * sb) * uScale, -(y * sb + Z1 * cb) * 0.7, 1.0);
}`)
	const fs = mk(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
uniform vec4 uTint;
out vec4 O;
void main() { O = uTint; }`)
	if (!vs || !fs) return st.sheetP = null
	const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr)
	if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return st.sheetP = null
	return st.sheetP = { pr, aPos: gl.getAttribLocation(pr, 'aPos'),
		uRot: gl.getUniformLocation(pr, 'uRot'), uScale: gl.getUniformLocation(pr, 'uScale'),
		uTint: gl.getUniformLocation(pr, 'uTint'), buf: gl.createBuffer() }
}

// the pane's frame ribbons arrive ALREADY in clip space (the hud extrudes them to
// screen-true widths); here they only meet the depth buffer — full in the open,
// ghosted where the body is IN FRONT. The stencil dedups the joins' overlaps so
// translucent strokes never bead.
function frameProg(st) {
	if (st.frameP !== undefined) return st.frameP
	const gl = st.gl
	const mk = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o)
		return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null }
	const vs = mk(gl.VERTEX_SHADER, `#version 300 es
precision highp float;
in vec3 aPos;
void main() { gl_Position = vec4(aPos, 1.0); }`)
	const fs = mk(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
uniform vec4 uTint;
out vec4 O;
void main() { O = uTint; }`)
	if (!vs || !fs) return st.frameP = null
	const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr)
	if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return st.frameP = null
	return st.frameP = { pr, aPos: gl.getAttribLocation(pr, 'aPos'),
		uTint: gl.getUniformLocation(pr, 'uTint'), buf: gl.createBuffer() }
}

export function drawMesh3GL(cv, s, map, rot, scale, sheet, frame, cut, quant = 0, metric = 'oklab') {
	if (!has3dGL(s)) return false
	const gam = map?.gam ?? 'srgb'
	const st = mesh3State(cv)
	const ps = st && mesh3Progs(st, s, gam)
	const dr = ps && ps.draw
	if (!ps || !ps.bake || ps.bake.bad || ps.bake.pending || !dr || dr.bad || dr.pending) {
		// never show the previous space while this one compiles — clear and fall back
		if (st) { st.gl.clearColor(0, 0, 0, 0); st.gl.clear(st.gl.COLOR_BUFFER_BIT | st.gl.DEPTH_BUFFER_BIT) }
		return false
	}
	const { gl } = st
	gl.viewport(0, 0, cv.width, cv.height)
	gl.clearColor(0, 0, 0, 0); gl.clearDepth(1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE)
	q3Mode(quant) ? gl.disable(gl.DITHER) : gl.enable(gl.DITHER)
	// straight-alpha shaders on a premultiplied canvas: color blends by SRC_ALPHA,
	// alpha accumulates as coverage (ONE) — the past-the-box fade and the pane
	gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
	const setU = (u) => {
		gl.uniform3f(u.uMin, map.min[0], map.min[1], map.min[2])
		gl.uniform3f(u.uMax, map.max[0], map.max[1], map.max[2])
		const cm = map.cmin ?? map.min, cx = map.cmax ?? map.max
		gl.uniform3f(u.uCMin, cm[0], cm[1], cm[2])
		gl.uniform3f(u.uCMax, cx[0], cx[1], cx[2])
		const dl = map.dcl?.[0] ?? cm, dh = map.dcl?.[1] ?? cx
		if (u.uDMin) gl.uniform3f(u.uDMin, dl[0], dl[1], dl[2])
		if (u.uDMax) gl.uniform3f(u.uDMax, dh[0], dh[1], dh[2])
		const wl = map.win?.[0] ?? dl.map((x, k) => x - (dh[k] - x)), wh = map.win?.[1] ?? dh.map((x, k) => x + (x - dl[k]))
		if (u.uWLo) gl.uniform3f(u.uWLo, wl[0], wl[1], wl[2])
		if (u.uWHi) gl.uniform3f(u.uWHi, wh[0], wh[1], wh[2])
		if (u.uOut) gl.uniform1i(u.uOut, map.out ? 1 : 0)
		if (u.uClip) gl.uniform1i(u.uClip, map.clip ? 1 : 0)
		gl.uniform4i(u.uMap, map.ti, map.ai ?? -1, map.mi ?? 0, 0)
		gl.uniform2i(u.uWb, map.wI ?? -1, map.bI ?? -1)
		if (u.uBip !== undefined) gl.uniform2i(u.uBip, map.bip?.[0] ?? -1, map.bip?.[1] ?? -1)
		if (u.uQuant) gl.uniform1i(u.uQuant, q3Mode(quant))
		// the hovered plane's cut, drawn per pixel on the surface (see fsSurf's uCut band)
		if (u.uCut) gl.uniform2i(u.uCut, cut ? cut.axis : -1, cut && cut.wrap ? 1 : 0)
		if (u.uCutV) gl.uniform2f(u.uCutV, cut ? cut.val : 0, cut ? cut.span : 1)
		gl.uniform2f(u.uRot, rot.a, rot.b)
		gl.uniform1f(u.uScale, scale)
	}
	// ── the bake: run the conversion ONCE per (space, gamut) — transform feedback
	// captures {v, rgb, bad} per lattice vertex; a switch simply rebakes the slot ──
	const bkey = s + '|' + gam
	if (st.bakeKey !== bkey) {
		gl.useProgram(ps.bake.pr); setU(ps.bake.u); bindLuts(gl, ps.bake)
		// the draw pass leaves its attribute POINTERS on the capture buffer — a buffer
		// referenced by any vertex attribute (even a disabled one, per ANGLE) may not
		// be the TF target: INVALID_OPERATION silently skips the bake and the old
		// capture draws under new indices. Disable AND repoint before capturing.
		gl.bindBuffer(gl.ARRAY_BUFFER, gam === 'vis' ? st.vb : st.tb)
		for (const a of [dr.aV, dr.aRgb, dr.aBad]) {
			gl.disableVertexAttribArray(a)
			gl.vertexAttribPointer(a, 1, gl.FLOAT, false, 0, 0)
		}
		gl.enableVertexAttribArray(ps.bake.aSrc); gl.vertexAttribPointer(ps.bake.aSrc, 3, gl.FLOAT, false, 0, 0)
		gl.enable(gl.RASTERIZER_DISCARD)
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, st.bakeBuf)
		gl.beginTransformFeedback(gl.POINTS)
		gl.drawArrays(gl.POINTS, 0, gam === 'vis' ? st.vvn : st.tvn)
		gl.endTransformFeedback()
		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null)
		gl.disable(gl.RASTERIZER_DISCARD)
		st.bakeKey = bkey
	}
	const bindBaked = () => {
		gl.bindBuffer(gl.ARRAY_BUFFER, st.bakeBuf)
		gl.enableVertexAttribArray(dr.aV); gl.vertexAttribPointer(dr.aV, 3, gl.FLOAT, false, 28, 0)
		gl.enableVertexAttribArray(dr.aRgb); gl.vertexAttribPointer(dr.aRgb, 3, gl.FLOAT, false, 28, 12)
		gl.enableVertexAttribArray(dr.aBad); gl.vertexAttribPointer(dr.aBad, 1, gl.FLOAT, false, 28, 24)
	}
	gl.useProgram(dr.pr); setU(dr.u); bindLuts(gl, dr)
	if (dr.u.uPalIdx) gl.uniform1i(dr.u.uPalIdx, PAL_UNIT)
	if (dr.u.uPalSites) gl.uniform1i(dr.u.uPalSites, SITE_UNIT)
	if (dr.u.uMetric) gl.uniform1i(dr.u.uMetric, Math.max(0, METRICS.indexOf(metric || 'oklab')))
	if (PALETTES[quant]) bindPalette(gl, dr.u.uPalIdx, dr.u.uPalSites, quant, metric)
	gl.uniform1i(dr.u.uHasHue, map.ai != null && map.ai >= 0 ? 1 : 0)
	bindBaked()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gam === 'vis' ? st.vi : st.ti)
	gl.uniform1i(dr.u.uPass, 0)
	gl.drawElements(gl.TRIANGLES, gam === 'vis' ? st.vn : st.tn, gl.UNSIGNED_INT, 0)
	if (map.out) {   // translucent overflow BEFORE the caps: the sealed cut faces stay
		// crisp (no ghost film smearing beyond-the-wall colors flat onto the cut —
		// the face-on "smush"); the caps' per-pixel validity keeps the edge-on blade honest
		gl.uniform1i(dr.u.uPass, 1)
		gl.depthMask(false)
		gl.drawElements(gl.TRIANGLES, gam === 'vis' ? st.vn : st.tn, gl.UNSIGNED_INT, 0)
		gl.depthMask(true)
	}
	const capMask = map.caps ?? 63
	if (capMask && ps.caps && !ps.caps.bad && !ps.caps.pending) {
		const per = st.cn / 6   // one fitted-box face per slice, in (fi, side) order
		const bindCaps = () => {
			gl.useProgram(ps.caps.pr); setU(ps.caps.u); bindLuts(gl, ps.caps)
			gl.bindBuffer(gl.ARRAY_BUFFER, st.cb)
			gl.enableVertexAttribArray(ps.caps.aFrac); gl.vertexAttribPointer(ps.caps.aFrac, 3, gl.FLOAT, false, 0, 0)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, st.ci)
		}
		if (gam === 'vis') {
			// human view: per pierced face, STENCIL-parity the sheet the body clipped away
			// past that wall — pixels crossed an odd number of times are inside the solid
			// at the cut — then paint the face quad only there. The cross-section follows
			// the sliced mesh itself; no per-pixel inverse validity (a wrong fold root
			// painted impossible colors or shaved the true cut).
			gl.enable(gl.STENCIL_TEST)
			for (let f = 0; f < 6; f++) if (capMask >> f & 1) {
				gl.clear(gl.STENCIL_BUFFER_BIT)
				gl.useProgram(dr.pr)
				bindBaked()
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, st.vi)
				gl.uniform1i(dr.u.uPass, 2)
				gl.uniform2i(dr.u.uCapK, f >> 1, f & 1)
				gl.colorMask(false, false, false, false); gl.depthMask(false)
				gl.stencilFunc(gl.ALWAYS, 0, 0xff)
				gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT)   // parity of depth-passing crossings
				gl.drawElements(gl.TRIANGLES, st.vn, gl.UNSIGNED_INT, 0)
				gl.colorMask(true, true, true, true); gl.depthMask(true)
				bindCaps()
				gl.stencilFunc(gl.NOTEQUAL, 0, 0xff)
				gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP)
				gl.drawElements(gl.TRIANGLES, per, gl.UNSIGNED_INT, f * per * 4)
			}
			gl.disable(gl.STENCIL_TEST)
		} else {
			bindCaps()
			for (let f = 0; f < 6; f++) if (capMask >> f & 1)
				gl.drawElements(gl.TRIANGLES, per, gl.UNSIGNED_INT, f * per * 4)
		}
	}
	// the CUT's far arc: the same per-pixel band, drawn where the body covers it. The
	// body is opaque, so a pane behind it can only wash the surface — the hidden CURVE
	// is what carries "the plane continues through here", and it carries it precisely.
	if (cut) {
		gl.useProgram(dr.pr)
		bindBaked()
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gam === 'vis' ? st.vi : st.ti)
		gl.uniform1i(dr.u.uPass, 3)
		gl.depthFunc(gl.GREATER); gl.depthMask(false)
		gl.drawElements(gl.TRIANGLES, gam === 'vis' ? st.vn : st.tn, gl.UNSIGNED_INT, 0)
		gl.depthFunc(gl.LEQUAL); gl.depthMask(true)
		gl.uniform1i(dr.u.uPass, 0)
	}
	if (sheet && sheet.length) { const sp = sheetProg(st)
		if (sp) { gl.useProgram(sp.pr)
			gl.uniform2f(sp.uRot, rot.a, rot.b); gl.uniform1f(sp.uScale, scale)
			gl.bindBuffer(gl.ARRAY_BUFFER, sp.buf); gl.bufferData(gl.ARRAY_BUFFER, sheet, gl.DYNAMIC_DRAW)
			gl.enableVertexAttribArray(sp.aPos); gl.vertexAttribPointer(sp.aPos, 3, gl.FLOAT, false, 0, 0)
			gl.depthMask(false)
			// a half-transparent film where nothing covers it — and NOTHING where the body
			// does. Behind an opaque body the pane could only veil the solid's own colour
			// (the old 0.35 wash), which is exactly what greyed the cross-section out.
			gl.uniform4f(sp.uTint, 1, 1, 1, 0.5)
			gl.drawArrays(gl.TRIANGLES, 0, sheet.length / 3)
			gl.depthMask(true) } }
	if (frame) { const fp = frameProg(st)
		if (fp) { gl.useProgram(fp.pr)
			gl.bindBuffer(gl.ARRAY_BUFFER, fp.buf)
			gl.enableVertexAttribArray(fp.aPos); gl.vertexAttribPointer(fp.aPos, 3, gl.FLOAT, false, 0, 0)
			gl.depthMask(false)
			gl.enable(gl.STENCIL_TEST); gl.stencilFunc(gl.EQUAL, 0, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR)
			const rib = (v, r, g, b, a) => { if (!v.length) return
				gl.uniform4f(fp.uTint, r, g, b, a)
				gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW)
				gl.clear(gl.STENCIL_BUFFER_BIT)
				gl.drawArrays(gl.TRIANGLES, 0, v.length / 3) }
			const [tr, tg, tb] = frame.tint
			rib(frame.fr, 1, 1, 1, 0.85); rib(frame.co, tr, tg, tb, 1)
			gl.depthFunc(gl.GREATER)
			rib(frame.fr, 1, 1, 1, 0.38); rib(frame.co, tr, tg, tb, 0.2)
			gl.depthFunc(gl.LEQUAL)
			gl.disable(gl.STENCIL_TEST); gl.depthMask(true) } }
	return true
}

// ── the CIE xy chromaticity diagram: the visible-gamut horseshoe with THIS
// space's reachable chromaticities rendered vivid, the rest ghosted — the
// "shape of the gamut on the xy plane" panel of the dossier ──

const gamutProgs = new Map()
function gamutProg(s) {
	if (gamutProgs.has(s)) return gamutProgs.get(s)
	const d = dimOf(s)
	// the first rgb-cube space on the path BEFORE xyz bounds the gamut: a
	// chroma-encoded space (ycbcr on sRGB, yccbccrc on Rec.2020) only owns colors
	// whose base rgb is valid — past that, in-box coordinates decode through
	// negative light and the coverage lies. Only gamma-domain device encodings are
	// so bounded; a colorimetric space (xyz, oklab, lab, the CAMs — encoding
	// linear/perceptual) spans all vision and nothing bounds it. Topology can't tell
	// them apart (oklch/oklab/xyz carry a shortcut →rgb edge that skips xyz); encoding does.
	let base = null
	if (s !== 'rgb' && meta[s]?.encoding === 'gamma') { const path = pathToRgb(s) || []
		for (let i = 1; i < path.length; i++) {
			const n = path[i]
			if (n === 'xyz') break
			if (classify(n).archetype === 'additive') { base = n; break }
		}
	}
	let lib
	try { lib = s === 'rgb' ? glsl('xyz', 'lrgb') : glsl(base ? [['xyz', s], [s, 'xyz'], [s, base]] : [['xyz', s], [s, 'xyz']]) } catch { gamutProgs.set(s, null); return null }
	const S = san(s)
	// declared range as literals (the gamut = what the range box can encode)
	const range = meta[s]?.range
	if (!range) { gamutProgs.set(s, null); return null }
	const lo = [0, 0, 0, 0], hi = [1, 1, 1, 1]
	range.forEach((r, k) => { lo[k] = r[0]; hi[k] = r[1] })
	const fs = `#version 300 es
precision highp float;
precision highp int;
${lib}
${locusGLSL()}
uniform vec2 uRes;
out vec4 O;
vec3 tosrgb(vec3 lin) {
	vec3 a = abs(lin);
	vec3 e = vec3(
		a.x > 0.0031308 ? 1.055 * pow(a.x, 1.0 / 2.4) - 0.055 : 12.92 * a.x,
		a.y > 0.0031308 ? 1.055 * pow(a.y, 1.0 / 2.4) - 0.055 : 12.92 * a.y,
		a.z > 0.0031308 ? 1.055 * pow(a.z, 1.0 / 2.4) - 0.055 : 12.92 * a.z);
	return clamp(e, 0.0, 1.0);
}
void main() {
	vec2 f = gl_FragCoord.xy / uRes;
	vec2 xy = vec2(-0.107 + f.x * 0.857, -0.055 + f.y * 0.955);
	bool vis = inside(xy);
	if (!vis && xy.y < 0.02) { O = vec4(0.0); return; }   // xyY degenerates at the x axis
	// the horseshoe color: xyY at fixed Y, normalized to full saturation
	float Y = 32.0;
	vec3 XYZ = vec3(xy.x * Y / xy.y, Y, (1.0 - xy.x - xy.y) * Y / xy.y);
	vec3 lin = vec3(
		 3.2409699419046056 * XYZ.x / 100.0 - 1.537383177570116 * XYZ.y / 100.0 - 0.4986107602930043 * XYZ.z / 100.0,
		-0.969243636280911 * XYZ.x / 100.0 + 1.875967501507741 * XYZ.y / 100.0 + 0.04155505740717699 * XYZ.z / 100.0,
		 0.055630079696992636 * XYZ.x / 100.0 - 0.20397695888896836 * XYZ.y / 100.0 + 1.0569715142428788 * XYZ.z / 100.0);
	lin = max(lin, 0.0);
	float mx = max(lin.x, max(lin.y, lin.z));
	if (mx > 0.0) lin /= mx;
	vec3 col = tosrgb(lin * 0.86);
	// is this chromaticity reachable inside the space's declared range, at any luminance?
	bool cov = false;
	const float YQ[6] = float[6](2.0, 10.0, 25.0, 45.0, 70.0, 95.0);
	${s === 'rgb'
		? `for (int q = 0; q < 6; q++) {
		float Yq = YQ[q];
		vec3 XYZq = vec3(xy.x * Yq / xy.y, Yq, (1.0 - xy.x - xy.y) * Yq / xy.y);
		vec3 rq = xyz_lrgb(XYZq);
		if (all(greaterThanEqual(rq, vec3(-0.001))) && all(lessThanEqual(rq, vec3(1.001)))) { cov = true; break; }
	}`
		: `for (int q = 0; q < 6; q++) {
		float Yq = YQ[q];
		vec3 XYZq = vec3(xy.x * Yq / xy.y, Yq, (1.0 - xy.x - xy.y) * Yq / xy.y);
		${VT[d]} vq = xyz_${S}(XYZq);
		bool ok = !(${'xyzw'.slice(0, d).split('').map(c => `isnan(${d === 1 ? 'vq' : `vq.${c}`})`).join(' || ')});
		${'xyzw'.slice(0, d).split('').map((c, k) => `if (${d === 1 ? 'vq' : `vq.${c}`} < ${lo[k].toFixed(6)} || ${d === 1 ? 'vq' : `vq.${c}`} > ${hi[k].toFixed(6)}) ok = false;`).join('\n\t\t')}
		if (ok) {   // and it must genuinely encode this chromaticity (poles lie)
			vec3 back = ${S}_xyz(vq);
			float sb = back.x + back.y + back.z;
			if (sb > 0.0 && abs(back.x / sb - xy.x) < 0.004 && abs(back.y / sb - xy.y) < 0.004) {
				${base ? (() => { const br = meta[base].range
					const blo = br.map(r => (r[0] - (r[1] - r[0]) * 0.008).toFixed(4))
					const bhi = br.map(r => (r[1] + (r[1] - r[0]) * 0.008).toFixed(4))
					return `vec3 bq = ${S}_${san(base)}(vq);
				if (bq.x >= ${blo[0]} && bq.x <= ${bhi[0]} && bq.y >= ${blo[1]} && bq.y <= ${bhi[1]} && bq.z >= ${blo[2]} && bq.z <= ${bhi[2]}) { cov = true; break; }` })() : `cov = true; break;`}
			}
		}
	}`}
	// beyond the horseshoe no colour exists to SHOW — but the space's declared channel
	// ranges still encode these chromaticities (Lab/OKLab a·b boxes, prophoto, aces…).
	// The neutral veil draws that range-limited encoding extent — the channel limits
	// impose the box's shape — while the colours themselves stay honestly absent.
	// Inside the horseshoe: vivid = reached within range, ghost = visible but out of range.
	if (!vis) { O = cov ? vec4(vec3(0.6), 0.16) : vec4(0.0); return; }
	O = cov ? vec4(col, 1.0) : vec4(col * 0.55 + 0.30, 0.22);
}`
	const st = build(G, FSQ_VS, fs, (o) => {
		o.u = { uRes: G.getUniformLocation(o.pr, 'uRes') }
	})
	st.lutN = lutNames(fs)
	gamutProgs.set(s, st)
	return st
}

/** Paint the xy-diagram gamut panel for a space ('pending'/'no' → false). */
export function paintGamutGL(cv2d, s) {
	if (!G) return false
	const st = gamutProg(s)
	if (!st || st.bad || st.pending) return false
	const w = cv2d.width, h = cv2d.height
	if (CV.width !== w || CV.height !== h) { CV.width = w; CV.height = h }
	G.viewport(0, 0, w, h)
	G.disable(G.DEPTH_TEST)
	G.clearColor(0, 0, 0, 0)
	G.clear(G.COLOR_BUFFER_BIT)
	G.useProgram(st.pr)
	bindLuts(G, st)
	G.uniform2f(st.u.uRes, w, h)
	G.drawArrays(G.TRIANGLES, 0, 3)
	const ctx = cv2d.getContext('2d')
	ctx.clearRect(0, 0, w, h)
	ctx.drawImage(CV, 0, 0)
	return true
}
/** xy position of a chromaticity inside the panel (for the marker), 0..1 each. */
export const gamutPos = (x, y) => [(x + 0.107) / 0.857, 1 - (y + 0.055) / 0.955]

// ── the hero slice: OKLCH hue across × chroma down at lightness L, chroma
// normalized per hue to the sRGB gamut edge (bisected in-shader) — cheap enough
// to repaint every frame, so the lightness itself can animate ──
// ── the hero: three horizontal bands of pure hues per space — continuous on top,
// then 20 steps, then 10 — pick the stepping you like. Each hue sits at its most
// saturated displayable tone (the sRGB cusp, via a per-space LUT); bounded cylinders
// sit at full saturation. Static per space — nothing repaints on color change. ──
const heroProgs = new Map()
function heroProg(spec) {
	if (heroProgs.has(spec.s)) return heroProgs.get(spec.s)
	const S = san(spec.s)
	let lib
	try { lib = glsl([[spec.s, 'rgb']]) } catch { heroProgs.set(spec.s, null); return null }
	const asm = () => { const a = ['0.0', '0.0', '0.0']; a[spec.h] = 'hue'; a[spec.c] = 'C'; a[spec.l] = 'Lv'; return `vec3(${a.join(', ')})` }
	const fs = `#version 300 es
precision highp float;
precision highp int;
${lib}
uniform vec2 uRes;
${spec.sat == null ? 'uniform float uCusp[64];' : ''}
out vec4 O;
${spec.sat == null ? `bool in_(float C, float hue, float Lv) { vec3 v = ${S}_rgb(${asm()}); return all(greaterThanEqual(v, vec3(-0.13))) && all(lessThanEqual(v, vec3(255.13))); }
float edge_(float hue, float Lv) { float lo = 0.0, hi = ${spec.ctop.toFixed(4)};
	if (in_(hi, hue, Lv)) return hi;
	for (int k = 0; k < 12; k++) { float mid = (lo + hi) * 0.5;
		if (in_(mid, hue, Lv)) lo = mid; else hi = mid; }
	return lo; }
` : ''}void main() {
	vec2 f = gl_FragCoord.xy / uRes;
	float band = min(2.0, floor((1.0 - f.y) * 3.0));   // 0 = continuous, 1 = 20 steps, 2 = 10 steps
	float hq = band < 0.5 ? f.x : band < 1.5 ? (floor(f.x * 20.0) + 0.5) / 20.0 : (floor(f.x * 10.0) + 0.5) / 10.0;
	float hue = ${(spec.hmin ?? 0).toFixed(2)} + hq * ${((spec.hmax ?? 360) - (spec.hmin ?? 0)).toFixed(2)};
${spec.sat == null ? `	float fi = clamp(hq, 0.0, 1.0) * 63.0;
	int i0 = int(floor(fi));
	float Lv = mix(uCusp[i0], uCusp[min(i0 + 1, 63)], fract(fi));   // the cusp: most saturated tone per hue
	float C = edge_(hue, Lv) * 0.985;` : `	float Lv = ${spec.tone.toFixed(1)};
	float C = ${spec.sat.toFixed(1)};`}
	vec3 rgb = clamp(${S}_rgb(${asm()}) / 255.0, 0.0, 1.0);
	O = vec4(rgb, 1.0);
}`
	const st = build(G, FSQ_VS, fs, (o) => {
		o.u = { uRes: G.getUniformLocation(o.pr, 'uRes'), uCusp: spec.sat == null ? G.getUniformLocation(o.pr, 'uCusp') : null }
	})
	st.lutN = lutNames(fs)
	heroProgs.set(spec.s, st)
	return st
}
/** Paint the hue bands for a space spec; cusp = Float32Array(64) of per-hue tones (unbounded specs). */
export function paintHeroGL(cv2d, spec, cusp) {
	if (!G) return false
	const st = heroProg(spec)
	if (!st || st.bad || st.pending) return false
	const w = cv2d.width, h = cv2d.height
	if (CV.width !== w || CV.height !== h) { CV.width = w; CV.height = h }
	G.viewport(0, 0, w, h)
	G.disable(G.DEPTH_TEST)
	G.useProgram(st.pr)
	bindLuts(G, st)
	G.uniform2f(st.u.uRes, w, h)
	if (st.u.uCusp && cusp) G.uniform1fv(st.u.uCusp, cusp)
	G.drawArrays(G.TRIANGLES, 0, 3)
	cv2d.getContext('2d').drawImage(CV, 0, 0)
	return true
}

// ── channel decomposition of an image: sample → convert → hold every channel
// at its neutral except one → convert back. The exact chunk math per pixel. ──
const imgProgs = new Map()
function imgProg(s) {
	if (imgProgs.has(s)) return imgProgs.get(s)
	const d = dimOf(s)
	let lib
	try { lib = s === 'rgb' ? '' : glsl([['rgb', s], [s, 'rgb']]) } catch { imgProgs.set(s, null); return null }
	const S = san(s)
	const fs = `#version 300 es
precision highp float;
precision highp int;
${lib}
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec4 uN;      // neutral channel values
uniform int uKeep;    // which channel survives (-1: original image)
out vec4 O;
void main() {
	vec2 f = gl_FragCoord.xy / uRes;
	vec3 px = texture(uTex, vec2(f.x, 1.0 - f.y)).rgb * 255.0;
	if (uKeep < 0) { O = vec4(px / 255.0, 1.0); return; }
	${s === 'rgb' ? `
	vec3 v = px;
	vec3 o = vec3(uN.x, uN.y, uN.z);
	for (int k = 0; k < 3; k++) if (k == uKeep) o[k] = v[k];
	vec3 back = o;`
	: `
	${VT[d]} v = rgb_${S}(px);
	${VT[d]} o = ${VT[d]}(${'xyzw'.slice(0, d).split('').map(c => `uN.${c}`).join(', ')});
	for (int k = 0; k < ${d}; k++) if (k == uKeep) o[k] = v[k];
	vec3 back = ${S}_rgb(o);`}
	if (isnan(back.x) || isnan(back.y) || isnan(back.z)) back = vec3(0.0);
	O = vec4(clamp(back, 0.0, 255.0) / 255.0, 1.0);
}`
	const st = build(G, FSQ_VS, fs, (o) => {
		o.u = Object.fromEntries(['uTex', 'uRes', 'uN', 'uKeep'].map(n => [n, G.getUniformLocation(o.pr, n)]))
	})
	st.lutN = lutNames(fs)
	imgProgs.set(s, st)
	return st
}

let IMGTEX = null, IMGKEY = null
/**
 * Paint one channel-isolated rendition of `image` (an ImageBitmap/canvas/img).
 * keep: channel index, or -1 for the untouched image. neutral: the held values.
 */
export function paintImageChanGL(cv2d, s, image, keep, neutral) {
	if (!G) return false
	const st = imgProg(s)
	if (!st || st.bad || st.pending) return false
	const w = cv2d.width, h = cv2d.height
	if (CV.width !== w || CV.height !== h) { CV.width = w; CV.height = h }
	if (!IMGTEX) IMGTEX = G.createTexture()
	G.activeTexture(G.TEXTURE0)
	G.bindTexture(G.TEXTURE_2D, IMGTEX)
	const key = image.__csKey || (image.__csKey = Math.random())
	if (IMGKEY !== key) {
		G.texImage2D(G.TEXTURE_2D, 0, G.RGBA, G.RGBA, G.UNSIGNED_BYTE, image)
		G.texParameteri(G.TEXTURE_2D, G.TEXTURE_MIN_FILTER, G.LINEAR)
		G.texParameteri(G.TEXTURE_2D, G.TEXTURE_WRAP_S, G.CLAMP_TO_EDGE)
		G.texParameteri(G.TEXTURE_2D, G.TEXTURE_WRAP_T, G.CLAMP_TO_EDGE)
		IMGKEY = key
	}
	G.viewport(0, 0, w, h)
	G.disable(G.DEPTH_TEST)
	G.clearColor(0, 0, 0, 0)
	G.clear(G.COLOR_BUFFER_BIT)
	G.useProgram(st.pr)
	bindLuts(G, st)
	G.uniform1i(st.u.uTex, 0)
	G.uniform2f(st.u.uRes, w, h)
	const n4 = [0, 0, 0, 0]; (neutral || []).forEach((x, k) => { if (k < 4) n4[k] = x })
	G.uniform4f(st.u.uN, ...n4)
	G.uniform1i(st.u.uKeep, keep)
	G.drawArrays(G.TRIANGLES, 0, 3)
	const ctx = cv2d.getContext('2d')
	ctx.clearRect(0, 0, w, h)
	ctx.drawImage(CV, 0, 0)
	return true
}
export const imageChanStatus = (s) => {
	if (!G) return 'no'
	const st = imgProg(s)
	if (!st || st.bad) return 'no'
	return st.pending ? 'pending' : 'ready'
}
export const gamutStatus = (s) => {
	if (!G) return 'no'
	const st = gamutProg(s)
	if (!st || st.bad) return 'no'
	return st.pending ? 'pending' : 'ready'
}
/** The xy-diagram panel works for ANY dimensionality — a 1-channel space IS a locus
 *  (kelvin's Planckian curve, gray's neutral axis). It needs the xyz round trip;
 *  one-way spaces (wavelength) honestly have no coverage to show. */
const gamutOK = new Map()
export const hasGamutGL = s => { if (!G || !meta[s]?.range) return false
	if (!gamutOK.has(s)) { let ok = s === 'rgb'
		if (!ok) try { glsl([['xyz', s], [s, 'xyz']]); ok = true } catch {}
		gamutOK.set(s, ok) }
	return gamutOK.get(s) }
