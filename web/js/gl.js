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
// the modal never waits on a shader compile. JS paths remain the fallback
// (no WebGL2, munsell's LUT, color-cluster quantizers).
import { glsl, graph, chunks } from '../../dist/color-space-gl.js'
import { physBound, space, meta, pathToRgb, classify } from './core.js'

const san = s => s.replace(/-/g, '')
const dimOf = s => chunks[s]?.dim || 3
const VT = { 2: 'vec2', 3: 'vec3', 4: 'vec4' }

// one shared offscreen WebGL2 canvas renders every plane and bar, blitted into
// each 2d canvas — existing DOM, cluster modes and fallbacks stay intact
const CV = typeof document !== 'undefined' ? document.createElement('canvas') : null
const G = CV && (CV.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false }) || null)

let readyCb = null
/** Called whenever an async program finishes linking — repaint to upgrade. */
export const setGLReady = fn => { readyCb = fn }

// async link tracking: create+link now, read status later (no compile stall)
function track(gl, pr, resolve) {
	const st = { pr, pending: true, bad: false }
	const ext = gl._pcExt !== undefined ? gl._pcExt : (gl._pcExt = gl.getExtension('KHR_parallel_shader_compile'))
	const tick = () => {
		if (ext && !gl.getProgramParameter(pr, ext.COMPLETION_STATUS_KHR)) { setTimeout(tick, 25); return }
		st.pending = false
		if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
			console.warn('color-space/gl link:', gl.getProgramInfoLog(pr))
			st.bad = true
		} else resolve(st)
		readyCb && readyCb()
	}
	setTimeout(tick, 0)
	return st
}
function build(gl, vsSrc, fsSrc, resolve) {
	const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o }
	const pr = gl.createProgram()
	gl.attachShader(pr, sh(gl.VERTEX_SHADER, vsSrc))
	gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fsSrc))
	gl.linkProgram(pr)
	return track(gl, pr, resolve)
}

/** Is the GPU plane kernel possible for this space? */
export const hasPlaneGL = s => !!G && (s === 'rgb' || !!graph[s]) && dimOf(s) >= 2 && dimOf(s) <= 4

// ── plane/bar kernel: fragment shader sweeps channel a (and b unless b<0) ──
const FSQ_VS = `#version 300 es
void main() { gl_Position = vec4(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0, 0.0, 1.0); }`

const planeProgs = new Map()   // `${s}:${a}:${b}` → { pr, pending, bad, u? } | null
function planeProg(s, a, b) {
	const key = `${s}:${a}:${b}`
	if (planeProgs.has(key)) return planeProgs.get(key)
	const d = dimOf(s), vt = VT[d]
	const pairs = s === 'rgb' ? [['rgb', 'xyz']] : [[s, 'rgb'], [s, 'xyz']]
	pairs.push(['xyz', 'lrgb'], ['xyz', 'p3-linear'], ['xyz', 'rec2020-linear'])
	let lib
	try { lib = glsl(pairs) } catch { planeProgs.set(key, null); return null }
	const vswz = 'xyzw'.slice(0, d).split('').map(c => `uV.${c}`).join(', ')
	const fs = `#version 300 es
precision highp float;
precision highp int;
${lib}
uniform vec4 uV;          // held channel values
uniform vec2 uRX, uRY;    // swept ranges (pan/zoom-windowed)
uniform vec2 uRes;
uniform float uQ;         // numeric coordinate lattice (0 = smooth)
uniform int uGam;         // 0 off · 1 srgb · 2 p3 · 3 rec2020
uniform int uWeb;         // web-safe output snap
uniform int uPolar;       // 1 → the field is a hue DISC: angle→a, radius→b
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
	if (uQ > 0.5) { fa = (min(uQ - 1.0, floor(fa * uQ)) + 0.5) / uQ; fb = (min(uQ - 1.0, floor(fb * uQ)) + 0.5) / uQ; }
	${vt} v = ${vt}(${vswz});
	v[${a}] = uRX.x + (uRX.y - uRX.x) * fa;
	${b >= 0 ? `v[${b}] = uRY.x + (uRY.y - uRY.x) * fb;` : ''}
	vec3 rgb = ${s === 'rgb' ? 'vec3(v[0], v[1], v[2])' : `${san(s)}_rgb(v)`};
	if (isnan(rgb.x) || isnan(rgb.y) || isnan(rgb.z)) rgb = vec3(0.0);
	rgb = clamp(rgb, 0.0, 255.0);
	float al = 1.0;
	// physicality is lens-independent: past the space's linear-light ceiling (±4×
	// diffuse white for SDR display spaces, 500× for scene-referred/HDR) the formula's
	// continuation is clamp noise, not color (Luv's v'→0 pole, CAM16 divergence) —
	// void. The gamut ghost applies only when a lens is selected.
	vec3 xyz = ${s === 'rgb' ? 'rgb_xyz(vec3(v[0], v[1], v[2]))' : `${san(s)}_xyz(v)`};
	vec3 lin = uGam == 2 ? xyz_p3linear(xyz) : uGam == 3 ? xyz_rec2020linear(xyz) : xyz_lrgb(xyz);
	if (!(lin.x > -4.0 && lin.x < ${physBound(s)}.0 && lin.y > -4.0 && lin.y < ${physBound(s)}.0 && lin.z > -4.0 && lin.z < ${physBound(s)}.0)) al = 0.0;
	else if (uGam != 0 && uWeb == 0) {
		// gamut pad in ENCODED units (±half a code value) — a linear pad is ~16 code
		// values near black, over-painting scale-invariant chroma there (TSL's dark
		// saturation swept far past the solid's own wall)
		vec3 enc = mix(lin * 12.92, 1.055 * pow(max(lin, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
		if (any(lessThan(enc, vec3(-0.002))) || any(greaterThan(enc, vec3(1.002)))) al = 0.5;
	}
	if (uWeb == 1) rgb = floor(rgb / 51.0 + 0.5) * 51.0;
	O = vec4(rgb / 255.0, al);
}`
	const st = build(G, FSQ_VS, fs, (o) => {
		o.u = Object.fromEntries(['uV', 'uRX', 'uRY', 'uRes', 'uQ', 'uGam', 'uWeb', 'uPolar'].map(n => [n, G.getUniformLocation(o.pr, n)]))
	})
	planeProgs.set(key, st)
	return st
}

/** 'ready' | 'pending' | 'no' — starts the async compile on first ask. */
export function planeGLStatus(s, a, b = -1) {
	if (!hasPlaneGL(s)) return 'no'
	const st = planeProg(s, a, b)
	if (!st || st.bad) return 'no'
	return st.pending ? 'pending' : 'ready'
}

/**
 * Start compiling a space's programs ahead of need (hover, prev/next neighbours):
 * plane pairs, channel bars and the 3D solid all link in the background, so the
 * dossier opens straight into full-quality GPU paint.
 * @param {string} s space name
 * @param {Array<[number,number]>} pairs the plane channel pairs the dossier will show
 */
export function warmGL(s, pairs = []) {
	if (hasPlaneGL(s)) {
		for (const [a, b] of pairs) planeProg(s, a, b)
		const d = dimOf(s)
		for (let i = 0; i < d; i++) planeProg(s, i, -1)   // bars
	}
	if (has3dGL(s)) mesh3Progs(mesh3State(mesh3Canvas()), s)
}

const GAMI = { srgb: 1, p3: 2, rec2020: 3 }

function drawKernel(st, w, h, vals, rx, ry, gamut, quant, polar) {
	if (CV.width !== w || CV.height !== h) { CV.width = w; CV.height = h }
	G.viewport(0, 0, w, h)
	G.disable(G.DEPTH_TEST)
	G.clearColor(0, 0, 0, 0)
	G.clear(G.COLOR_BUFFER_BIT)
	G.useProgram(st.pr)
	const v4 = [0, 0, 0, 0]; for (let i = 0; i < Math.min(4, vals.length); i++) v4[i] = vals[i]
	G.uniform4f(st.u.uV, ...v4)
	G.uniform2f(st.u.uRX, rx[0], rx[1])
	G.uniform2f(st.u.uRY, ry[0], ry[1])
	G.uniform2f(st.u.uRes, w, h)
	G.uniform1f(st.u.uQ, typeof quant === 'number' ? quant : 0)
	G.uniform1i(st.u.uGam, GAMI[gamut] || 0)
	G.uniform1i(st.u.uWeb, quant === 'web' ? 1 : 0)
	G.uniform1i(st.u.uPolar, polar ? 1 : 0)
	G.drawArrays(G.TRIANGLES, 0, 3)
}

/**
 * Paint one plane on the GPU and blit it into the plane's 2d canvas.
 * Call only when planeGLStatus(s, a, b) is 'ready'. quant: number N | 'web' —
 * color-cluster quantizers stay on the JS path.
 */
export function paintPlaneGL(cv2d, s, vals, a, b, rx, ry, gamut, quant, polar) {
	const st = planeProg(s, a, b)
	if (!st || st.bad || st.pending) return false
	drawKernel(st, cv2d.width, cv2d.height, vals, rx, ry, gamut, quant, polar)
	const ctx = cv2d.getContext('2d')
	ctx.clearRect(0, 0, cv2d.width, cv2d.height)
	ctx.drawImage(CV, 0, 0)
	return true
}

/**
 * Paint a channel bar (1-D sweep of channel `i`, held others) with per-pixel
 * gamut alpha — the smooth version of the stepped CSS mask.
 */
export function paintBarGL(cv2d, s, vals, i, ri, gamut) {
	const st = planeProg(s, i, -1)
	if (!st || st.bad || st.pending) return false
	drawKernel(st, cv2d.width, cv2d.height, vals, ri, [0, 0], gamut, 0)
	const ctx = cv2d.getContext('2d')
	ctx.clearRect(0, 0, cv2d.width, cv2d.height)
	ctx.drawImage(CV, 0, 0)
	return true
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
// Equal-energy illuminant: XYZ integrates the 1931 CMFs over the arc, Y peaks 100.
const VIS = new Map()
export function visSurf(G = 96) {
	if (VIS.has(G)) return VIS.get(G)
	const N = 160   // 380–700 nm at 2 nm
	const cum = [[0, 0, 0]]
	for (let i = 0; i < N; i++) {
		const [X, Y, Z] = space.wavelength.xyz(380 + (i + 0.5) * 2)
		const p = cum[i]
		cum.push([p[0] + X, p[1] + Y, p[2] + Z])
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
	const st = { gl, progs: new Map(),
		tb: buf(geo.tpos), ti: ibuf(geo.tidx), tn: geo.tidx.length,
		vb: buf(vsf.pos), vi: ibuf(vsf.idx), vn: vsf.idx.length,
		cb: buf(geo.cpos), ci: ibuf(geo.cidx), cn: geo.cidx.length }
	mesh3States.set(cv, st)
	return st
}


function mesh3Progs(st, s, gam = 'srgb') {
	const key = s + '|' + gam
	if (st.progs.has(key)) return st.progs.get(key)
	const gl = st.gl, S = san(s)
	let out = null
	try {
		// the solid's source volume: a display-gamut cube fed through gamut→space, or
		// the visible (Rösch–MacAdam) surface, whose vertices arrive as raw XYZ
		const src = gam === 'vis' ? 'xyz' : gam === 'srgb' ? 'rgb' : gam
		const SRC = san(src)
		const unit = src === 'rgb' || src === 'xyz' ? 'aSrc' : '(aSrc / 255.0)'
		const pairs = []
		if (s !== src) pairs.push([src, s])
		if (src !== 'rgb' && s !== 'rgb') pairs.push([src, 'rgb'])
		const vs = `#version 300 es
precision highp float;
precision highp int;
${pairs.length ? glsl(pairs) : ''}
${MAP_GLSL}
${SOFT_DISP}
in vec3 aSrc;
uniform ivec2 uBip;   // bipolar (opponent) channel indexes, else -1
uniform int uClip;    // 1 → box-in-base space (all-or-nothing achromatic collapse)
uniform vec3 uWLo, uWHi;   // sanity window for the cone-wall bisection
out vec3 vRgb;
out vec3 vN;
out vec2 vHueV;
out vec3 vF;
out float vBad;
void main() {
	${VT[3]} v = ${s === src ? unit : `${SRC}_${S}(${unit})`};
	${s !== src ? `// past the encodable cone the coords diverge (the chroma pole) or go non-finite.
	// Collapse such vertices to the neutral axis at their own luminance, so the solid
	// pinches to the gray spine like a normal solid at black - no stretch, no sliver.
	vec3 blo = uWLo, bhi = uWHi;
	if (!(v.x > blo.x && v.x < bhi.x && v.y > blo.y && v.y < bhi.y && v.z > blo.z && v.z < bhi.z)) {
		vec3 nw = ${src === 'xyz' ? 'vec3(aSrc.y * 0.9504559, aSrc.y, aSrc.y * 1.0890578)' : 'vec3((aSrc.r + aSrc.g + aSrc.b) / 3.0)'};
		v = ${SRC}_${S}(nw ${src === 'rgb' || src === 'xyz' ? '' : '/ 255.0'});
	}` : ''}
	// a color indistinguishable from gray (sub-integer channel delta) — or too dark
	// to carry chroma at all (chroma ratios degenerate at black: OSA-UCS's C divides
	// by zero there) — has noise for chroma coordinates (okhsl S at near-white is
	// 0..103 at random). Taper the chroma coords toward the gray axis SMOOTHLY — a
	// hard cliff saws the surface where real chroma meets the collapsed row.
	${src === 'xyz'
		? 'float gf = clamp((aSrc.y - 1.0) / 9.0, 0.0, 1.0);'
		: `float mx = max(aSrc.r, max(aSrc.g, aSrc.b));
	float dlt = mx - min(aSrc.r, min(aSrc.g, aSrc.b));
	float gf = min(clamp(dlt / 2.5, 0.0, 1.0), clamp((mx - 2.0) / 6.0, 0.0, 1.0));`}
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
	vec3 n = map3_(v);
	vF = v;
	vBad = (isnan(n.x) || isnan(n.y) || isnan(n.z)) ? 1.0 : 0.0;
	if (vBad > 0.5) { gl_Position = vec4(2e4, 2e4, 2e4, 1.0); vRgb = vec3(0.0); vN = vec3(0.0); vHueV = vec2(0.0); vF = vec3(0.0); return; }
	float h = uMap.y >= 0 ? raw_(v, uMap.y) * 6.283185307179586 : 0.0;
	vHueV = vec2(cos(h), sin(h));
	vN = n;
	${src === 'rgb' ? 'vRgb = aSrc / 255.0;' : `// an out-of-sRGB vertex desaturates toward its own luma until representable — the
	// closest ACTUAL color, hue and lightness held (vs the flat channel-clamp that
	// painted hyper-greens as one solid green). The caps seal with this SAME knee.
	vRgb = softDisp(${SRC}_rgb(${unit}));`}
	gl_Position = view_(n, 0.0);
}`
		const fsSurf = `#version 300 es
precision highp float;
precision highp int;
in vec3 vRgb; in vec3 vN; in vec2 vHueV; in vec3 vF; in float vBad;
uniform vec3 uCMin, uCMax;
uniform vec3 uDMin, uDMax;   // the DECLARED box — where the slice outline is drawn
uniform int uOut;            // 1 → the solid pierces the declared box
uniform int uClip;           // 1 → box-in-base space: shave past-the-box noise
uniform int uPass;           // 0 = opaque in-box · 1 = translucent beyond-box
uniform ivec4 uMap;
uniform int uHasHue;
uniform ivec2 uBip;   // bipolar (opponent) chroma channels, else (-1,-1) — marks a lightness-axis space
uniform ivec2 uCapK;  // pass 2: the capped face (axis, side) whose clipped sheet is stencilled
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
	if (uPass == 0 && ob > 0.0) discard;
	if (uPass == 1) {
		if (ob <= 0.0 || ob > 0.3) discard;   // near chroma overflow shows; far pole-fan dropped
		float a = 1.0 - ob / 0.3;
		O.a = a * a * 0.6;   // near-solid at the wall, DISSOLVING to nothing — a constant
		// alpha ends the ghost in a hard angled chop at the 0.3 cutoff instead of a fade
	}
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
		const fsCap = fsCapVis || glin && `#version 300 es
precision highp float;
precision highp int;
${glsl([[s, 'rgb'], [s, 'xyz'], ['xyz', glin], [gam === 'srgb' ? 'rgb' : gam, s], [s, gam === 'srgb' ? 'rgb' : gam]])}
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
	vec3 gv = ${gam === 'srgb' ? 'clamp(disp, 0.0, 255.0)' : `clamp(${S}_${G0}(vV), 0.0, 1.0)`};
	vec3 back = ${G0}_${S}(gv);
	for (int k = 0; k < 3; k++) {
		float d = abs(back[k] - vV[k]);
		if (uMap.y == k) d = min(d, 360.0 - d);
		if (!(d <= (uMax[k] - uMin[k]) * 0.03)) discard;   // NaN fails too
	}
	O = vec4(softDisp(disp), 1.0);
}`
		const U = ['uMin', 'uMax', 'uCMin', 'uCMax', 'uDMin', 'uDMax', 'uWLo', 'uWHi', 'uOut', 'uClip', 'uPass', 'uMap', 'uWb', 'uBip', 'uCapK', 'uRot', 'uScale', 'uHasHue']
		const surf = build(gl, vs, fsSurf, (o) => {
			o.aSrc = gl.getAttribLocation(o.pr, 'aSrc')
			o.u = Object.fromEntries(U.map(n => [n, gl.getUniformLocation(o.pr, n)]))
		})
		const caps = !fsCap || s === src ? null : build(gl, vsCap, fsCap, (o) => {
			o.aFrac = gl.getAttribLocation(o.pr, 'aFrac')
			o.u = Object.fromEntries(U.map(n => [n, gl.getUniformLocation(o.pr, n)]))
		})
		out = { surf, caps }
	} catch { out = null }
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

export function drawMesh3GL(cv, s, map, rot, scale, sheet, frame) {
	if (!has3dGL(s)) return false
	const gam = map?.gam ?? 'srgb'
	const st = mesh3State(cv)
	const ps = st && mesh3Progs(st, s, gam)
	if (!ps || !ps.surf || ps.surf.bad || ps.surf.pending) {
		// never show the previous space while this one compiles — clear and fall back
		if (st) { st.gl.clearColor(0, 0, 0, 0); st.gl.clear(st.gl.COLOR_BUFFER_BIT | st.gl.DEPTH_BUFFER_BIT) }
		return false
	}
	const { gl } = st
	gl.viewport(0, 0, cv.width, cv.height)
	gl.clearColor(0, 0, 0, 0); gl.clearDepth(1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE)
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
		gl.uniform2f(u.uRot, rot.a, rot.b)
		gl.uniform1f(u.uScale, scale)
	}
	gl.useProgram(ps.surf.pr); setU(ps.surf.u)
	gl.uniform1i(ps.surf.u.uHasHue, map.ai != null && map.ai >= 0 ? 1 : 0)
	gl.bindBuffer(gl.ARRAY_BUFFER, gam === 'vis' ? st.vb : st.tb)
	gl.enableVertexAttribArray(ps.surf.aSrc); gl.vertexAttribPointer(ps.surf.aSrc, 3, gl.FLOAT, false, 0, 0)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gam === 'vis' ? st.vi : st.ti)
	gl.uniform1i(ps.surf.u.uPass, 0)
	gl.drawElements(gl.TRIANGLES, gam === 'vis' ? st.vn : st.tn, gl.UNSIGNED_INT, 0)
	if (map.out) {   // translucent overflow BEFORE the caps: the sealed cut faces stay
		// crisp (no ghost film smearing beyond-the-wall colors flat onto the cut —
		// the face-on "smush"); the caps' per-pixel validity keeps the edge-on blade honest
		gl.useProgram(ps.surf.pr)
		gl.bindBuffer(gl.ARRAY_BUFFER, gam === 'vis' ? st.vb : st.tb)
		gl.enableVertexAttribArray(ps.surf.aSrc); gl.vertexAttribPointer(ps.surf.aSrc, 3, gl.FLOAT, false, 0, 0)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gam === 'vis' ? st.vi : st.ti)
		gl.uniform1i(ps.surf.u.uPass, 1)
		gl.depthMask(false)
		gl.drawElements(gl.TRIANGLES, gam === 'vis' ? st.vn : st.tn, gl.UNSIGNED_INT, 0)
		gl.depthMask(true)
	}
	const capMask = map.caps ?? 63
	if (capMask && ps.caps && !ps.caps.bad && !ps.caps.pending) {
		const per = st.cn / 6   // one fitted-box face per slice, in (fi, side) order
		const bindCaps = () => {
			gl.useProgram(ps.caps.pr); setU(ps.caps.u)
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
				gl.useProgram(ps.surf.pr)
				gl.bindBuffer(gl.ARRAY_BUFFER, st.vb)
				gl.enableVertexAttribArray(ps.surf.aSrc); gl.vertexAttribPointer(ps.surf.aSrc, 3, gl.FLOAT, false, 0, 0)
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, st.vi)
				gl.uniform1i(ps.surf.u.uPass, 2)
				gl.uniform2i(ps.surf.u.uCapK, f >> 1, f & 1)
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
	if (sheet && sheet.length) { const sp = sheetProg(st)
		if (sp) { gl.useProgram(sp.pr)
			gl.uniform2f(sp.uRot, rot.a, rot.b); gl.uniform1f(sp.uScale, scale)
			gl.bindBuffer(gl.ARRAY_BUFFER, sp.buf); gl.bufferData(gl.ARRAY_BUFFER, sheet, gl.DYNAMIC_DRAW)
			gl.enableVertexAttribArray(sp.aPos); gl.vertexAttribPointer(sp.aPos, 3, gl.FLOAT, false, 0, 0)
			gl.depthMask(false)
			gl.uniform4f(sp.uTint, 1, 1, 1, 0.75)
			gl.drawArrays(gl.TRIANGLES, 0, sheet.length / 3)
			// and the part the body hides — fainter, so the pane reads CONTINUOUS
			// through the solid instead of stopping dead at the silhouette
			gl.depthFunc(gl.GREATER)
			gl.uniform4f(sp.uTint, 1, 1, 1, 0.35)
			gl.drawArrays(gl.TRIANGLES, 0, sheet.length / 3)
			gl.depthFunc(gl.LEQUAL)
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
let LOCUS = null
function locus() {
	if (LOCUS) return LOCUS
	const pts = []
	for (let nm = 380; nm <= 700; nm += 5) {
		const [X, Y, Z] = space.wavelength.xyz(nm)
		const s2 = X + Y + Z
		pts.push([X / s2, Y / s2])
	}
	return LOCUS = pts
}

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
	const P = locus()
	const N = P.length
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
uniform vec2 uRes;
const vec2 LOC[${N}] = vec2[${N}](${P.map(q => `vec2(${q[0].toFixed(5)}, ${q[1].toFixed(5)})`).join(', ')});
out vec4 O;
bool inside(vec2 p) {   // even-odd over the closed locus + purple line
	bool c = false;
	for (int i = 0, j = ${N} - 1; i < ${N}; j = i++) {
		vec2 a = LOC[i], b2 = LOC[j];
		if ((a.y > p.y) != (b2.y > p.y) && p.x < (b2.x - a.x) * (p.y - a.y) / (b2.y - a.y) + a.x) c = !c;
	}
	return c;
}
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
		bool ok = !(${'xyzw'.slice(0, d).split('').map(c => `isnan(vq.${c})`).join(' || ')});
		${'xyzw'.slice(0, d).split('').map((c, k) => `if (vq.${c} < ${lo[k].toFixed(6)} || vq.${c} > ${hi[k].toFixed(6)}) ok = false;`).join('\n\t\t')}
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
	// beyond the horseshoe no color exists to show — a neutral veil marks the
	// imaginary chromaticities the range still encodes (prophoto, aces, xyz…)
	if (!vis) { O = cov ? vec4(vec3(0.6), 0.16) : vec4(0.0); return; }
	O = cov ? vec4(col, 1.0) : vec4(col * 0.55 + 0.30, 0.22);
}`
	const st = build(G, FSQ_VS, fs, (o) => {
		o.u = { uRes: G.getUniformLocation(o.pr, 'uRes') }
	})
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
