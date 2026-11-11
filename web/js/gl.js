// GPU kernels for the dossier — the plane fields, the channel bars and the 3D
// solid rendered by the library's own verified shader chunks (color-space/gl),
// compiled per space. Exact math on every pixel: OSA-UCS's bracketed inverse,
// CAM16, HCT run at full resolution with no cost-fitted degradation; gamut
// limits (sRGB/P3/Rec.2020) cut per-pixel through the real conversion chain.
// Input markers track gestures live; field transfers settle after release.
//
// Programs link ASYNCHRONOUSLY (KHR_parallel_shader_compile when available):
// callers get 'pending' and paint their JS fallback instantly; setGLReady's
// callback fires when a program lands, and the next paint upgrades to GPU —
// the modal never waits on a shader compile. JS paths remain the no-WebGL2
// fallback; numeric and palette lenses run here too. Measured-dataset spaces (munsell)
// ride the same chunks via the `lut` contract — see bindLuts.
import { glsl, graph, chunks, luts } from '../../dist/color-space-gl.js'
import { physBound, dirOnly, rtFaithful, space, meta, pathToRgb, classify, locus, LOCUS_EPS, d65, visSolid } from './core.js'
import { nativeOf } from './definition.js'
import { footroom } from './footroom.js'
export { rtFaithful }
import NAMES from './names.js'
import * as PALS from './palettes.js'
import { deltaE2000 } from './measure.js'
import { okGrid, nearestK } from './nearest.js'

const san = s => s.replace(/-/g, '')
const dimOf = s => chunks[s]?.dim || 3
const VT = { 1: 'float', 2: 'vec2', 3: 'vec3', 4: 'vec4' }

// one shared WebGL2 canvas renders dossier planes and bars, then copies them out into the
// visible 2D canvases – a task's draws together, one image (cellFor); the directly-presented
// 3D canvas remains independent.
const CV = typeof document !== 'undefined' ? document.createElement('canvas') : null
const G = CV && (CV.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false }) || null)

// a software rasterizer behind the context (SwiftShader, llvmpipe, Microsoft's Basic Render Driver – no GPU, or a blocked
// one) compiles a space's kernel on the CPU: lab's took 18 s, and the page froze at every wait for it (a canvas resize, a
// status read, a readback). There the planes, bars, xy plate and solid paint by their JS paths, in milliseconds – none of
// them a GPU kernel (hasPlaneGL, has3dGL, hasGamutGL). Asked lazily: a renderer query at load stalls the first frames.
// globalThis.CS_GL = 'gpu', set before the page loads, keeps the kernels on such a host: the site's checks and the
// dossier bake run headless on SwiftShader and must drive (and bake) what a GPU shows
let soft
const softRaster = () => soft ??= !!G && (ri => /SwiftShader|llvmpipe|softpipe|software|basic render/i.test(ri ? G.getParameter(ri.UNMASKED_RENDERER_WEBGL) : G.getParameter(G.RENDERER)))(G.getExtension('WEBGL_debug_renderer_info'))
export const softGL = () => globalThis.CS_GL !== 'gpu' && softRaster()

let readyCb = null
/** Called whenever an async program finishes linking — repaint to upgrade. Told which kind landed ('plane' – the planes and
 *  the bars, 'mesh' – the solid, 'gamut' – the xy plate, 'img' – the image panels; none: repaint all) and for which space,
 *  so a space's four programs landing one by one never repaint the whole card four times, and a neighbour's warmed ahead
 *  never repaints this one at all */
export const setGLReady = fn => { readyCb = fn }

// async link tracking: create+link now, read status later (no compile stall).
// ONE shared poller walks every linking program — a timer per program meant a
// sync GPU-process round trip per program per 25ms while the driver was busiest.
// A program is asked about only once a fence after its link has passed: the fence's status is read without a round trip
// (WebGL 2 updates it between tasks), and the program's own query, a round trip, then finds the GPU process done with
// it – asked earlier, Chrome's waited out the whole compile queue behind it: 0.8 s of a dossier's open in one call
const linking = new Set()
let linkT = 0
/** How many programs are still linking: background work waits for none (index.html's walk) */
export const glLinking = () => linking.size
function pollLinks() {
	linkT = 0
	for (const st of linking) {
		const gl = st.gl
		if (st.sync) { if (gl.getSyncParameter(st.sync, gl.SYNC_STATUS) !== gl.SIGNALED) continue; gl.deleteSync(st.sync); st.sync = null }
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
		readyCb && readyCb(st.kind, st.space)
	}
	if (linking.size) linkT = setTimeout(pollLinks, 25)
}
// Where the link runs on the page's own path – the fence after it a round trip that waits the compile out: WebKit, 0.35–1.06 s
// a kernel – a speculative compile is a freeze on whatever the page does next; there the page compiles a card's own programs
// alone (glSerial: its hover and prev/next warm-ups stand down). Chrome links on the driver's workers: its fence is free
let serial = false
export const glSerial = () => serial
function track(gl, pr, resolve, st = {}) {
	st.pr = pr; st.pending = true; st.bad = false; st.gl = gl; st.resolve = resolve
	if (st.sync) gl.deleteSync(st.sync)
	if (gl.fenceSync) { const t = performance.now(); st.sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); if (performance.now() - t > 100) serial = true }   // WebGL 2; a WebGL 1 context asks the program at once
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
export const hasPlaneGL = s => !!G && (s === 'rgb' || !!graph[s]) && dimOf(s) >= 2 && dimOf(s) <= 4 && !softGL()

// ── measured-dataset LUTs (munsell's renotation): a composed source that reads one
// declares `uniform sampler2D <name>tex` — upload the chunk-declared data once per
// context (RGBA32F, NEAREST — texelFetch is exact) and rebind at draw ──
const lutTex = new WeakMap()   // gl context → { lut name: WebGLTexture }
const VR = 512, VRX = 0.75, VRY = 0.85   // the surface solid's reach by chromaticity (visReach): its texels, and the x and y they span
const LUTS = { ...luts, visreach: { w: VR, h: VR, data: () => visReach() } }   // the library's, and the page's own
const lutNames = (src) => Object.keys(LUTS).filter(n => src.includes(n + 'tex'))
const LUT0 = 8   // first texture unit for LUTs — clear of the image unit
function bindLuts(gl, st) {
	if (!st.lutN || !st.lutN.length) return
	const cache = lutTex.get(gl) ?? lutTex.set(gl, {}).get(gl)
	const locs = st.uLut ??= st.lutN.map(n => gl.getUniformLocation(st.pr, n + 'tex'))   // resolved once per program — a per-draw lookup is a sync GPU-process round trip, and the atlas draws ~60× a frame
	for (let k = 0; k < st.lutN.length; k++) { const n = st.lutN[k]
		gl.activeTexture(gl.TEXTURE0 + LUT0 + k)
		if (cache[n]) gl.bindTexture(gl.TEXTURE_2D, cache[n])
		else { const t = cache[n] = gl.createTexture(), l = LUTS[n]
			gl.bindTexture(gl.TEXTURE_2D, t)
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, l.w, l.h, 0, gl.RGBA, gl.FLOAT, l.data())
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE) }
		gl.uniform1i(locs[k], LUT0 + k) }
	gl.activeTexture(gl.TEXTURE0)
}

// ── plane/bar kernel: fragment shader sweeps channel a (and b unless b<0) ──
const FSQ_VS = `#version 300 es
void main() { gl_Position = vec4(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0, 0.0, 1.0); }`

// ONE program per space and lens (planeFS): the swept channel indices ride a uniform (uAB), so
// all three bars and every plane pair share a single compile — six programs' worth of
// identical conversion library collapsed into one. Compiles run through a small
// QUEUE (max 4 in flight): a burst of new spaces (fast scroll) no longer jams the
// GPU process, so the page's sync GL calls never stall behind a deep driver queue.
const planeProgs = new Map()   // `space|lens` → { pr, pending, bad, u?, lutN }
const QMAX = 4, compileQ = []
let compiling = 0
const pump = () => { while (compiling < QMAX && compileQ.length) compileQ.shift()() }

// A round trip that misses on channel k is a fold only where k carries the color. At a pole – HSL's black and white,
// any gray's hue – the channel is free: the address with k set back to its canonical value is the same color, so
// every value of k is a real address of it, and the pole paints solid (a whole held slice at L = 0 is black, not a
// ghost of black). A fold moves the color: HSM's mirror, HWB's w + b > 100 (its w alone set back changes the gray).
// Same color = within ΔXYZ 0.02 + 0.2% (Y = 100 white): f32 noise, far under a visible step; NaN is never the same.
// x: the coordinate's own XYZ, taken once by the caller – each conversion a call site is a copy of the space's chain in the
// GPU pipeline, built whole at its first draw on the thread that composites the screen (Metal under ANGLE); the round trip
// runs over the channels in a loop bound by a uniform (uDim) for the same reason: unrolled, three copies more
const sameGLSL = (S, vt) => `bool same_(vec3 x, ${vt} b) { vec3 y = ${S}_xyz(b); return length(x - y) <= 0.02 + 0.002 * length(x); }`

// A kernel is built for the lens it draws (L, lensOf): its gamut (uGam), its cluster lens (uClu), its edges (uEdge), its
// encoding (uEnc) – compile-time constants, the other lenses' code never emitted. Metal under ANGLE builds a program's GPU
// pipeline whole, at its first draw, on the thread that composites the screen: one kernel holding every lens stood the
// page still 0.9–1.2 s at each new space (srlab2: palette 240 ms, the round trip through three gamuts 420, JND 145, edges
// 95, the core 195). A lens taken for the first time builds its own, once
function planeFS(s, L) {
	const d = dimOf(s), vt = VT[d], S = san(s), G0 = ['', 'rgb', 'p3', 'rec2020'][L.gam] || ''
	// Munsell's measured solid has a direct local-rim predicate in its LUT. Using
	// its iterative inverse merely to rediscover that boundary made every plane
	// compile and execute the 760-node search per pixel.
	const faithful = s !== 'rgb' && d <= 3 && s !== 'munsell' && rtFaithful(s)
	const pairs = s === 'rgb' ? [['rgb', 'xyz']] : [[s, 'rgb'], [s, 'xyz']]
	pairs.push(['xyz', 'lrgb'], ['xyz', 'p3-linear'], ['xyz', 'rec2020-linear'])
	if (L.clu === 1) pairs.push(['rgb', 'oklab'], ['rgb', 'lab'])   // the palette lens's distances
	if (L.clu === 2) pairs.push(['rgb', 'oklab'], ['oklab', 'rgb'])   // the JND grid lives in OKLab
	if (L.enc) pairs.push([s, 'p3'], ['rgb', 'p3'])   // a display-p3 destination canvas is painted in its own encoding
	// the canonical-roundtrip lens (below) needs the INTO-space edge of the display gamut drawn
	const rtOn = faithful && G0
	if (rtOn) pairs.push(G0 === 'rgb' ? ['rgb', s] : [s, G0], [G0, s])
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
	const top = G0 === 'rgb' ? '255.0' : '1.0'
	const rt = !rtOn ? '' : `
		else {
			${vt} bk;
			${dirOnly(s) ? `// a chromaticity space discards luminance: its Y=100 convention overflows every
			// display encoding, so the clamp below would MOVE every value and ghost the whole
			// instrument — normalise the direction to peak first, then the round trip is fair
			vec3 c0 = ${S}_${G0}(v); c0 *= ${top} / max(max(c0.x, max(c0.y, c0.z)), 1e-5); bk = ${G0}_${S}(clamp(c0, 0.0, ${top}));` : `bk = ${G0}_${S}(clamp(${S}_${G0}(v), 0.0, ${top}));`}
			for (int k = 0; k < uDim; k++) {
				float dq = abs(bk[k] - v[k]);
				${hueK >= 0 ? `if (k == ${hueK}) dq = min(dq, SPAN[k] - dq);` : ''}
				if (!(dq <= SPAN[k] * 0.03)) { ${vt} w = v; w[k] = bk[k]; if (!same_(xv, w)) al = 0.5; }
			}
		}`
	const nativeRim = s === 'munsell' ? `
	else if (v.z > munsell_maxc_(v.x, v.y) + 0.0001) al = 0.0;` : ''
	const vswz = 'xyzw'.slice(0, d).split('').map(c => `uV.${c}`).join(', ')
	return `#version 300 es
precision highp float;
precision highp int;
${lib}
${rtOn ? sameGLSL(S, vt) : ''}
${spans}
${locusGLSL()}
${L.clu === 1 ? namedGLSL() : ''}
${L.gam === 4 ? visSolidGLSL() : ''}
uniform vec4 uV;          // held channel values
uniform ivec2 uAB;        // swept channel indices: x horizontal, y vertical (-1 = bar)
uniform vec2 uRX, uRY;    // swept ranges (pan/zoom-windowed)
uniform vec2 uRes;
uniform vec2 uOff;        // viewport origin in window px – the strip atlas draws many rects into one canvas
uniform float uQ;         // numeric coordinate lattice (0 = smooth)
uniform int uWeb;         // web-safe output snap
uniform int uPolar;       // 1 → the field is a hue DISC: angle→a, radius→b
uniform int uTri;         // cone-family vertical section: 1 cone · 2 bicone · 3 W+B triangle
uniform float uEdgeW;     // its width, device px
uniform float uEdgeA;     // its opacity
uniform float uEdgeInk;   // its ink: 1 white, 0 black, -1 each pixel's own (white on a dark color, black on a light one)
uniform int uCut;         // 1 → past the lens's gamut is void, not ghost: the field ends where its gamut does
uniform int uDim;         // the space's channels: the round trip's loop bound (sameGLSL)
out vec4 O;
// a gamut's edge as a line's coverage at this pixel (uEdgeW device px wide), lying just past the edge – from half a pixel
// out. Each channel's distance past its face of the gamut's box, in encoded units over its screen-space gradient, is its
// distance in pixels, the face a straight line there; the pixel's distance to the gamut is to the polygon those faces
// bound: the foot on a face it is past, or a corner where two meet (the nearest of those inside the rest) – so the line
// keeps its width at a slant and hugs a sharp corner (a hue's cusp) instead of spurring past it. Only a pixel whose
// centre is past the gamut takes any of it: a field that reaches the surface and stays on it (HSV and HSL at full
// saturation, HWB with no white: on sRGB's surface throughout) draws none, nor a tick where a channel runs down to the
// surface and turns there (a hue's sector) – read off one pixel's gradient, such a turn looks like a crossing a fraction
// of a pixel away. A channel that doesn't change across the pixel has no face there: inside, or far out (no line).
// Antialiased; called in uniform flow (derivatives)
float edgeCov(vec3 l) {
	vec3 e = mix(l * 12.92, 1.055 * pow(max(l, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, l));
	vec3 o = max(-e, e - 1.0), gx = dFdx(o), gy = dFdy(o), w = sqrt(gx * gx + gy * gy), still = step(w, vec3(1e-5));
	if (dot(still, step(0.002, o)) > 0.0) return 0.0;
	vec3 s3 = mix(o / max(w, vec3(1e-9)), vec3(-1e9), still);
	if (max(s3.x, max(s3.y, s3.z)) <= 0.0) return 0.0;
	float s[3] = float[3](s3.x, s3.y, s3.z);
	vec2 n[3] = vec2[3](vec2(gx.x, gy.x) / max(w.x, 1e-9), vec2(gx.y, gy.y) / max(w.y, 1e-9), vec2(gx.z, gy.z) / max(w.z, 1e-9));
	float d = 1e9;
	for (int i = 0; i < 3; i++) {   // the foot on a face passed, if inside the others
		vec2 q = -s[i] * n[i];
		bool in1 = s[i] > 0.0;
		for (int k = 0; k < 3; k++) if (k != i && s[k] + dot(n[k], q) > 1e-3) in1 = false;
		if (in1) d = min(d, s[i]);
	}
	for (int i = 0; i < 2; i++) for (int j = i + 1; j < 3; j++) {   // a corner of two faces, if inside the third
		float det = n[i].x * n[j].y - n[i].y * n[j].x;
		if (s[i] < -1e8 || s[j] < -1e8 || abs(det) < 1e-4) continue;
		vec2 q = vec2(s[j] * n[i].y - s[i] * n[j].y, s[i] * n[j].x - s[j] * n[i].x) / det;
		if (s[3 - i - j] + dot(n[3 - i - j], q) <= 1e-3) d = min(d, length(q));
	}
	if (d > 1e8) d = max(s3.x, max(s3.y, s3.z));
	return clamp(min(min(d, 1.0), min(uEdgeW, uEdgeW + 1.0 - d)), 0.0, 1.0);   // the pixel [d ± ½] over the line [½, uEdgeW + ½]
}
void main() {
	vec2 f = (gl_FragCoord.xy - uOff) / uRes;
	float fa, fb;
	if (uPolar == 1) {
		vec2 pc = f * 2.0 - 1.0;
		float rr = length(pc);
		if (rr > 1.0) { O = vec4(0.0); return; }
		// clockwise from +x – the same handedness as the solid seen from ABOVE,
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
			float x0 = 0.5 - 0.5 * tw;   // centred row – the gray axis is the left slanted edge
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
	${L.clu === 1 ? `rgb = named_(floor(rgb + 0.5));   // a palette lens – OKLab Voronoi cells of the bound palette's sites` : ''}
	${L.clu === 2 ? `// the JND lens – a neutral-centered OKLab grid at ~one just-noticeable step
	vec3 okp = rgb_oklab(floor(rgb + 0.5));
	okp = vec3((floor(min(okp.x, .9999) / .023) + .5) * .023, round(okp.y / .023) * .023, round(okp.z / .023) * .023);
	rgb = floor(clamp(oklab_rgb(okp), 0.0, 255.0) + 0.5);` : ''}
	${L.clu === 3 ? `rgb = floor(floor(floor(rgb + 0.5) / 255.0 * vec3(31.0, 63.0, 31.0) + 0.5) / vec3(31.0, 63.0, 31.0) * 255.0 + 0.5);   // the 16-bit lens – RGB565 hardware depth` : ''}
	float al = 1.0;
	// the limits are a property of the COORDINATE, not the render mode: past the space's
	// linear-light ceiling (±4× diffuse white for SDR display spaces, 500× for scene-referred/
	// HDR) the formula's continuation is clamp noise, not colour (Luv's v'→0 pole, CAM16
	// divergence): void. Smooth, stepped, 16-bit, JND and palette lenses void and ghost
	// identically; the lens only quantises the colour drawn WHERE a colour exists.
	vec3 xyz = ${s === 'rgb' ? 'rgb_xyz(vec3(v[0], v[1], v[2]))' : `${san(s)}_xyz(v)`}, xv = xyz;   // xv: the round trip's, before a chromaticity space rescales xyz
	vec3 lin = ${L.gam === 2 ? 'xyz_p3linear(xyz)' : L.gam === 3 ? 'xyz_rec2020linear(xyz)' : 'xyz_lrgb(xyz)'};
	vec3 lS = xyz_lrgb(xyz), lP = xyz_p3linear(xyz), lR = xyz_rec2020linear(xyz);   // the edges' gamuts, read alike
	${dirOnly(s) ? `// a CHROMATICITY space discards luminance — the honest gamut question is whether the
	// DIRECTION is displayable at any luminance: scale to peak (display lenses) and to the
	// solid's mid-height (human lens) before the cuts, or the fixed Y=100 convention ghosts
	// nearly the whole instrument (cct-duv read as broken)
	lin /= max(max(lin.x, max(lin.y, lin.z)), 1e-6);
	lS /= max(max(lS.x, max(lS.y, lS.z)), 1e-6); lP /= max(max(lP.x, max(lP.y, lP.z)), 1e-6); lR /= max(max(lR.x, max(lR.y, lR.z)), 1e-6);
	xyz *= 50.0 / max(xyz.y, 1e-4);` : ''}
	${meta[s]?.method === 'spectral' ? `// a SPECTRAL space's coordinate is a light — a monochromatic line, a Planckian
	// radiator — real by definition. The locus test is vacuous (its samples sit ON the
	// locus polygon, where even-odd flips at random) and the object-colour solid is the
	// wrong body (a laser is no reflectance, yet perfectly visible) — so no locus or
	// solid cut, and the display ghost normalises to the direction: "can this display
	// show that light at any exposure". Mirrors lensFor in core.js.
	lin /= max(max(lin.x, max(lin.y, lin.z)), 1e-6);
	lS /= max(max(lS.x, max(lS.y, lS.z)), 1e-6); lP /= max(max(lP.x, max(lP.y, lP.z)), 1e-6); lR /= max(max(lR.x, max(lR.y, lR.z)), 1e-6);` : ''}
	if (!(lin.x > -4.0 && lin.x < ${physBound(s)}.0 && lin.y > -4.0 && lin.y < ${physBound(s)}.0 && lin.z > -4.0 && lin.z < ${physBound(s)}.0)) al = 0.0;${nativeRim}
	${meta[s]?.method === 'spectral' ? '' : `// a chromaticity off the spectral locus is imaginary at ANY luminance – not a colour
	// under ANY lens – so it VOIDS, always (not only under the human lens). Lab/OKLab/…
	// range boxes reach far past the visible spectrum; without this the plane paints those
	// imaginary coords as pickable ghost, so the gamut looks vastly bigger than the eye's.
	else if (!visXYZ(xyz)) al = 0.0;
	// the HUMAN lens then cuts by the object-colour solid – the very body the 3D view
	// tessellates. The locus alone admits any luminance for a real chromaticity, so the
	// picker used to paint a far larger field than the solid's cross-section: same word,
	// two shapes, and the plane read as if zoomed against the solid.
	${L.gam === 4 ? 'else if (!(uAB.y < 0 ? inVisSolidExact(xyz) : inVisSolid(xyz))) al = 0.5;' : ''}`}   // beyond the SURFACE solid but on the locus: a real light – ghost, like every other limit
	// the display lenses instead GHOST real-but-undisplayable colours on top
	${L.gam >= 1 && L.gam <= 3 ? `else {
		// gamut pad in ENCODED units (±half a code value) – a linear pad is ~16 code
		// values near black, over-painting scale-invariant chroma there (TSL's dark
		// saturation swept far past the solid's own wall)
		vec3 enc = mix(lin * 12.92, 1.055 * pow(max(lin, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
		if (any(lessThan(enc, vec3(-0.002))) || any(greaterThan(enc, vec3(1.002)))) al = 0.5;${rt}
	}` : ''}
	if (uCut == 1 && al == 0.5) al = 0.0;
	// the edges: gamuts' boundaries drawn as lines over the field (the lens's), the color painted either side, in one ink the page
	// names (uEdgeInk) or each pixel's own – white on a dark color, black on a light one (luminance under 0.6); drawn where
	// a color is
	float ew = 0.0;
	${L.edge & 1 ? 'ew = max(ew, edgeCov(lS));' : ''}
	${L.edge & 2 ? 'ew = max(ew, edgeCov(lP));' : ''}
	${L.edge & 4 ? 'ew = max(ew, edgeCov(lR));' : ''}
	if (al == 0.0 || isnan(ew)) ew = 0.0;
	if (uWeb == 1) rgb = floor(rgb / 51.0 + 0.5) * 51.0;
	// a display-p3 destination: a smooth field paints the coordinate's own P3 color, not its sRGB
	// clip; a quantized one re-encodes its sRGB result (palette and web-safe colors are sRGB)
	${L.enc ? `vec3 p3c = ${L.clu === 0 ? `uWeb == 0 ? ${S}_p3(v) : ` : ''}rgb_p3(rgb);
	rgb = any(isnan(p3c)) ? vec3(0.0) : clamp(p3c, 0.0, 1.0) * 255.0;` : ''}
	O = vec4(mix(rgb / 255.0, vec3(uEdgeInk >= 0.0 ? uEdgeInk : dot(rgb, vec3(0.2126, 0.7152, 0.0722)) < 153.0 ? 1.0 : 0.0), ew * uEdgeA), al);
}`
}

// the lens a kernel is built for (planeFS): a gamut, a cluster lens, the edges drawn, the destination's encoding – what the
// page draws now is what a warm-up builds next (LENS)
const lensOf = (gamut, quant, enc = LENS.enc, look = null) => ({ gam: GAMI[gamut] || 0, clu: PALETTES[quant] ? 1 : quant === 'jnd' ? 2 : quant === '565' ? 3 : 0, edge: (look?.edges || []).reduce((m, g) => m | (EDGEB[g] || 0), 0), enc })
let LENS = { gam: globalThis.matchMedia?.('(color-gamut: p3)').matches ? 2 : 1, clu: 0, edge: 0, enc: 0 }   // till a paint says: the page's Limit by default, the screen's gamut (index.html SHOWS)
function planeProg(s, soon, L = LENS) {
	const key = `${s}|${L.gam}${L.clu}${L.edge}${L.enc}`
	let st = planeProgs.get(key)
	if (!st) {
		st = { pr: null, pending: true, bad: false, u: null, lutN: null, label:`plane ${key}`, kind: 'plane', space: s }
		planeProgs.set(key, st)
		st.job = () => {
			st.job = null
			compiling++
			st.onSettle = () => { compiling--; pump() }
			// one try over codegen AND program creation — any throw must settle the slot,
			// or the queue would jam with `compiling` stuck high
			try { const fs = planeFS(s, L); st.lutN = lutNames(fs); build(G, FSQ_VS, fs, null, null, st) }
			catch(e) { console.warn(`color-space/gl plane ${s}:`,e.message); st.pending = false; st.bad = true; st.onSettle() }
		}
		compileQ.push(st.job)
	}
	// a space asked for now goes ahead of the warm-ups still waiting
	if (soon && st.job) { compileQ.splice(compileQ.indexOf(st.job), 1); compileQ.unshift(st.job) }
	pump()
	return st
}

/** 'ready' | 'pending' | 'no' for the kernel of a lens (the gamut and the quantizer a paint passes) – starts its async
 *  compile on first ask */
export function planeGLStatus(s, gamut, quant) {
	if (!hasPlaneGL(s)) return 'no'
	const st = planeProg(s, true, gamut === undefined ? LENS : lensOf(gamut, quant))
	return st.bad ? 'no' : st.pending ? 'pending' : 'ready'
}

/**
 * Start compiling a space's plane and bar program – for the lens the page draws now – ahead of need: behind the programs
 * asked for now, or (soon) ahead of the other warm-ups. Compiled and linked only, on the driver's workers, never drawn: a
 * pixel drawn to build its GPU pipeline ahead (Metal under ANGLE builds it at the first draw) built it on the thread that
 * composites the screen – each neighbour warmed after an open stood the page still about a second
 */
export const warmPlaneGL = (s, soon) => { if (hasPlaneGL(s)) planeProg(s, soon) }

/**
 * Start compiling a space's programs ahead of need (hover, prev/next neighbours):
 * the shared plane/bar program and the 3D solid link in the background, so the
 * dossier opens straight into full-quality GPU paint.
 * @param {string} s space name
 */
export function warmGL(s) {
	warmPlaneGL(s)
	if (has3dGL(s)) mesh3Progs(mesh3State(mesh3Canvas()), s)
	// the dossier's other kernels too – the xy plate's and the image panels' – linking in the background: their first use
	// waited on the link (getUniformLocation), half a second a step to the next space
	if (hasGamutGL(s)) gamutProg(s)
	if (hasPlaneGL(s)) imgProg(s)
}

// 4 = the HUMAN lens: not a display gamut but the object-colour solid the 3D view
// draws — see visSolidGLSL (the locus below still voids imaginary coords in EVERY lens)
const GAMI = { srgb: 1, p3: 2, rec2020: 3, vis: 4 }
const EDGEB = { srgb: 1, p3: 2, rec2020: 4 }   // uEdge's bits

// The spectral locus as shader source: the polygon plus the even-odd test that says
// whether a chromaticity is a colour at all. ONE law, three surfaces — the xy panel
// draws this boundary, and the plane and bar kernels void past it under the human
// lens, so a coordinate no light can produce reads as void everywhere it appears.
// Every fixed palette shares one machinery. Palette sites are preconverted to
// OKLab on the CPU and uploaded beside their RGB values; each fragment converts its
// input once. A compact RGB lattice supplies 27 nearby candidates, whose exact
// OKLab distances keep edges smooth without scanning hundreds of sites per pixel.
// Small palettes are both cheaper and exact as a direct texture loop.
const PAL_UNIT=7, SITE_UNIT=6, PAL_DIRECT=32, PAL_W=2048   // PAL_W: the sites texture's width – a long palette wraps onto more rows (WebGL2 promises 2048)
const dedupe=(list)=>[...new Map(list.map(([,rgb])=>[rgb.join(','),rgb])).values()]
const PALETTES={ names:{rgb:dedupe(Object.entries(NAMES).map(([n,v])=>[n,v])),N:65},
	xkcd:{rgb:dedupe(PALS.xkcd),N:33}, tailwind:{rgb:dedupe(PALS.tailwind),N:49},
	pico8:{rgb:dedupe(PALS.pico8),N:65}, ansi:{rgb:dedupe(PALS.ansi),N:49} }
const palTex=new WeakMap()   // gl → Map(pal → {idx,sites})
/** a palette the page brings once it has it (meodai's color-name-list, imported on demand): its colors, its lattice's N */
export const addPalette=(id,rgb,N=65)=>{ PALETTES[id]??={ rgb:dedupe(rgb.map(c=>[0,c])), N } }
// nearest-site ORDER under each metric — one source for shader and page (index.html imports these)
export const METRICS=['oklab','de2000','de76','redmean']
export const siteDist=(m,q,s)=>m==='de2000'?deltaE2000(q.lab,s.lab)   // CIEDE2000 (measure.js: Sharma, Wu & Dalal 2005)
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
		// a long palette (thousands of sites) proposes from its OKLab grid (js/nearest.js) – the nearest in OKLab, or under
		// another metric the eight nearest, re-ranked exactly – where a scan of every site per cell would take seconds
		const grid=P.sites.length>2000&&okGrid(P.sites)
		if(!direct) for(let z=0;z<N;z++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
			const rgb=[x,y,z].map(v=>Math.round(v/(N-1)*255))
			const q={rgb,ok:space.rgb.oklab(...rgb),lab:space.rgb.lab(...rgb)}
			let bi=0, bd=Infinity
			if(grid){ const near=nearestK(grid,q.ok,metric==='oklab'?1:K); for(const i of near){ const d=siteDist(metric,q,P.sites[i]); if(d<bd){bd=d;bi=i} } }
			else if(metric==='de2000'&&P.sites.length>K){
				kd.fill(Infinity)
				for(let i=0;i<P.sites.length;i++){ const s=P.sites[i]
					const d=(q.lab[0]-s.lab[0])**2+(q.lab[1]-s.lab[1])**2+(q.lab[2]-s.lab[2])**2
					if(d<kd[K-1]){ let j=K-1; while(j>0&&kd[j-1]>d){ kd[j]=kd[j-1]; ki[j]=ki[j-1]; j-- } kd[j]=d; ki[j]=i } }
				for(let k=0;k<K;k++){ const d=siteDist(metric,q,P.sites[ki[k]]); if(d<bd){bd=d;bi=ki[k]} } }
			else for(let i=0;i<P.sites.length;i++){ const d=siteDist(metric,q,P.sites[i]); if(d<bd){bd=d;bi=i} }
			out[o++]=bi }
		P.lat[metric]={N,out} }
	// the sites texture: rows of PAL_W sites, three a band – OKLab, RGB, CIELAB – a band for each PAL_W sites (siteAt_)
	if(!P.siteData){ const n=P.sites.length, W=Math.min(n,PAL_W), H=Math.ceil(n/PAL_W)*3, sd=new Float32Array(W*H*3)
		P.sites.forEach((s,i)=>{ const x=i%PAL_W, b=Math.floor(i/PAL_W)*3; sd.set(s.ok,((b)*W+x)*3); sd.set(s.rgb,((b+1)*W+x)*3); sd.set(s.lab,((b+2)*W+x)*3) })
		P.siteData=sd; P.siteW=W; P.siteH=H }
	return { sites:P.sites, siteData:P.siteData, siteW:P.siteW, siteH:P.siteH, texN:P.lat[metric].N, data:P.lat[metric].out } }
let PAL_SRC=null
const namedGLSL=()=>PAL_SRC??=`uniform highp usampler3D uPalIdx;   // per-cell nearest-site index, the ACTIVE palette×metric lattice
uniform highp sampler2D uPalSites;  // bands of three rows, ${PAL_W} sites a band: OKLab · RGB · CIELAB
ivec2 siteAt_(int i, int k) { return ivec2(i % ${PAL_W}, i / ${PAL_W} * 3 + k); }
uniform int uMetric;                // 0 oklab · 1 de2000 · 2 de76 · 3 redmean – METRICS order, page and shader alike
float de2000_(vec3 p, vec3 s) {   // CIEDE2000, Sharma/Wu/Dalal 2005 – mirrors the JS above line for line
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
	// GLSL pow(x, 2.0) is exp(2·log x) — NaN for x<0, and (hm-275)/25 is negative for every
	// hue below 275° (reds, yellows, greens, cyans: most colours). That NaN poisoned ΔE2000
	// everywhere, collapsing those pixels to site 0. Square by multiplication instead.
	float hd = (hm - 275.0) / 25.0;
	float RT = -sin(2.0 * 30.0 * exp(-hd * hd) * R) * 2.0 * sqrt(m7 / (m7 + pow(25.0, 7.0)));
	float qa = dL / SL, qb = dC / SC, qc = dH / SH;
	return sqrt(qa * qa + qb * qb + qc * qc + RT * qb * qc);
}
float siteDist_(vec3 rgb, vec3 okp, vec3 labp, int i) {
	if (uMetric == 1) return de2000_(labp, texelFetch(uPalSites, siteAt_(i, 2), 0).rgb);
	if (uMetric == 2) { vec3 d = labp - texelFetch(uPalSites, siteAt_(i, 2), 0).rgb; return dot(d, d); }
	if (uMetric == 3) { vec3 sr = texelFetch(uPalSites, siteAt_(i, 1), 0).rgb;
		float rm = (rgb.r + sr.r) * 0.5; vec3 d = rgb - sr;
		return (2.0 + rm / 256.0) * d.r * d.r + 4.0 * d.g * d.g + (2.0 + (255.0 - rm) / 256.0) * d.b * d.b; }
	vec3 d = okp - texelFetch(uPalSites, siteAt_(i, 0), 0).rgb; return dot(d, d);
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
		return texelFetch(uPalSites, siteAt_(bi, 1), 0).rgb;
	}
	int N = textureSize(uPalIdx, 0).x;
	vec3 p = clamp(rgb, 0.0, 255.0) / 255.0 * float(N - 1);
	ivec3 c = ivec3(floor(p + 0.5));
	for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
		ivec3 q = clamp(c + ivec3(x,y,z), ivec3(0), ivec3(N - 1));
		int i = int(texelFetch(uPalIdx, q, 0).r);
		float ds = siteDist_(rgb, okp, labp, i); if (ds < bd) { bd = ds; bi = i; }
	}
	return texelFetch(uPalSites, siteAt_(bi, 1), 0).rgb;
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
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB32F,P.siteW,P.siteH,0,gl.RGB,gl.FLOAT,P.siteData)
		for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D,k,v) }
	else{ gl.activeTexture(gl.TEXTURE0+PAL_UNIT); gl.bindTexture(gl.TEXTURE_3D,t.idx)
		gl.activeTexture(gl.TEXTURE0+SITE_UNIT); gl.bindTexture(gl.TEXTURE_2D,t.sites) }
	gl.uniform1i(locIdx,PAL_UNIT); if(locSites) gl.uniform1i(locSites,SITE_UNIT); gl.activeTexture(gl.TEXTURE0) }
const Q3I = { web: 101, names: 102, meodai: 102, xkcd: 102, tailwind: 102, pico8: 102, ansi: 102, jnd: 103, 565: 104 }
const q3Mode = q => typeof q === 'number' ? q : Q3I[q] || 0
const quant3GLSL = () => `${namedGLSL()}
vec3 quant3_(vec3 c, int mode) {
	vec3 rgb = floor(clamp(c, 0.0, 1.0) * 255.0 + 0.5);
	if (mode == 101) return floor(rgb / 51.0 + 0.5) * 51.0 / 255.0;
	if (mode == 102) return named_(rgb) / 255.0;
	if (mode == 104) return floor(floor(rgb / 255.0 * vec3(31.0, 63.0, 31.0) + 0.5) / vec3(31.0, 63.0, 31.0) * 255.0 + 0.5) / 255.0;
	vec3 okp = rgb_oklab(rgb);   // 103 – the JND grid: ~2.3 ΔE*ab, the eye's own step
	okp = vec3((floor(min(okp.x, .9999) / .023) + .5) * .023, round(okp.y / .023) * .023, round(okp.z / .023) * .023);
	return floor(clamp(oklab_rgb(okp), 0.0, 255.0) + 0.5) / 255.0;
}`

let LOCUS_SRC = null
const locusGLSL = () => LOCUS_SRC ??= ((P) => `const vec2 LOC[${P.length}] = vec2[${P.length}](${P.map((q) => `vec2(${q[0].toFixed(5)}, ${q[1].toFixed(5)})`).join(', ')});
bool inside(vec2 p) {   // even-odd over the closed locus + purple line; on the curve within LOCUS_EPS is on it (core.js)
	bool c = false;
	for (int i = 0, j = ${P.length} - 1; i < ${P.length}; j = i++) {
		vec2 a = LOC[i], b2 = LOC[j];
		if ((a.y > p.y) != (b2.y > p.y) && p.x < (b2.x - a.x) * (p.y - a.y) / (b2.y - a.y) + a.x) c = !c;
	}
	if (c) return true;
	for (int i = 0, j = ${P.length} - 1; i < ${P.length}; j = i++) {   // only a point outside pays for the distance
		vec2 a = LOC[i], e = LOC[j] - a, q = p - a;
		if (length(q - e * clamp(dot(q, e) / dot(e, e), 0.0, 1.0)) < ${LOCUS_EPS}) return true;
	}
	return false;
}
bool visXYZ(vec3 c) {   // black is a colour; a chromaticity off the locus is imaginary
	float s = c.x + c.y + c.z;
	if (s <= 1e-6) return c.x > -1e-4 && c.y > -1e-4 && c.z > -1e-4;
	return inside(vec2(c.x / s, c.y / s));
}`)(locus())

// The HUMAN solid as shader source — the SAME body visSurf tessellates for the 3D view,
// so the picker's field and the solid's cross-section are one shape. A zonoid is convex,
// so membership is a support test (u·p ≤ h(u)) over sampled directions; the polytope
// CONTAINS the body, so it never clips a real colour. Plane fragments use a 32-direction
// preview hull for interaction cost. A bar has only one scanline, so it can afford all
// 512 directions and must: nonlinear TSL/Munsell sweeps magnify a coarse hull by several
// percent, making the dossier disagree with the catalog's exact scalar boundary.
let VSOL_SRC = null
const visSolidGLSL = () => VSOL_SRC ??= ((full) => { const fast = full.filter((_, i) => i % 16 === 0), src = D => D.map(d => `vec4(${d[0].toFixed(5)}, ${d[1].toFixed(5)}, ${d[2].toFixed(5)}, ${d[3].toFixed(3)})`).join(', ')
	return `const vec4 VSD[${fast.length}] = vec4[${fast.length}](${src(fast)});
const vec4 VSDE[${full.length}] = vec4[${full.length}](${src(full)});
bool inVisSolid(vec3 c) {   // interactive plane preview
	for (int i = 0; i < ${fast.length}; i++) { vec4 d = VSD[i]; if (dot(d.xyz, c) > d.w * 1.002) return false; }
	return true;
}
bool inVisSolidExact(vec3 c) {   // one-pixel-high bars: exact scalar/GPU parity
	for (int i = 0; i < ${full.length}; i++) { vec4 d = VSDE[i]; if (dot(d.xyz, c) > d.w * 1.002) return false; }
	return true;
}` })(visSolid())

// program + uniforms + draw for one plane/bar kernel
const KV4 = [0, 0, 0, 0]   // reused held-values scratch — the atlas calls this ~60× per drag frame
function kernelDraw(st, w, h, vals, a, b, rx, ry, gamut, quant, polar, tri, metric, ox = 0, oy = 0, enc = 0, look = null) {
	// Flat cluster fills must survive readback byte-for-byte (marker centering uses
	// the painted run); retain hardware dithering only for genuinely smooth fields.
	quant ? G.disable(G.DITHER) : G.enable(G.DITHER)
	G.useProgram(st.pr)
	// uniform locations resolve lazily at FIRST DRAW — at resolve time the GPU
	// process is mid-compile-burst and each lookup stalls behind the whole queue
	st.u ??= Object.fromEntries(['uV', 'uAB', 'uRX', 'uRY', 'uRes', 'uOff', 'uQ', 'uWeb', 'uPolar', 'uTri', 'uDim', 'uEdgeW', 'uEdgeA', 'uEdgeInk', 'uCut', 'uMetric', 'uPalIdx', 'uPalSites'].map(n => [n, G.getUniformLocation(st.pr, n)]))
	bindLuts(G, st)
	KV4[0] = KV4[1] = KV4[2] = KV4[3] = 0; for (let i = 0; i < Math.min(4, vals.length); i++) KV4[i] = vals[i]
	G.uniform4f(st.u.uV, KV4[0], KV4[1], KV4[2], KV4[3])
	G.uniform2i(st.u.uAB, a, b)
	G.uniform2f(st.u.uRX, rx[0], rx[1])
	G.uniform2f(st.u.uRY, ry[0], ry[1])
	G.uniform2f(st.u.uRes, w, h)
	G.uniform2f(st.u.uOff, ox, oy)
	G.uniform1f(st.u.uQ, typeof quant === 'number' ? quant : 0)
	G.uniform1i(st.u.uWeb, quant === 'web' ? 1 : 0)
	G.uniform1i(st.u.uPolar, polar ? 1 : 0)
	G.uniform1i(st.u.uTri, tri || 0)
	if (st.u.uDim) G.uniform1i(st.u.uDim, dimOf(st.space))
	G.uniform1f(st.u.uEdgeW, look?.width ?? 1)
	G.uniform1f(st.u.uEdgeA, look?.alpha ?? 1)
	G.uniform1f(st.u.uEdgeInk, look?.ink ?? -1)
	G.uniform1i(st.u.uCut, look?.cut ? 1 : 0)
	// sampler units are program state and DEFAULT TO 0 — an int 3D sampler and a float 2D
	// sampler colliding on unit 0 is GL_INVALID_OPERATION on every draw, palette bound or not
	if (st.u.uPalIdx) G.uniform1i(st.u.uPalIdx, PAL_UNIT)
	if (st.u.uPalSites) G.uniform1i(st.u.uPalSites, SITE_UNIT)
	if (st.u.uMetric) G.uniform1i(st.u.uMetric, Math.max(0, METRICS.indexOf(metric || 'oklab')))
	if (PALETTES[quant]) bindPalette(G, st.u.uPalIdx, st.u.uPalSites, quant, metric)
	G.drawArrays(G.TRIANGLES, 0, 3)
}

// CV only grows: a resize reallocates its drawing buffer – a stall on every switch between a plane's size and a bar's,
// which alternate on every frame of a drag or a zoom. Each draw takes its w × h at the buffer's bottom-left, the
// viewport's origin; cutCV is that rectangle in the canvas's image (top-left origin) – what every blit copies out
const fitCV = (w, h) => { if (CV.width < w) CV.width = w; if (CV.height < h) CV.height = h }
const SHEET = [1536, 512]   // a batch's least sheet of CV (cellFor): three full plates a shelf
const cutCV = (w, h) => [0, CV.height - h, w, h]
/** Grow the shared kernel canvas ahead of its first use, at idle: each growth reallocates the drawing buffer – 50 ms a time
 *  that once landed inside a dossier's first open. To the dossier's largest plate, the xy plate's (≈ 420 × 462 CSS px at
 *  the widest), at the screen's density. On a GPU only: a software rasterizer paints the JS paths */
export const warmKernels = () => { if (!G || softGL() || globalThis.matchMedia?.('(pointer: coarse)').matches) return   // a phone keeps its GPU memory for a card it may never open
	const d = globalThis.devicePixelRatio || 1; fitCV(Math.min(2048, Math.max(SHEET[0], Math.ceil(420 * d))), Math.min(2048, Math.max(SHEET[1], Math.ceil(462 * d))))   // and a batch's sheet (cellFor): a first batch grew it once more, inside the click
	setTimeout(() => mesh3Canvas() && mesh3State(mesh3Canvas()), 500) }   // the solid's context and lattices too, a beat later: 80 ms that sat inside a first dossier's click
// the destination canvas declares its color space; a display-p3 one gets P3 pixels end to end: the kernel encodes them
// (uEnc) into CV's sRGB buffer, and they go across as they are – read out, put in as a P3 image (flushCells), never a
// color-managed copy. CV's buffer itself stays sRGB: switched to display-p3 and back, Chromium went on copying it out as
// P3 – an sRGB file's fields after a P3 one came out oversaturated (183, 39, 0 for 168, 53, 0)
const P3RAW = typeof ImageData === 'function' && 'colorSpace' in ImageData.prototype
const encOf = cv2d => cv2d.getContext('2d')?.getContextAttributes?.().colorSpace === 'display-p3' && P3RAW ? 1 : 0
// at: the draw's cell of CV (cellFor), its bottom-left in GL's own coordinates; none, the buffer's own bottom-left
function drawKernel(st, w, h, vals, a, b, rx, ry, gamut, quant, polar, tri, metric, enc = 0, look = null, at = null) {
	const x = at ? at.x : 0, y = at ? at.y : 0
	if (!at) fitCV(w, h)
	G.viewport(x, y, w, h)
	G.disable(G.DEPTH_TEST)
	G.enable(G.SCISSOR_TEST); G.scissor(x, y, w, h)   // the clear is the cell's alone: the frame's other cells stand
	G.clearColor(0, 0, 0, 0)
	G.clear(G.COLOR_BUFFER_BIT)
	G.disable(G.SCISSOR_TEST)
	kernelDraw(st, w, h, vals, a, b, rx, ry, gamut, quant, polar, tri, metric, x, y, enc, look)
}

/**
 * Paint one plane on the GPU and blit it into the plane's 2d canvas.
 * Call only when planeGLStatus(s) is 'ready'. quant is a numeric lattice or one
 * of the output-palette/JND/RGB565 lenses; every lens stays on the GPU path.
 */
// A task's planes and bars share one copy out of CV: each draws into a cell of its own – shelves from the bottom-left –
// and once the task's draws are done (a microtask) every canvas takes its cell, all from the one image CV holds then.
// Safari waits on each copy out of a WebGL canvas, ~10 ms, synchronous or not (an asynchronous snapshot only moved the
// wait to the next draw): five a frame made a dossier's slider drag 8 fps. A batch never grows CV (a growth clears it):
// its first cell sizes it, a cell past it sends the batch out first
let cells = null
function cellFor(w, h, enc) {
	if (cells && cells.enc !== enc) flushCells()   // one encoding a batch: its cells go out one way
	if (cells && cells.x + w > CV.width) { cells.x = 0; cells.y += cells.row; cells.row = 0 }   // the next shelf
	if (cells && (cells.y + h > CV.height || w > CV.width)) flushCells()
	if (!cells) { fitCV(Math.min(2048, Math.max(w, SHEET[0])), Math.min(2048, Math.max(h, SHEET[1])))
		cells = { list: [], x: 0, y: 0, row: 0, enc }; queueMicrotask(flushCells) }
	const at = { x: cells.x, y: cells.y }
	cells.x += w; cells.row = Math.max(cells.row, h)
	return at
}
// deferred: the copy may wait for the task's other draws; else it is made now – what reads the canvas next reads it painted
function presentKernel(cv2d, deferred, at) {
	if (!cv2d.getContext('2d')) return false
	cells.list.push({ cv2d, rev: cv2d._glRev = (cv2d._glRev || 0) + 1, x: at.x, y: at.y, w: cv2d.width, h: cv2d.height })
	if (!deferred) flushCells()
	return true
}
function flushCells() {
	const b = cells; cells = null
	if (!b) return
	const H = CV.height, live = b.list.filter(c => c.cv2d._glRev === c.rev)   // a canvas painted again in the batch: its newer cell is its
	// P3 cells go out raw: one read of the batch's box – each read waits on the GPU, and a read a cell cost a frame 7 ms in
	// Chrome (3.3 for the one), 9.4 in WebKit (6.7)
	const W = b.enc && Math.max(0, ...live.map(c => c.x + c.w)), BH = b.enc && Math.max(0, ...live.map(c => c.y + c.h)), all = b.enc && W && BH && new Uint8ClampedArray(W * BH * 4)
	if (all) G.readPixels(0, 0, W, BH, G.RGBA, G.UNSIGNED_BYTE, all)
	for (const c of live) { const d = c.cv2d, ctx = d.getContext('2d')
		if (all) { const img = new ImageData(c.w, c.h, { colorSpace: 'display-p3' }), row = c.w * 4
			for (let y = 0; y < c.h; y++) { const o = ((c.y + c.h - 1 - y) * W + c.x) * 4; img.data.set(all.subarray(o, o + row), y * row) }   // GL's rows run bottom up
			ctx.putImageData(img, 0, 0) }
		else { ctx.clearRect(0, 0, d.width, d.height); ctx.drawImage(CV, c.x, H - c.y - c.h, c.w, c.h, 0, 0, d.width, d.height) }
		presented(d) }
}
// a 'present' event on the canvas once the frame is in it: a deferred paint lands at its task's end, and whatever reads
// the pixels (a label's ink) must read them then
const presented = cv2d => cv2d.dispatchEvent(new Event('present'))

// look: { edges: ['srgb' | 'p3' | 'rec2020'…], width: device px, alpha, ink: 1 white | 0 black (else each pixel's), cut } – edges draws those gamuts' boundaries as lines
// over the field, inked against it; cut voids the field past `gamut` instead of ghosting it
export function paintPlaneGL(cv2d, s, vals, a, b, rx, ry, gamut, quant, polar, tri, metric, deferred = false, look = null) {
	const enc = encOf(cv2d), L = lensOf(gamut, quant, enc, look); if (!look) LENS = L
	const st = planeProg(s, true, L)
	if (!st.pr || st.bad || st.pending) return false
	const at = cellFor(cv2d.width, cv2d.height, enc)
	drawKernel(st, cv2d.width, cv2d.height, vals, a, b, rx, ry, gamut, quant, polar, tri, metric, enc, look, at)
	return presentKernel(cv2d, deferred, at)
}

/**
 * Paint a channel bar (1-D sweep of channel `i`, held others) with per-pixel
 * gamut alpha — the smooth version of the stepped CSS mask. `metric` is the palette
 * lens's distance, as for the planes – a bar and a plane of one lens agree.
 */
export function paintBarGL(cv2d, s, vals, i, ri, gamut, quant = 0, metric, deferred = false, look = null) {
	if (!cv2d.getContext('2d')) return false   // a canvas claimed by another context type — the CSS ramp covers it
	const enc = encOf(cv2d), L = lensOf(gamut, quant, enc, look); if (!look) LENS = L
	const st = planeProg(s, true, L)
	if (!st.pr || st.bad || st.pending) return false
	const at = cellFor(cv2d.width, cv2d.height, enc)
	drawKernel(st, cv2d.width, cv2d.height, vals, i, -1, ri, [0, 0], gamut, quant, false, 0, metric, enc, look, at)
	return presentKernel(cv2d, deferred, at)
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
export const has3dGL = s => (s === 'rgb' || (!!graph[s] && dimOf(s) === 3)) && !softGL() && !!(mesh3Canvas() && mesh3State(mesh3Canvas()))

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
	// range-box cap faces as fractional coords (the fixed axis on its face: vsCap's uStep says how far inside it is read)
	const CAP = 56
	const cpos = [], cidx = []
	for (let fi = 0; fi < 3; fi++) for (let side = 0; side < 2; side++) {
		const [ua, ub] = [0, 1, 2].filter(k => k !== fi)
		const base = cpos.length / 3
		for (let i = 0; i <= CAP; i++) for (let j = 0; j <= CAP; j++) {
			const fr = [0, 0, 0]
			fr[fi] = side; fr[ua] = i / CAP; fr[ub] = j / CAP
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
uniform vec3 uCMin, uCMax;   // the UNPADDED data extent – where the solid truly ends
uniform ivec4 uMap;   // x=ti  y=ai(-1: none)  z=mi  w unused
uniform ivec2 uWb;    // (wI, bI) for the hwb family, else (-1,-1)
uniform vec2 uRot;
uniform float uScale;
float raw_(vec3 v, int k) { return (v[k] - uMin[k]) / (uMax[k] - uMin[k]); }
// positions are NOT clamped: beyond-fit vertices keep their true direction and the
// fragment clip cuts the triangle exactly at the box – a crisp planar cross-section.
// Clamping instead flattened those triangles onto the box plane as dark spike fans.
// The bake's cone-wall bisection is what bounds a wild formula (HSI's S at optimal
// colors) – every vertex lands ON the sanity window, never past it.
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
// here: desaturate toward the gray of its own luminance until representable, holding hue and
// lightness, instead of a flat per-channel clamp that over-saturates and hue-shifts
// wide-gamut colours. The surface body computes this same knee in its vertex stage;
// the caps reuse it so a sealed cut face reads the SAME colour as the wall beside it.
const SOFT_DISP = `vec3 softDisp(vec3 disp) {
	// its own gray: of its luminance – read from the light, not the code values. A weighted sum of those is no lightness
	// once one of them is negative: a deep violet's green, far under zero, took the sum to nothing and the color to black
	// (the dark sails of every solid past sRGB's blue), and P3's red to two-thirds of its light. Held a tenth under white:
	// at white's own luminance no color is left but white, and a light as bright as white lost its hue to it
	vec3 u = disp / 255.0, a = abs(u);
	float Y = clamp(dot(sign(u) * mix(a / 12.92, pow((a + 0.055) / 1.055, vec3(2.4)), step(0.04045, a)), vec3(0.2126, 0.7152, 0.0722)), 0.0, 0.9);
	float lum = 255.0 * (Y > 0.0031308 ? 1.055 * pow(Y, 1.0 / 2.4) - 0.055 : 12.92 * Y);
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

// ── the LIGHT body: {XYZ real per the locus, 0 ≤ Y ≤ 100} – the cone of every real
// light up to the display-white ceiling. Lateral surface: rays from black through the
// locus perimeter (spectrals + the purple line); lid: the filled horseshoe at Y=100,
// shrinking to the white point so the grid closes at a pole. Same contract as visSurf. ──
const LIGHTS = new Map()
export function lightSurf(G = 96) {
	if (LIGHTS.has(G)) return LIGHTS.get(G)
	const N = 160, per = []   // the closed perimeter: 380–700 nm spectrals, then the purple line
	for (let i = 0; i < N; i++) { const nm = 380 + i / (N - 1) * 320
		const [X, Y, Z] = space.wavelength.xyz(nm), t = X + Y + Z
		per.push([X / t, Y / t]) }
	const PURP = 24
	for (let i = 1; i <= PURP; i++) { const t = i / (PURP + 1), a = per[N - 1], b = per[0]
		per.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) }
	const M = per.length
	const W = [0.31272, 0.32903]   // D65 white chromaticity – the lid's closing pole
	const pos = new Float32Array((G + 1) * (G + 1) * 3)
	const half = Math.ceil(G / 2)
	let o = 0
	for (let i = 0; i <= G; i++) { const [px, py] = per[Math.round(i / G * M) % M]   // i=G wraps to per[0] – the final purple→violet strip closes, no seam gap
		for (let j = 0; j <= G; j++) {
			let x, y, Y
			if (j <= half) { x = px; y = py; Y = Math.pow(j / half, 1.6) * 100 }   // lateral: black-biased rows, like the surface body's dark skirt
			else { const t = (j - half) / (G - half); x = px + (W[0] - px) * t; y = py + (W[1] - py) * t; Y = 100 }   // the lid, closing at white
			pos[o++] = x / y * Y; pos[o++] = Y; pos[o++] = (1 - x - y) / y * Y } }
	const idx = new Uint32Array(G * G * 6)
	o = 0
	for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
		const q = i * (G + 1) + j
		idx[o++] = q; idx[o++] = q + G + 1; idx[o++] = q + 1
		idx[o++] = q + G + 1; idx[o++] = q + G + 2; idx[o++] = q + 1 }
	const out = { pos, idx, G }
	LIGHTS.set(G, out)
	return out
}

// ── the surface solid as a table: how far it reaches along each chromaticity – the X + Y + Z of the optimal color there.
// The solid is convex and holds black, so a color lies in it while its own X + Y + Z is no more. Read off the lattice the
// body itself is drawn from (visSurf: each cell's plane, cut by the ray through a texel's chromaticity), so a face tested
// by it ends where the body does – the 512 supporting planes the pickers cut by (core.js visSolid) stand 0.35 off that
// lattice on average and 2.7 at worst (Y of white 100). A texel past the lattice's edge repeats its neighbour: the locus
// is the test's own (inside). For a body in parts alone (fsCapOpen) ──
let VREACH = null
function visReach() {
	if (VREACH) return VREACH
	const { pos, idx } = visSurf(256), t = new Float32Array(VR * VR)   // the lattice drawn (mesh3State)
	for (let q = 0; q < idx.length; q += 3) {
		const P = [0, 1, 2].map(k => pos.subarray(idx[q + k] * 3, idx[q + k] * 3 + 3)), S = P.map(v => v[0] + v[1] + v[2])
		if (S.some(v => v < 1e-6)) continue   // a cell at the black pole: a line in chromaticity, no area
		const c = P.map((v, k) => [v[0] / S[k] / VRX * VR - 0.5, v[1] / S[k] / VRY * VR - 0.5])   // in texels, their centres at whole numbers
		const area = (c[1][0] - c[0][0]) * (c[2][1] - c[0][1]) - (c[2][0] - c[0][0]) * (c[1][1] - c[0][1])
		if (Math.abs(area) < 1e-12) continue
		const e = [1, 2].map(k => [P[k][0] - P[0][0], P[k][1] - P[0][1], P[k][2] - P[0][2]])
		const n = [e[0][1] * e[1][2] - e[0][2] * e[1][1], e[0][2] * e[1][0] - e[0][0] * e[1][2], e[0][0] * e[1][1] - e[0][1] * e[1][0]], d = n[0] * P[0][0] + n[1] * P[0][1] + n[2] * P[0][2]
		const lo = k => Math.max(0, Math.floor(Math.min(c[0][k], c[1][k], c[2][k]))), hi = k => Math.min(VR - 1, Math.ceil(Math.max(c[0][k], c[1][k], c[2][k])))
		for (let y = lo(1); y <= hi(1); y++) for (let x = lo(0); x <= hi(0); x++) {
			const w0 = ((c[1][0] - x) * (c[2][1] - y) - (c[2][0] - x) * (c[1][1] - y)) / area, w1 = ((c[2][0] - x) * (c[0][1] - y) - (c[0][0] - x) * (c[2][1] - y)) / area
			if (w0 < -1e-6 || w1 < -1e-6 || 1 - w0 - w1 < -1e-6) continue
			const cx = (x + 0.5) / VR * VRX, cy = (y + 0.5) / VR * VRY, r = d / (n[0] * cx + n[1] * cy + n[2] * (1 - cx - cy))
			if (r > t[y * VR + x]) t[y * VR + x] = r   // (not a NaN, nor a negative)
		}
	}
	const out = new Float32Array(VR * VR * 4)
	for (let y = 0; y < VR; y++) for (let x = 0; x < VR; x++) { let v = t[y * VR + x]
		if (!v) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < VR && Y < VR && t[Y * VR + X] > v) v = t[Y * VR + X] }
		out[(y * VR + x) * 4] = v }
	return VREACH = out
}
const VREACH_GLSL = `uniform sampler2D visreachtex;
float visReach_(vec2 c) {   // by chromaticity, between its four texels
	vec2 q = c * vec2(${(VR / VRX).toFixed(4)}, ${(VR / VRY).toFixed(4)}) - 0.5; ivec2 i = clamp(ivec2(floor(q)), ivec2(0), ivec2(${VR - 2})); vec2 f = clamp(q - vec2(i), 0.0, 1.0);
	return mix(mix(texelFetch(visreachtex, i, 0).r, texelFetch(visreachtex, i + ivec2(1, 0), 0).r, f.x), mix(texelFetch(visreachtex, i + ivec2(0, 1), 0).r, texelFetch(visreachtex, i + ivec2(1, 1), 0).r, f.x), f.y);
}`

// ── a body in parts' own lattice: the volume's, with a point ON the void wherever a cell crossed it. A cell astride the
// void – one point on the spectrum's far red, the next among the purples – is flat between them, while a wavelength runs
// most of its way in a sliver of the cell: cut where the flat cell reaches the part's end, the surface met its wall up to
// a cell off the face drawn there, a hair of the inside showing between. So along every edge that crosses, the crossing
// is found (halved 24 times, by the space's own conversion) and the nearer of its two points moved there: a point of
// both parts, at each one's end. pts: the lattice's points in the volume's coordinates; to: those into the space's;
// k: the split channel; parts: each one's two ends ──
export function seamLattice(pts, idx, to, k, parts) {
	const n = pts.length / 3, out = new Float32Array(pts), P = new Int8Array(n), on = new Uint8Array(n)
	const of = (x, y, z) => { let v; try { v = to(x, y, z)[k] } catch { return -1 } return parts.findIndex(p => v >= p[0] && v <= p[1]) }   // −1: of no part (a gray)
	for (let i = 0; i < n; i++) P[i] = of(pts[3 * i], pts[3 * i + 1], pts[3 * i + 2])
	for (let q = 0; q < idx.length; q += 3) for (let e = 0; e < 3; e++) { const a = idx[q + e], b = idx[q + (e + 1) % 3]
		if (on[a] || on[b] || P[a] < 0 || P[b] < 0 || P[a] === P[b]) continue
		const at = t => [0, 1, 2].map(c => pts[3 * a + c] + (pts[3 * b + c] - pts[3 * a + c]) * t)
		let lo = 0, hi = 1
		for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (of(...at(m)) === P[a]) lo = m; else hi = m }
		const w = lo + hi < 1 ? a : b
		out.set(at((lo + hi) / 2), 3 * w); on[w] = 1 }
	return out
}

// ── the bake as a fragment pass: transform feedback's vertex variant was built at a space's first bake, on the thread that
// composites the screen (Metal under ANGLE), twice the cost of the same conversion drawn plainly (CAM16 0.22 s, 0.09). Where
// float targets render (EXT_color_buffer_float), a point is a texel: read from its source texture, written to two float
// targets – (v, bad) and (rgb, 1) – and read out into vertex buffers on the GPU (a pack buffer, no CPU copy). Else the
// transform feedback bake still runs ──
const BAKE_W = 1024, BAKE_UNIT = 5
// a lattice's or a cloud's points as the bake's source: a texel each, RGBA32F
const bakeSrc = (gl, src, pts) => { const n = pts.length / 3, h = Math.max(1, Math.ceil(n / BAKE_W)), d = new Float32Array(BAKE_W * h * 4)
	for (let k = 0; k < n; k++) { d[k * 4] = pts[k * 3]; d[k * 4 + 1] = pts[k * 3 + 1]; d[k * 4 + 2] = pts[k * 3 + 2] }
	src.tex ??= gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, src.tex)
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, BAKE_W, h, 0, gl.RGBA, gl.FLOAT, d)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
	src.n = n; src.h = h; return src }
// the bake's targets and the vertex buffers they're read into, grown to the rows a bake needs
function bakeOut(gl, out, h) {
	if (out.fbo && out.h >= h) return out
	out.fbo ??= gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo)
	for (const k of [0, 1]) { const t = out[`t${k}`] ??= gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, BAKE_W, h, 0, gl.RGBA, gl.FLOAT, null)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + k, gl.TEXTURE_2D, t, 0)
		const b = out[k ? 'b' : 'a'] ??= gl.createBuffer(); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, b); gl.bufferData(gl.PIXEL_PACK_BUFFER, BAKE_W * h * 16, gl.DYNAMIC_COPY) }
	gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null); gl.bindFramebuffer(gl.FRAMEBUFFER, null)
	out.h = h; return out
}
// the bake's vertex program as that fragment pass: its conversion unchanged, its point a texel of uSrc, its three outputs two
const bakeFrag = vs => vs.replace('in vec3 aSrc;', 'uniform highp sampler2D uSrc;\nuniform int uN, uW;\nlayout(location = 0) out vec4 O0;\nlayout(location = 1) out vec4 O1;')
	.replace('out vec3 tV;\nout vec3 tRgb;\nout float tBad;\n', '')
	.replace('void main() {', 'void main() {\n\tivec2 px_ = ivec2(gl_FragCoord.xy);\n\tif (px_.y * uW + px_.x >= uN) { O0 = vec4(0.0); O1 = vec4(0.0); return; }\n\tvec3 aSrc = texelFetch(uSrc, px_, 0).xyz;\n\tvec3 tV, tRgb; float tBad;')
	.replace('gl_Position = vec4(0.0, 0.0, 0.0, 1.0);', 'O0 = vec4(tV, tBad); O1 = vec4(tRgb, 1.0);')
// one bake: src's points through the program into out – either path, the same three outputs a point
function bakeRun(st, bake, setU, src, out, attrs) {
	const gl = st.gl
	// a buffer an attribute points at is no bake's target (transform feedback: INVALID_OPERATION, the bake skipped) – off them first
	gl.bindBuffer(gl.ARRAY_BUFFER, st.tb)
	for (const a of attrs) if (a >= 0) { gl.disableVertexAttribArray(a); gl.vertexAttribPointer(a, 1, gl.FLOAT, false, 0, 0) }
	gl.useProgram(bake.pr); setU(bake.u); bindLuts(gl, bake)
	if (bake.fs) {
		bakeOut(gl, out, src.h)
		gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])
		gl.viewport(0, 0, BAKE_W, src.h); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST)
		gl.activeTexture(gl.TEXTURE0 + BAKE_UNIT); gl.bindTexture(gl.TEXTURE_2D, src.tex); gl.activeTexture(gl.TEXTURE0)
		gl.uniform1i(bake.u.uSrc, BAKE_UNIT); gl.uniform1i(bake.u.uN, src.n); gl.uniform1i(bake.u.uW, BAKE_W)
		gl.drawArrays(gl.TRIANGLES, 0, 3)
		for (const k of [0, 1]) { gl.readBuffer(gl.COLOR_ATTACHMENT0 + k); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, out[k ? 'b' : 'a']); gl.readPixels(0, 0, BAKE_W, src.h, gl.RGBA, gl.FLOAT, 0) }
		gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null); gl.bindFramebuffer(gl.FRAMEBUFFER, null)
		gl.enable(gl.BLEND); gl.enable(gl.DEPTH_TEST)
		return
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, src.buf)
	gl.enableVertexAttribArray(bake.aSrc); gl.vertexAttribPointer(bake.aSrc, 3, gl.FLOAT, false, 0, 0)
	gl.enable(gl.RASTERIZER_DISCARD)
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, out.buf)
	gl.beginTransformFeedback(gl.POINTS)
	gl.drawArrays(gl.POINTS, 0, src.n)
	gl.endTransformFeedback()
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null)
	gl.disable(gl.RASTERIZER_DISCARD)
}
// a draw's attributes on a bake's output: (v, bad) | (rgb) 16 bytes a point from the fragment pass, 28 interleaved from
// transform feedback
function bakedAttrs(gl, out, p) {
	const at = (a, n, stride, off) => { if (a < 0) return; gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, n, gl.FLOAT, false, stride, off) }
	if (out.a) { gl.bindBuffer(gl.ARRAY_BUFFER, out.a); at(p.aV, 3, 16, 0); at(p.aBad, 1, 16, 12); gl.bindBuffer(gl.ARRAY_BUFFER, out.b); at(p.aRgb, 3, 16, 0) }
	else { gl.bindBuffer(gl.ARRAY_BUFFER, out.buf); at(p.aV, 3, 28, 0); at(p.aRgb, 3, 28, 12); at(p.aBad, 1, 28, 24) }
}

const REACH = 256   // a wall laid flat to ask where its cap lies (drawMesh3GL reach): texels a side
const mesh3States = new WeakMap()   // canvas → { gl, progs: Map, buffers }
function mesh3State(cv) {
	if (mesh3States.has(cv)) return mesh3States.get(cv)
	// premultiplied compositing: translucent draws (the overflow shell, the slice pane)
	// must read at their own color over the page — a straight-alpha canvas displays
	// blended pixels at source×alpha (the white pane rendered 50% GRAY over paper)
	const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, stencil: true })
	if (!gl) { mesh3States.set(cv, null); return null }
	const geo = geometry(), vsf = visSurf(256), lsf = lightSurf(256)   // dense: the overflow silhouette is the mesh's own edge
	const buf = (data) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b }
	const ibuf = (data) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW); return b }
	const st = { gl, progs: new Map(), draws: new Map(),
		tb: buf(geo.tpos), ti: ibuf(geo.tidx), tn: geo.tidx.length, tvn: geo.tpos.length / 3,
		vb: buf(vsf.pos), vi: ibuf(vsf.idx), vn: vsf.idx.length, vvn: vsf.pos.length / 3,
		lb: buf(lsf.pos), li: ibuf(lsf.idx), ln: lsf.idx.length, lvn: lsf.pos.length / 3,
		cb: buf(geo.cpos), ci: ibuf(geo.cidx), cn: geo.cidx.length,
		pts: { srgb: geo.tpos, vis: vsf.pos, locus: lsf.pos }, idx: { srgb: geo.tidx, vis: vsf.idx, locus: lsf.idx }, src: {}, seams: {}, out: {}, fsBake: !!gl.getExtension('EXT_color_buffer_float') }
	// the conversion BAKE lands in st.out (v, rgb, bad a vertex – bakeRun: two float targets read into vertex buffers, or
	// without them a transform feedback buffer sized for the larger lattice); one slot – a space/gamut switch simply rebakes
	if (!st.fsBake) { st.out.buf = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, st.out.buf)
		gl.bufferData(gl.ARRAY_BUFFER, Math.max(st.tvn, st.vvn, st.lvn) * 28, gl.DYNAMIC_COPY) }
	st.bakeKey = null
	paneProgs(st)
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
in vec3 aSrc;   // the lattice point as the volume has it: a cube's code, 0–255 – its edges are read off it (surfFS crease_)
out vec3 vRgb;
out vec3 vN;
out vec2 vHueV;
out vec3 vF;
out vec3 vS;
out float vBad;
// A body in parts: a channel with a void in its range – values that name no color: DSH's dominant wavelength has none from
// its purples' −493 to the spectrum's 360 – splits it, a part to each band of values that do, and each is drawn in turn.
// A cell of the surface astride the void joins colors that ARE neighbours, on two parts: drawn as it stands it ran across
// the box (teeth along its edge), dropped it left each part a cell short of its end – a sawtooth gap before the wall there.
// The lattice has a point ON the void wherever a cell crossed it (seamLattice) – a point of both parts, read a hair to
// either side of the end. So each part is drawn in a chart of its own, the next part's values carried on past its end: as
// far past it as they lie from the end of their own that meets it (the spectrum's red end, 700, meets the purples at −493
// – by color, not by number: the page pairs them). A seam point then stands on the end whichever side it read, and a cell
// the seam did not reach (a fan round the volume's black, joining all its hues) is cut at the end (surfFS), not run across
// the box. A cell wholly of the next part is none of this one's (vOut: the chart folds the far half of the next part back
// over it). A point of no part – a gray has no wavelength, DSH reads it 0 – is no point of the body: its cells go undrawn,
// and the faces of each part's box close it there
uniform int uSplit;   // that channel; −1: a body in one piece
uniform vec4 uPart;   // the part drawn – its two ends – and the ends of the next that meet them
out float vOut;       // 1: a point of the next part
uniform int uPass;    // 2: a cap's count of the surface's sheets (drawMesh3GL)
void main() {
	vec3 v = aV;
	bool none = aBad > 0.5;
	vOut = 0.0;
	if (uSplit >= 0) {
		float x = v[uSplit], m = (uPart.y - uPart.x) * 1e-4, lo = min(uPart.z, uPart.w), hi = max(uPart.z, uPart.w);
		if (x < uPart.x - m || x > uPart.y + m) {
			if (x < lo - m || x > hi + m) none = true;
			else { vOut = 1.0; v[uSplit] = abs(x - uPart.z) < abs(x - uPart.w) ? uPart.x - abs(x - uPart.z) : uPart.y + abs(x - uPart.w); }
		}
	}
	vec3 n = map3_(v);
	vF = v;
	vS = aSrc;
	vRgb = aRgb;
	vBad = aBad;
	// vBad: 0 a point of the body · −1 one the space could not say, drawn where the bake sealed it · 1000 no point at all, thrown
	// off screen – so much that it outweighs its neighbours' −1 and its cells stay undrawn but for a hair along their far edge
	if (none || isnan(n.x) || isnan(n.y) || isnan(n.z)) { vBad = 1000.0; gl_Position = vec4(2e4, 2e4, 2e4, 1.0); vRgb = vec3(0.0); vN = vec3(0.0); vHueV = vec2(0.0); vF = vec3(0.0); vS = vec3(0.0); vOut = 0.0; return; }
	float h = uMap.y >= 0 ? raw_(v, uMap.y) * 6.283185307179586 : 0.0;
	vHueV = vec2(cos(h), sin(h));
	vN = n;
	gl_Position = view_(n, 0.0);
	// the count takes every sheet, however far: a volume sealed on its window's wall – light, in a display's own coordinates –
	// stands a box's breadth past the box, beyond the depth the frame is drawn in, and clipped there it was not counted (the
	// box's near face open). Its depth a quarter as deep, the wall's with it (vsCap): the order is the same
	if (uPass == 2) gl_Position.z *= 0.25;
}`


// ── the shape's outline, per pixel: a line is a band ON the surface – where a distance to it, counted in the pixel's own
// change of it (fwidth), runs out. It rides the body the GPU draws, meets its neighbour wherever two lines do, and ends
// where the body ends: no polyline to chord a curve, stop short of a corner or sink under the face it lies on. Each side
// of an edge draws its half – and where the surface ends at the edge, a silhouette, the half past it is drawn after the
// body (INK_FS); hidden (pass 4, depth-greater) the same bands show faint through the body.
const EDGE_GLSL = `
uniform ivec2 uWalls;   // the box's faces (bit = axis·2 + side): x those two of which meet in an edge of the shape, y those the body was cut at
uniform float uPx;      // device pixels to a CSS pixel
uniform vec4 uInk;      // the outline's ink, and its strength over the body – 0, a map that asks for none: nothing drawn
float band_(float px) { return 1.0 - smoothstep(0.5 * uPx - 0.5, 0.5 * uPx + 0.5, px); }   // half a CSS pixel a side
// v: the point in the space's coordinates; own: the face it lies on by construction (a cap's), else -1; cut: whether the
// surface here is the volume's own, to be cut – a cell round a point the space could not say is not
float walls_(vec3 v, int own, bool cut) {
	float e = 0.0, a1 = own >= 0 ? 0.0 : 1e9, a2 = 1e9;
	for (int k = 0; k < 3; k++) {
		if (k == uMap.y || k == own) continue;
		float sp = uMax[k] - uMin[k], w = fwidth(v[k]);
		if (!(w < sp * 0.2)) continue;   // a seam or a fold spikes the derivative: no line across it
		for (int sd = 0; sd < 2; sd++) {
			int bit = 1 << (k * 2 + sd);
			if (((uWalls.x | uWalls.y) & bit) == 0) continue;
			// pixels to the face – a point within a ten-thousandth of the span lies ON it (a clamped sheet, a cube in its own box)
			float a = max(abs(v[k] - (sd == 0 ? uMin[k] : uMax[k])) - sp * 1e-4, 0.0) / max(w, sp * 1e-6);
			if (cut && (uWalls.y & bit) != 0 && w > sp * 1e-6) e = max(e, band_(a));   // the cut: the surface crossing the face – a sheet lying along it is no line
			if ((uWalls.x & bit) == 0) continue;
			if (a < a1) { a2 = a1; a1 = a; } else if (a < a2) a2 = a;
		}
	}
	return max(e, band_(a2));   // the box's own edge: on one face, a line's breadth from the next
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
		const src = gam === 'vis' || gam === 'locus' ? 'xyz' : gam === 'srgb' ? 'rgb' : gam
		const SRC = san(src)
		const unit = src === 'rgb' || src === 'xyz' ? 'aSrc' : '(aSrc / 255.0)'
		const pairs = []
		if (s !== src) pairs.push([src, s])
		if (src !== 'rgb' && s !== 'rgb') pairs.push([src, 'rgb'])
		// the BAKE: the space conversion, singularity collapse, achromatic taper and
		// display knee run ONCE per (space, gamut) — captured per lattice vertex (bakeRun:
		// a fragment pass, or transform feedback); the DRAW program consumes the capture per frame
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
uniform vec3 uNeutK, uNeutW;   // the volume's black and its white in this space: where its grays lie
uniform int uSteps;   // its steps, 18 – a uniform, so the loop is never unrolled
out vec3 tV;
out vec3 tRgb;
out float tBad;
void main() {
	float seal = 0.0;   // 1: the point is none of the space's – moved onto the window's wall (below)
	${s === src ? `${VT[3]} v = ${unit};` : `// past the encodable cone the coords go non-finite (log of negative light) or
	// fold into finite garbage (a sign-mirrored transfer, HSI's S at optimal colors),
	// and a lone bad vertex shreds its triangles. "Bad" = outside the sanity window;
	// bisect toward the neutral spine until the vertex lands ON the window wall,
	// closing the surface along the intersection. NaN fails the comparisons too.
	// One conversion, in one loop: step 0 the vertex itself, then the bisection, then its last step inside (lo), then the
	// spine – a conversion called at four sites built four copies into the pipeline, and transform feedback's own vertex
	// variant, built at the first bake on the thread that composites the screen (Metal under ANGLE), stood it still twice
	// as long (CAM16: 0.45–0.51 s, 0.22 one site)
	vec3 blo = uWLo, bhi = uWHi, nw = ${src === 'xyz' ? 'vec3(aSrc.y * 0.9504559, aSrc.y, aSrc.y * 1.0890578)' : 'vec3((aSrc.r + aSrc.g + aSrc.b) / 3.0)'}, v = vec3(0.0);
	float lo = 0.0, hi = 1.0;
	for (int i = 0; i < uSteps + 3; i++) {
		float md = i == 0 ? 1.0 : i <= uSteps ? (lo + hi) * 0.5 : i == uSteps + 1 ? lo : 0.0;
		vec3 vt = ${SRC}_${S}(mix(nw, aSrc, md) ${src === 'rgb' || src === 'xyz' ? '' : '/ 255.0'});
		bool inw = vt.x > blo.x && vt.x < bhi.x && vt.y > blo.y && vt.y < bhi.y && vt.z > blo.z && vt.z < bhi.z;
		if (i == 0) { if (inw) { v = vt; break; } seal = 1.0; }
		else if (i <= uSteps) { if (inw) lo = md; else hi = md; }
		else { v = vt; if (inw) break; }
		// no point of the way was the space's: it lands on the spine itself, a gray – no radius, whatever the formula reads there
		if (i == uSteps + 2 && uMap.y >= 0 && uWb.x < 0) { v[uMap.z] = 0.0; if (isnan(v[uMap.y])) v[uMap.y] = 0.0; }
	}`}
	// a color indistinguishable from gray (sub-integer channel delta) – or too dark
	// to carry chroma at all (chroma ratios degenerate at black: OSA-UCS's C divides
	// by zero there) – has noise for chroma coordinates (okhsl S at near-white is
	// 0..103 at random). Taper the chroma coords toward the gray axis SMOOTHLY – a
	// hard cliff saws the surface where real chroma meets the collapsed row.
	// ONE law, two sources: the human solid's XYZ is divided by the white it integrates
	// to, which puts its gray axis at r=g=b – the cube's own units – so the same two
	// factors read it. (Judging its darkness by luminance alone crushed deep saturated
	// colours, all of which sit below Y=1, onto the axis: a flat skirt and a needle.)
	${gam === 'locus' ? `float gf = 1.0;   // light's body is drawn as the space has it, dark lights and all – a cone pinched toward black is a
	// needle under a flat skirt`
		: src === 'xyz'
		? `float t = clamp(aSrc.y / 7.0, 0.0, 1.0); float gf = t * t * (3.0 - 2.0 * t);`
		: `float mx = max(aSrc.r, max(aSrc.g, aSrc.b));
	float dlt = mx - min(aSrc.r, min(aSrc.g, aSrc.b));
	float gf = min(clamp(dlt / 2.5, 0.0, 1.0), clamp((mx - 2.0) / 6.0, 0.0, 1.0));`}
	// a box-in-base space must collapse all-or-nothing: partially tapered junk
	// (HPLuv's exploding near-white P) would land back INSIDE the box the clip
	// guards – while whole-shape solids need the smooth taper, or the cliff where
	// real chroma meets a collapsed row saws the surface into teeth
	if (uClip == 1 && gf < 1.0) { gf = 0.0; seal = 1.0; }   // …the cells round it a fan from the rim to the axis: no line of the volume's crosses them
	// Chroma goes to none; an opponent channel to where the volume's own gray has it – its white's near white, its black's
	// near black. Zero is that only where the space puts its grays there: Poirson–Wandell's white sits at O2 −5.3, O3 3.7,
	// ATD95's at T 0.049, and YyCxCz's lightness, −16…100, reads as an opponent channel – taken to zero, each white corner
	// was a spike down to the axis
	if (gf < 1.0) {
		vec3 nt = ${src === 'xyz' ? 'uNeutK' : 'mx > 127.5 ? uNeutW : uNeutK'};
		// (all of it gone, the radius is none whatever the formula read – not a number, at Cubehelix's white – and its hue any)
		if (uMap.y >= 0 && uWb.x < 0) { v[uMap.z] = gf > 0.0 ? v[uMap.z] * gf : 0.0; if (gf <= 0.0 && isnan(v[uMap.y])) v[uMap.y] = 0.0; }
		if (uBip.x >= 0) v[uBip.x] = mix(nt[uBip.x], v[uBip.x], gf);
		if (uBip.y >= 0) v[uBip.y] = mix(nt[uBip.y], v[uBip.y], gf);
	}
	${src === 'xyz' ? `// …and a human volume's color that is no different from gray – its white pole, its black – has no chroma to place: a
	// formula that divides by what is left of the lightness (Cubehelix's s, by l(1 − l)) reads noise there, −4.9 at white,
	// and the solid's top fanned out to it. By the white it integrates to its grays lie at r = g = b. A radius alone: an
	// opponent space has its white where it is
	if (uMap.y >= 0 && uWb.x < 0) {
		vec3 q = aSrc / vec3(95.04559, 100.0, 108.90578); float qx = max(q.x, max(q.y, q.z));
		float ga = qx > 1e-9 ? clamp((qx - min(q.x, min(q.y, q.z))) / qx / 0.01, 0.0, 1.0) : 0.0;
		if (ga < 1.0) { v[uMap.z] = ga > 0.0 ? v[uMap.z] * ga : 0.0; if (isnan(v[uMap.y])) v[uMap.y] = 0.0; }
	}` : ''}
	// hard backstop after the bisection: an appearance model's spectral cusp can diverge in
	// float32 faster than the 18-step bisection resolves. The window IS the sanity bound (for
	// the human solid it is the gamut's own measured extent), so clamp to it — sealed vertices
	// sit inside untouched; only a runaway cusp snaps to the wall, where the cap closes it.
	${src === 'xyz'
		? // the human solid HIDES NOTHING: flagging a divergent cusp "bad" moves it off-screen,
		  // and the triangle from its two good neighbours then stretches across the frustum — a
		  // thin blade into space (the fragments near the good end keep a sub-threshold vBad and
		  // still draw). Instead SEAL it: NaN → the window's own bound (near the gray axis), a
		  // finite in-solid vertex, so the surface closes and no vertex is ever off-screen.
		  `vec3 vc = clamp(v, uWLo, uWHi);
	if (isnan(vc.x)) vc.x = uWLo.x; if (isnan(vc.y)) vc.y = uWLo.y; if (isnan(vc.z)) vc.z = uWLo.z;
	tV = vc; tBad = -seal;`
		: `tBad = (isnan(v.x) || isnan(v.y) || isnan(v.z)) ? 1.0 : -seal;   // −1: sealed – drawn, but no edge of the volume runs through it (crease_)
	tV = ${s !== src ? 'clamp(v, uWLo, uWHi)' : 'v'};`}
	${src === 'rgb' ? 'tRgb = aSrc / 255.0;' : `// an out-of-sRGB vertex desaturates toward its own luma until representable — the
	// closest ACTUAL color, hue and lightness held (vs the flat channel-clamp that
	// painted hyper-greens as one solid green). The caps seal with this SAME knee.
	tRgb = softDisp(${SRC}_rgb(${unit}));`}
	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}`
		const nativeQ=s==='rgb'?'clamp(qv / 255.0, 0.0, 1.0)':`softDisp(${S}_rgb(qv))`
		// cls (drawCls): 0 smooth, 1 a palette/JND/web lens's cells, 2 native 10/20 cells – only the last holds the space's code
		const surfFS = cls => { const sp = [...(cls === 1 ? [['rgb', 'oklab'], ['oklab', 'rgb'], ['rgb', 'lab']] : []), ...(cls === 2 && s !== 'rgb' ? [[s, 'rgb']] : [])]
			return `#version 300 es
precision highp float;
precision highp int;
${sp.length ? glsl(sp) : ''}
${SOFT_DISP}
${cls === 1 ? quant3GLSL() : ''}
in vec3 vRgb; in vec3 vN; in vec2 vHueV; in vec3 vF; in vec3 vS; in float vBad; in float vOut;
uniform vec3 uMin, uMax;     // the space's declared range: the box's faces
uniform vec3 uCMin, uCMax;
uniform vec3 uDMin, uDMax;   // the DECLARED box – where the slice outline is drawn
uniform int uOut;            // 1 → the solid pierces the declared box
uniform int uClip;           // 1 → box-in-base space: shave past-the-box noise
uniform int uPass;           // 0 = the body, cut at the box · 2 = all of it, for a cap's count · 3 = the hidden cut curve · 4 = the hidden outline · 5 = ink and depth
uniform int uCrease;           // the volume's own edges: 1 a cube's twelve · 3 none down the needle its dark taper leaves near black
uniform ivec4 uMap;
uniform int uHasHue;
uniform int uQuant;          // 0 smooth · 10/20 native-channel cells · 101/102/103 safe/name/even
uniform int uGrid;           // optional native-coordinate contours, independent of tessellation
uniform ivec2 uBip;   // bipolar (opponent) chroma channels, else (-1,-1) – marks a lightness-axis space
uniform ivec2 uCut;   // the hovered plane's HELD axis (x, -1 = none) and whether it wraps (y)
uniform vec2 uCutV;   // that axis's held value (x) and full span (y)
uniform int uSplit;   // a body in parts: the channel it is split along, and the part drawn (DRAW_VS)
uniform vec4 uPart;
${EDGE_GLSL}
// the volume's own edges: a cube's face meets the next where a second coordinate of its source runs out
float crease_() {
	if ((uCrease & 1) == 0) return 0.0;
	vec3 q = min(vS, 255.0 - vS);
	float d = q.x + q.y + q.z - min(q.x, min(q.y, q.z)) - max(q.x, max(q.y, q.z)), w = fwidth(d);   // the middle one: the least is the face's own, 0
	float e = w < 48.0 ? band_(d / max(w, 1e-6)) : 0.0;   // a face shrunk to a few pixels (a pole's fan) is all edge: none there
	return (uCrease & 2) != 0 ? e * clamp((max(vS.r, max(vS.g, vS.b)) - 2.0) / 6.0, 0.0, 1.0) : e;
}
out vec4 O;
void main() {
	if (vBad > 0.001) discard;
	// a body in parts: the part drawn ends where its values do, the surface's cells carried on past it cut there (DRAW_VS).
	// And its foot is the floor's, not the surface's – the last thousandth over the tone's floor, where the face is read
	// (vsCap: its step): at black every address is one color, and the volume's cells round its black corner join hues the
	// space sets a box apart – sheets of black across the floor, past the body's own walls
	if (uSplit >= 0) {
		float m = (uPart.y - uPart.x) * 1e-3;   // (a point on the seam reads a hair to either side of the end: a thousandth of the part past it is still its own)
		if (vOut > 0.999 || vF[uSplit] < uPart.x - m || vF[uSplit] > uPart.y + m) discard;
		if (uMap.x >= 0 && vF[uMap.x] < uCMin[uMap.x] + (uCMax[uMap.x] - uCMin[uMap.x]) * 1e-3) discard;
	}
	// the outline: the volume's own edges, its cut at each face it was trimmed at, the box's edges the body lies along.
	// Neither edge nor cut through a point the space could not say (the bake's vBad −1: sealed onto the window's wall, or
	// a clip space's gray collapsed onto its axis) – the cells round it are slivers and fans, a line across them a scribble
	// (Cineon's floor under P3's green) or a spoke over a lid (HSL's); the cap that closes the wall there draws its own
	bool own = vBad > -0.001;
	float eg = vBad > 1e-5 ? 0.0 : max(own ? crease_() : 0.0, walls_(vF, -1, own));   // no line on the hair a thrown point leaves
	// ONLY a box-in-base space clips, at its declared box (tiny ε): past it lies
	// solver wobble (okhsv S at the blue cusp) and the duplicate shell (HPLuv's
	// beyond-safe continuum) – never real shape; the cut wall is closed by the caps.
	// The position bound (spike guard) likewise applies only where clipping does.
	if (uClip == 1) {
		for (int k = 0; k < 3; k++) {
			if (k == uMap.y) continue;
			// …to the wall itself where a cap seals it (uWalls.y): the cap sits ON the wall, and the body's wobble a hair past
			// it fought the cap for the pixel – HPLuv's wall, scribbled at the hues where its gamut touches P 100
			float sp = (uCMax[k] - uCMin[k]) * 0.004, lo = (uWalls.y >> (k * 2) & 1) != 0 ? 0.0 : sp, hi = (uWalls.y >> (k * 2 + 1) & 1) != 0 ? 0.0 : sp;
			if (vF[k] < uCMin[k] - lo || vF[k] > uCMax[k] + hi) discard;
		}
		if (any(greaterThan(abs(vN), vec3(0.72)))) discard;
	}
	// hue chords: near the gray corners a cell fans across far-apart hues and
	// strings through the solid – where the interpolated hue vector disagrees
	// with the position's own angle, the fragment is off-surface: drop it
	if (uHasHue == 1) {
		float r = length(vN.yz);
		float sat = max(vRgb.r, max(vRgb.g, vRgb.b)) - min(vRgb.r, min(vRgb.g, vRgb.b));
		// achromatic fragments never chord visibly – and at the white/black corners the
		// degenerate fan (hue is float noise there) must render, or the lid opens
		if (r > 0.1 && sat > 0.15) {
			float lh = length(vHueV);
			if (lh < 0.45 || dot(vHueV / lh, normalize(vN.yz)) < 0.5) discard;
		}
	}
	// pass 2 – every sheet of the surface, cut nowhere: a human volume's caps count them in front of each wall (drawMesh3GL)
	if (uPass == 2) { O = vec4(1.0); return; }
	// beyond the DECLARED box the body is CUT: a wider volume in a narrower space's
	// coordinates is trimmed to its box – or its cylinder, the hue axis skipped – and
	// the caps seal the cut (a dissolving shell past the walls read as a cloud, no shape)
	float ob = -1.0;
	if (uOut == 1) for (int k = 0; k < 3; k++) {
		if (k == uMap.y) continue;
		float sp = uDMax[k] - uDMin[k];
		ob = max(ob, max(uDMin[k] - vF[k], vF[k] - uDMax[k]) / sp);
	}
	O = vec4(vRgb, 1.0);
	// The same lens as the bars and planes reaches the solid. Palette lenses posterize
	// sRGB output; 10/20 quantize the interpolated NATIVE coordinate and color the
	// whole cell by its center – filled sections, without changing the gamut geometry.
	${cls === 1 ? 'O.rgb = quant3_(vRgb, uQuant);' : ''}
	${cls === 2 ? `{
		vec3 span = max(uDMax - uDMin, vec3(1e-9));
		vec3 f = clamp((vF - uDMin) / span, 0.0, 0.999999);
		vec3 qv = uDMin + (floor(f * float(uQuant)) + 0.5) / float(uQuant) * span;
		O.rgb = ${nativeQ};
	}` : ''}
	if (uGrid == 1) {
		vec3 f = (vF - uDMin) / max(uDMax - uDMin, vec3(1e-9)) * 10.0;
		vec3 width = fwidth(f);
		vec3 line = abs(fract(f + 0.5) - 0.5) / max(width, vec3(1e-5));
		// A constant coordinate (a cube face) is not a contour covering that face.
		for (int k = 0; k < 3; k++) if (width[k] < 1e-5) line[k] = 1e5;
		float ink = 1.0 - smoothstep(0.3, 0.9, min(line.x, min(line.y, line.z)));
		O.rgb *= 1.0 - ink * 0.55;
	}
	// the tone is clipped HARD to its range: below the floor lies OSA-UCS's chroma pole and its
	// sign-flipped coords, above lies nothing. Only genuine CHROMA overflow haloes past the box;
	// the cap seals the floor. (No outline crease – it read misplaced and off-colour.)
	// clip below the tone floor only, and ONLY for spaces with a real lightness axis (polar/opponent
	// – a hue or bipolar-chroma channel present): the dark/pole side. Additive spaces (ch0 = Red, not
	// a tone) and a high ceiling for HDR/scene spaces are left alone.
	if (uOut == 1 && (uMap.y >= 0 || uBip.x >= 0) && vF[uMap.x] < uDMin[uMap.x]) discard;
	if (ob > 0.0) discard;
	// pass 5: this pixel's ink and its depth, for the outline's outer half (INK_FS)
	if (uPass == 5) { float d = gl_FragCoord.z * 255.0; O = vec4(eg, floor(d) / 255.0, fract(d), 1.0); return; }
	// the plane∩solid CURVE, as a per-pixel test on the shape itself: a fragment lies on
	// the cut when its held coordinate equals the plane's. fwidth sets the band's width in
	// SCREEN pixels, so the outline rides the real tessellated edge – exactly, everywhere,
	// with none of a marching polyline's coarse chords or dropped segments.
	bool onCut = false;
	if (uCut.x >= 0) {
		float c = vF[uCut.x], w = fwidth(c), d = c - uCutV.x;
		if (uCut.y == 1) d = mod(d + uCutV.y * 1.5, uCutV.y) - uCutV.y * 0.5;   // a hue axis wraps
		// a seam or fold spikes the derivative – banding there would smear across the solid
		onCut = w < uCutV.y * 0.2 && abs(d) < w * 1.1;
	}
	// pass 3 paints the curve ALONE, drawn depth-GREATER so it lands exactly where the body
	// hides it: the far arc still reads, at half weight, the way a hidden line should
	if (uPass == 3) { if (!onCut) discard; O = vec4(1.0, 1.0, 1.0, 0.38); return; }
	// pass 4, the outline the body stands in front of: the same bands drawn depth-GREATER, faint – as a pane's frame goes
	if (uPass == 4) { if (eg * uInk.a < 0.002) discard; O = vec4(uInk.rgb, eg * uInk.a * 0.3); return; }
	O.rgb = mix(O.rgb, uInk.rgb, eg * uInk.a);
	if (onCut) O = vec4(1.0, 1.0, 1.0, O.a);
}` }
		// caps: the space's own range-box faces. Display gamuts keep them only where
		// the coords are in-gamut AND canonical (roundtrip), tested per PIXEL; the
		// human volumes instead count the body's own sheets in front of each wall (the uPass-2 mask)
		const vsCap = `#version 300 es
precision highp float;
precision highp int;
${MAP_GLSL}
in vec3 aFrac;
uniform ivec2 uCapK;    // this cap's face (axis, side)
// How far inside its wall a cap reads its colors, of the box's breadth. A trim on the wall itself: 0. A clip space's lid a
// step under the degenerate zone, 0.012 – HPLuv's P has no value at L 100. A face of a body in parts a thousandth: ON a
// face where the space folds every address into one color – DSH's floor, black at any wavelength and purity – all of it
// reads as a color of the volume, a black sheet as wide as the box; just inside it, the colors that do reach it
uniform float uStep;
uniform int uPass;      // 2: the wall's own depth, for a human volume's count – on the wall itself, no hair nearer the eye · 6: the wall laid flat, whole (capReach)
uniform vec3 uBoxLo, uBoxHi;   // the part of its wall this cap is drawn over, of the box's breadth: 0 and 1, all of it (capReach)
out vec3 vV;
void main() {
	vec3 f = uBoxLo + aFrac * (uBoxHi - uBoxLo);
	f[uCapK.x] = uCapK.y == 1 ? 1.0 - uStep : uStep;
	vec3 v = uCMin + f * (uCMax - uCMin);
	vV = v;
	// …and every cap SITS on its wall: drawn a step inside it, the body's last sliver stood over the lid – a second rim
	v[uCapK.x] = uCapK.y == 1 ? uCMax[uCapK.x] : uCMin[uCapK.x];
	gl_Position = view_(map3_(v), uPass == 2 ? 0.0 : 0.002);
	if (uPass == 2) gl_Position.z *= 0.25;   // the count's depth (DRAW_VS)
	if (uPass == 6) gl_Position = vec4(aFrac[uCapK.x == 0 ? 1 : 0] * 2.0 - 1.0, aFrac[uCapK.x == 2 ? 1 : 2] * 2.0 - 1.0, 0.0, 1.0);   // its two free axes, the target's own
}`
		// A human volume's caps carry NO validity of their own: a mask (drawMesh3GL) holds, per pixel, whether the wall there
		// lies inside the solid – an odd number of the body's own sheets in front of it. The cross-section then follows the
		// lattice that is drawn, its taper and its chords with it; a test of the color at the pixel (its chromaticity inside
		// the locus, its reach inside the solid, its coordinates round-tripped) answered for another body – the true one:
		// specks and gaps wherever the drawn one chords a crease (HSI's hue sectors), and no cap where a space's inverse is
		// not its forward's (Cubehelix). The quad only colors
		const fsCapVis = (gam === 'vis' || gam === 'locus') && s !== src && `#version 300 es
precision highp float;
precision highp int;
${glsl([[s, 'rgb']])}
${SOFT_DISP}
${MAP_GLSL}
in vec3 vV;
uniform int uHatch;   // 1: this cap is a trim – a wider volume cut at the box: soft white hatching marks it
uniform int uPass;    // 2: its depth alone, the wall the count is taken at · 4: its outline alone, where the body hides it · 5: its ink and depth (INK_FS)
uniform ivec2 uCapK;  // this cap's face (axis, side)
uniform sampler2D uMask;   // …and whether the wall is inside the solid here: this face's channel of the mask
uniform int uMaskCh;
${EDGE_GLSL}
out vec4 O;
void main() {
	if (uPass == 2) { O = vec4(0.0); return; }
	if (texelFetch(uMask, ivec2(gl_FragCoord.xy), 0)[uMaskCh] < 0.5) discard;
	vec3 disp = ${S}_rgb(vV);
	if (isnan(disp.x) || isnan(disp.y) || isnan(disp.z)) discard;
	// its outline: the box's own edges, where the next face meets it – its edge against the body or the air is no line it
	// can measure (the mask decides it): INK_FS draws that from what lies beside it
	float eg = walls_(vV, uCapK.x, true);
	if (uPass == 5) { float d = gl_FragCoord.z * 255.0; O = vec4(eg, floor(d) / 255.0, fract(d), 0.5); return; }
	if (uPass == 4) { if (eg * uInk.a < 0.002) discard; O = vec4(uInk.rgb, eg * uInk.a * 0.3); return; }
	O = vec4(softDisp(disp), 1.0);
	// the hatch lies IN the cut's own plane: its two free coordinates summed – a box face's diagonals, a cylinder's helix –
	// a CSS pixel wide however the face is turned
	if (uHatch == 1) {
		float g = 0.0;
		// 28 stripes to the box's side; the hue's turn, round a cylinder 0.55 in radius to its unit height, 2π·0.55 sides long:
		// 97 – a whole number, so the helix closes
		for (int j = 0; j < 3; j++) if (j != uCapK.x) g += (vV[j] - uCMin[j]) / max(uCMax[j] - uCMin[j], 1e-9) * (j == uMap.y ? 97.0 : 28.0);
		if (abs(fract(g + 0.5) - 0.5) < fwidth(g) * 0.5 * uPx) O.rgb = mix(O.rgb, vec3(1.0), 0.3);
	}
	O.rgb = mix(O.rgb, uInk.rgb, eg * uInk.a);
}`
		// …but a body in parts – a void in one of its channels between them (DSH: its wavelengths) – is no closed surface whose
		// sheets could be counted: its grays stand a wall (every wavelength at no purity), each part's sides are no image of
		// the volume's surface. Each part's faces are its own box's, and a face is the body's where the color there is a real
		// one inside the volume whose coordinates are these – a display volume's own test (fsCap), by the pixel
		const fsCapOpen = (gam === 'vis' || gam === 'locus') && s !== src && `#version 300 es
precision highp float;
precision highp int;
${glsl([[s, 'rgb'], [s, 'xyz'], ['xyz', s]])}
${locusGLSL()}
${gam === 'vis' ? VREACH_GLSL : ''}
${faithful ? sameGLSL(S, 'vec3') : ''}
${SOFT_DISP}
${MAP_GLSL}
in vec3 vV;
uniform int uDim;   // 3: the round trip's loop bound (sameGLSL)
uniform int uPass;    // 4: its outline alone, where the body hides it · 5: its ink and depth (INK_FS)
uniform ivec2 uCapK;  // this cap's face (axis, side)
${EDGE_GLSL}
out vec4 O;
void main() {
	vec3 xc = ${S}_xyz(vV); float sm = xc.x + xc.y + xc.z;
	if (!visXYZ(xc)) discard;   // a real color: black, or a chromaticity inside the locus (NaN fails too)
	${gam === 'locus' ? 'if (xc.y > 100.05) discard;' : 'if (sm > 1e-6 && sm > visReach_(xc.xy / sm) * 1.002) discard;'}   // (a five-hundredth of a percent past the table left ten pixels of the inside along one seam, a fifth of a percent one)
	vec3 disp = ${S}_rgb(vV);
	if (isnan(disp.x) || isnan(disp.y) || isnan(disp.z)) discard;
	${faithful ? `vec3 back = xyz_${S}(xc);
	for (int k = 0; k < uDim; k++) {
		float d = abs(back[k] - vV[k]);
		if (uMap.y == k) d = min(d, 360.0 - d);
		if (!(d <= (uMax[k] - uMin[k]) * 0.03)) { vec3 w = vV; w[k] = back[k]; if (!same_(xc, w)) discard; }   // NaN fails too; a channel with no say there (a wavelength at no purity) stays
	}` : ''}
	float eg = walls_(vV, uCapK.x, true);
	if (uPass == 5) { float d = gl_FragCoord.z * 255.0; O = vec4(eg, floor(d) / 255.0, fract(d), 0.5); return; }
	if (uPass == 4) { if (eg * uInk.a < 0.002) discard; O = vec4(uInk.rgb, eg * uInk.a * 0.3); return; }
	O = vec4(softDisp(disp), 1.0);
	O.rgb = mix(O.rgb, uInk.rgb, eg * uInk.a);
}`
		const glin = { srgb: 'lrgb', p3: 'p3-linear', rec2020: 'rec2020-linear' }[gam]
		const GLIN = glin && san(glin), G0 = san(gam === 'srgb' ? 'rgb' : gam)
		const capPairs = glin && [[s, 'rgb'], [s, 'xyz'], ['xyz', glin], [s, gam === 'srgb' ? 'rgb' : gam]]
		if (glin) capPairs.push([gam === 'srgb' ? 'rgb' : gam, s])
		const fsCap = fsCapVis || glin && `#version 300 es
precision highp float;
precision highp int;
${glsl(capPairs)}
${faithful ? sameGLSL(S, 'vec3') : ''}
${SOFT_DISP}
${MAP_GLSL}
in vec3 vV;
uniform int uDim;   // 3: the round trip's loop bound (sameGLSL)
uniform int uHatch;   // 1: this cap is a trim – a wider volume cut at the box: soft white hatching marks it
uniform float uRt;    // …held to the body by this much of the model's unit: the space's own round-trip precision
uniform int uPass;    // 4: its outline alone, where the body hides it · 5: its ink and depth (INK_FS)
uniform ivec2 uCapK;  // this cap's face (axis, side)
${EDGE_GLSL}
out vec4 O;
void main() {
	vec3 xc = ${S}_xyz(vV), lin = xyz_${GLIN}(xc);
	// pad in ENCODED units – a linear pad is several code values wide at black. None for a trim: it ends where the body
	// does, at the volume's wall itself – half a code past it is 2% of the box where a 2.2 gamma leaves zero, a flag
	// standing over the body's edge (NTSC RGB's red corner under P3)
	vec3 enc = mix(lin * 12.92, 1.055 * pow(max(lin, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
	float pad = uHatch == 1 ? 0.0 : 0.002;
	if (!(enc.x >= -pad && enc.x <= 1.0 + pad && enc.y >= -pad && enc.y <= 1.0 + pad && enc.z >= -pad && enc.z <= 1.0 + pad)) discard;
	vec3 disp = ${S}_rgb(vV);
	if (isnan(disp.x) || isnan(disp.y) || isnan(disp.z)) discard;
	${s === 'munsell' ? 'if (vV.z > munsell_maxc_(vV.x, vV.y) + 0.0001) discard;' : ''}
	vec3 gv = ${gam === 'srgb' ? 'clamp(disp, 0.0, 255.0)' : `clamp(${S}_${G0}(vV), 0.0, 1.0)`};
	vec3 back = ${G0}_${S}(gv);
	// A trim is the body's own cross-section: the body's coordinates of this color must land at this very place. An address
	// the space only READS as that color is none of the body's – Nayatani's chroma wall under L 12, where any chroma decodes
	// to the gray (a dark ring round its floor), a code under a log curve's black. By place, not by channel: a hue at no
	// chroma is the same point. To the space's own round-trip precision (uRt, measured by the page)
	if (uHatch == 1) { if (!(distance(map3_(back), map3_(vV)) <= uRt)) discard; }   // NaN fails too
	${faithful ? `else for (int k = 0; k < uDim; k++) {
		float d = abs(back[k] - vV[k]);
		if (uMap.y == k) d = min(d, 360.0 - d);
		if (!(d <= (uMax[k] - uMin[k]) * 0.03)) { vec3 w = vV; w[k] = back[k]; if (!same_(xc, w)) discard; }   // NaN fails too; a pole stays (sameGLSL)
	}` : `// a space's own lid: the canonical-roundtrip discard omitted where its inverse is approximate
	// (see rtFaithful) – the law would speckle-discard real cap fragments`}
	if (uPass == 6) { O = vec4(1.0); return; }   // the cap has a color here: all capReach asks
	// its outline: where the cut runs out at the volume's own surface – the least of the gamut's coordinates, 0 at its
	// wall – and where the box's next face meets it
	float gm = min(min(enc.x, min(enc.y, enc.z)), 1.0 - max(enc.x, max(enc.y, enc.z))) + pad, gw = fwidth(gm);
	// …crossed, not grazed: where the cut lies along the volume's own face (a log curve's floor, a channel at 0 across it)
	// or only touches it (HPLuv's pastel wall, tangent to the gamut at six hues) that coordinate stands still while the
	// others run on – no line there, where its noise drew a scribble
	vec3 ew = fwidth(enc);
	float eg = max(gw > 0.01 * max(ew.x, max(ew.y, ew.z)) ? band_(gm / gw) : 0.0, walls_(vV, uCapK.x, true));
	if (uPass == 5) { float d = gl_FragCoord.z * 255.0; O = vec4(eg, floor(d) / 255.0, fract(d), 0.5); return; }
	if (uPass == 4) { if (eg * uInk.a < 0.002) discard; O = vec4(uInk.rgb, eg * uInk.a * 0.3); return; }
	O = vec4(softDisp(disp), 1.0);
	// the hatch lies IN the cut's own plane: its two free coordinates summed – a box face's diagonals, a cylinder's helix –
	// a CSS pixel wide however the face is turned
	if (uHatch == 1) {
		float g = 0.0;
		// 28 stripes to the box's side; the hue's turn, round a cylinder 0.55 in radius to its unit height, 2π·0.55 sides long:
		// 97 – a whole number, so the helix closes
		for (int j = 0; j < 3; j++) if (j != uCapK.x) g += (vV[j] - uCMin[j]) / max(uCMax[j] - uCMin[j], 1e-9) * (j == uMap.y ? 97.0 : 28.0);
		if (abs(fract(g + 0.5) - 0.5) < fwidth(g) * 0.5 * uPx) O.rgb = mix(O.rgb, vec3(1.0), 0.3);
	}
	O.rgb = mix(O.rgb, uInk.rgb, eg * uInk.a);
}`
		const U = ['uMin', 'uMax', 'uCMin', 'uCMax', 'uDMin', 'uDMax', 'uWLo', 'uWHi', 'uSteps', 'uDim', 'uSrc', 'uN', 'uW', 'uOut', 'uClip', 'uPass', 'uMap', 'uWb', 'uBip', 'uCapK', 'uCut', 'uCutV', 'uRot', 'uScale', 'uHasHue', 'uQuant', 'uGrid', 'uMetric', 'uPalIdx', 'uPalSites', 'uHatch', 'uPx', 'uCrease', 'uWalls', 'uInk', 'uNeutK', 'uNeutW', 'uRt', 'uMask', 'uMaskCh', 'uSplit', 'uPart', 'uStep', 'uBoxLo', 'uBoxHi']
		const uset = (o) => { o.u = Object.fromEntries(U.map(n => [n, gl.getUniformLocation(o.pr, n)])) }
		const bake = st.fsBake ? build(gl, FSQ_VS, bakeFrag(vs), uset, null, { kind: 'mesh', space: s, fs: true })   // a fragment pass (bakeRun)
			: build(gl, vs, '#version 300 es\nprecision highp float;\nvoid main() {}', (o) => {
				o.aSrc = gl.getAttribLocation(o.pr, 'aSrc'); uset(o)
			}, (pr) => gl.transformFeedbackVaryings(pr, ['tV', 'tRgb', 'tBad'], gl.INTERLEAVED_ATTRIBS), { kind: 'mesh', space: s })
		bake.lutN = lutNames(vs)
		// The draw program colours the solid by its vertices' RGB: smooth, or in a palette/JND/web lens's cells, it holds no
		// space's code – one program for every space and gamut, its pipeline built once (Metal under ANGLE builds it whole at
		// the first draw, on the thread that composites the screen: 0.14 s at every new space). Native 10/20 cells colour each
		// section by its coordinate center – they need this space's own inverse, a program of its own
		const draw = cls => { const k = cls === 2 ? s : `·${cls}`
			if (!st.draws.has(k)) { const fs = surfFS(cls), o = build(gl, DRAW_VS, fs, (o) => {
					o.aV = gl.getAttribLocation(o.pr, 'aV'); o.aRgb = gl.getAttribLocation(o.pr, 'aRgb'); o.aBad = gl.getAttribLocation(o.pr, 'aBad'); o.aSrc = gl.getAttribLocation(o.pr, 'aSrc')
					uset(o)
				}, null, { kind: 'mesh', space: cls === 2 ? s : undefined })
				// Native 10/20 coloring runs space→RGB in the DRAW fragment shader. Measured
				// spaces therefore need their LUT here too; without it Munsell sections read
				// the default unit-0 texture and the whole quantized solid rendered black.
				o.lutN = lutNames(fs); st.draws.set(k, o) }
			return st.draws.get(k) }
		draw(0)
		const caps = !fsCap || s === src ? null : build(gl, vsCap, fsCap, (o) => {
			o.aFrac = gl.getAttribLocation(o.pr, 'aFrac'); uset(o)
		}, null, { kind: 'mesh', space: s })
		if (caps) caps.lutN = lutNames(fsCap)
		// the open body's, built when one is drawn (DSH under a human volume): no other space pays its link
		let open = null
		const capsOpen = () => open ??= fsCapOpen ? Object.assign(build(gl, vsCap, fsCapOpen, (o) => { o.aFrac = gl.getAttribLocation(o.pr, 'aFrac'); uset(o) }, null, { kind: 'mesh', space: s }), { lutN: lutNames(fsCapOpen) }) : null
		out = { bake, caps, draw, capsOpen }
	} catch(e) { console.warn(`color-space/gl solid ${s}:`,e.message); out = null }
	st.progs.set(key, out)
	return out
}

/**
 * Draw the sRGB solid of space `s` on the GPU (false → JS fallback / pending;
 * a pending program repaints via the setGLReady callback once linked).
 * map = { min:[3], max:[3], ti, ai, mi, wI, bI } – the same axes the JS map3 uses.
 */
/** Compile a space's 3-D programs ahead of need (hover, neighbours) – the modal
 *  then opens straight into the full-quality solid instead of a preview. */
export function warmMesh3(s, gam = 'srgb') {
	if (!has3dGL(s)) return
	const st = mesh3State(mesh3Canvas())
	if (st) mesh3Progs(st, s, gam)
}

// the hovered slice plane, drawn as GEOMETRY in the same scene: the depth buffer
// resolves the intersection with the body per pixel – hidden inside and behind it,
// visible in front and beyond – the classic way. Vertices arrive in model space.
const SHEET_VS = `#version 300 es
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
}`
// the pane's frame ribbons arrive ALREADY in clip space (the hud extrudes them to
// screen-true widths); here they only meet the depth buffer – full in the open,
// ghosted where the body is IN FRONT. The stencil dedups the joins' overlaps so
// translucent strokes never bead.
const FRAME_VS = `#version 300 es
precision highp float;
in vec3 aPos;
void main() { gl_Position = vec4(aPos, 1.0); }`
const TINT_FS = `#version 300 es
precision highp float;
uniform vec4 uTint;
out vec4 O;
void main() { O = uTint; }`
// both link with the solid's context, in the background like every program: made at a plane's first hover, their
// compile and link were waited out there (a status read each), up to 60 ms of the pointer's move
// The outline's other half. A band is drawn ON the surface, so where the surface ends at the line only the half inside
// shows – a silhouette half as heavy as an edge between two faces in view – and a cap cannot measure its own edge at
// all where a mask decides it. So the body and its caps are drawn once more into a texture, each pixel
// its ink, its depth and its kind (uPass 5), and each pixel takes there what its neighbours owe it, as far as the line's
// half reaches: the body's ink over what it stands in front of and over the cap it meets; a cap's edge on both its sides,
// where what lies beside it is nothing or lies behind. The line a pixel wide wherever it runs.
const INK_VS = `#version 300 es
void main() { gl_Position = vec4(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0, 0.0, 1.0); }`
const INK_FS = `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2D uTex;   // r the ink a pixel carries · g, b its depth · a its kind: 1 the body, 0.5 a cap, 0 nothing
uniform vec4 uInk;
uniform float uR;               // the half line, device px
out vec4 O;
ivec2 p, hi;
vec4 at_(ivec2 d) { return texelFetch(uTex, clamp(p + d, ivec2(0), hi), 0); }
float z_(vec4 c) { return c.a > 0.25 ? c.g + c.b / 255.0 : 2.0; }
// how much this pixel's own surface falls a pixel along d: the lesser of its two steps – the greater may be the edge itself
float fall_(float z, ivec2 d) { float a = z_(at_(d)), b = z_(at_(-d)); return a > 1.5 || b > 1.5 ? 0.0 : min(abs(a - z), abs(z - b)); }
void main() {
	p = ivec2(gl_FragCoord.xy); hi = textureSize(uTex, 0) - 1;
	vec4 c = at_(ivec2(0));
	float z = z_(c), k = 0.0, gz = z > 1.5 ? 0.0 : max(fall_(z, ivec2(1, 0)), fall_(z, ivec2(0, 1)));
	bool cap = c.a > 0.25 && c.a < 0.75;
	int R = int(uR + 0.999);
	for (int j = -R; j <= R; j++) for (int i = -R; i <= R; i++) {
		vec4 n = at_(ivec2(i, j));
		// apart by more than this pixel's own surface falls on the way there: an edge runs between the two
		float zn = z_(n), w = clamp(uR + 1.0 - length(vec2(i, j)), 0.0, 1.0), by = 0.002 + 1.5 * gz * float(abs(i) + abs(j));
		if (n.a > 0.75) { if (zn < z - by || cap && zn < z + by) k = max(k, n.r / min(uR, 1.0) * w); }   // the body's line: over what it stands in front of, and over the cap it meets
		else if (n.a > 0.25 && zn < z - by) k = max(k, w);   // a cap's edge, the half outside it
		if (cap && zn > z + by) k = max(k, w);               // …and the half on it
	}
	k = min(k, 1.0) - c.r;
	if (k < 0.004) discard;
	O = vec4(uInk.rgb, k * uInk.a);
}`
function inkTarget(st, w, h) {
	const gl = st.gl, k = st.ink ??= { fbo: gl.createFramebuffer(), tex: gl.createTexture(), rb: gl.createRenderbuffer() }
	if (k.w === w && k.h === h) return k
	k.w = w; k.h = h
	gl.bindTexture(gl.TEXTURE_2D, k.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
	gl.bindTexture(gl.TEXTURE_2D, null)   // not left on the unit it was made on (maskTarget)
	gl.bindRenderbuffer(gl.RENDERBUFFER, k.rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h)
	gl.bindFramebuffer(gl.FRAMEBUFFER, k.fbo)
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, k.tex, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, k.rb)
	gl.bindFramebuffer(gl.FRAMEBUFFER, null)
	return k
}
// …and the human volumes' cap masks: a channel a count (two textures: a box's six faces, a curved one's two sides), with a depth of their own
const MASK_UNIT = 4
function maskTarget(st, w, h) {
	const gl = st.gl, k = st.mask ??= { fbo: gl.createFramebuffer(), tex: [gl.createTexture(), gl.createTexture()], rb: gl.createRenderbuffer() }
	if (k.w === w && k.h === h) return k
	k.w = w; k.h = h
	for (const t of k.tex) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST) }
	gl.bindTexture(gl.TEXTURE_2D, null)   // not left on the unit it was made on: the count draws INTO it, and a sampler still at that unit would read it
	gl.bindRenderbuffer(gl.RENDERBUFFER, k.rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h)
	gl.bindFramebuffer(gl.FRAMEBUFFER, k.fbo); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, k.rb)
	gl.bindFramebuffer(gl.FRAMEBUFFER, null)
	return k
}
const paneProgs = (st) => {
	const gl = st.gl, locs = (o, us) => { o.aPos = gl.getAttribLocation(o.pr, 'aPos'); for (const n of us) o[n] = gl.getUniformLocation(o.pr, n); o.buf = gl.createBuffer() }
	st.sheetP = build(gl, SHEET_VS, TINT_FS, o => locs(o, ['uRot', 'uScale', 'uTint']), null, { kind: 'mesh' })
	st.frameP = build(gl, FRAME_VS, TINT_FS, o => locs(o, ['uTint']), null, { kind: 'mesh' })
	st.inkP = build(gl, INK_VS, INK_FS, o => { for (const n of ['uTex', 'uInk', 'uR']) o[n] = gl.getUniformLocation(o.pr, n) }, null, { kind: 'mesh' })
}

// ── the image inside the solid: its samples as a point cloud, converted by the SAME
// transform-feedback bake as the lattice (rgb in, {v, display-rgb, bad} out), positioned
// by the same map3/view, coloured as themselves. The page hands samples over here;
// drawMesh3GL folds them into every frame while they exist.
let CLOUDA = null, CLOUDR = ''
export function setMeshCloud(arr, rev) { CLOUDA = arr && arr.length ? arr : null; CLOUDR = rev || '' }
function cloudProg(gl) {
	const vs = `#version 300 es
${MAP_GLSL}
uniform float uPtS;
in vec3 aV; in vec3 aRgb; in float aBad;
out vec3 vRgb; out float vBad;
void main() {
	vRgb = aRgb; vBad = aBad;
	gl_Position = view_(map3_(aV), 0.0);
	gl_PointSize = uPtS;
}`
	const fsrc = `#version 300 es
precision highp float;
in vec3 vRgb; in float vBad;
out vec4 O;
void main() {
	if (vBad > 0.5) discard;
	vec2 d = gl_PointCoord * 2.0 - 1.0;
	float r = dot(d, d);
	if (r > 1.0) discard;
	O = vec4(vec3(1.0), 0.24 * (1.0 - r * r));   // translucent marks accumulate into a white cloud only where samples overlap
}`
	return build(gl, vs, fsrc, (o) => {
		o.u = Object.fromEntries(['uMin', 'uMax', 'uCMin', 'uCMax', 'uMap', 'uWb', 'uRot', 'uScale', 'uPtS'].map(n => [n, gl.getUniformLocation(o.pr, n)]))
		o.aV = gl.getAttribLocation(o.pr, 'aV'); o.aRgb = gl.getAttribLocation(o.pr, 'aRgb'); o.aBad = gl.getAttribLocation(o.pr, 'aBad')
	}, null, { kind: 'mesh', label: 'cloud' })   // linked in the background like every program: an image dropped once waited out its compile
}
/** Whether the solid last asked of this canvas went undrawn because its programs are still linking – the figure pulses till they land. */
export const mesh3Linking = cv => !!mesh3States.get(cv)?.linking
const FRAME_AL = [0.85, 1, 0.38, 0.2]   // a pane's frame: white fringe and dark core, faint where the body stands in front
export function drawMesh3GL(cv, s, map, rot, scale, sheet, frame, cut, quant = 0, metric = 'oklab') {
	if (!has3dGL(s)) return false
	const gam = map?.gam ?? 'srgb'
	const st = mesh3State(cv)
	const ps = st && mesh3Progs(st, s, gam)
	const q3 = q3Mode(quant), dr = ps && ps.draw(q3 >= 101 ? 1 : q3 > 1 ? 2 : 0)
	if (!ps || !ps.bake || ps.bake.bad || ps.bake.pending || !dr || dr.bad || dr.pending) {
		// never show the previous space while this one compiles – clear and fall back
		if (st) { st.gl.clearColor(0, 0, 0, 0); st.gl.clear(st.gl.COLOR_BUFFER_BIT | st.gl.DEPTH_BUFFER_BIT)
			st.linking = !!(ps && ps.bake && !ps.bake.bad && dr && !dr.bad) }   // not drawn because its programs are still linking – not because they cannot
		return false
	}
	st.linking = false
	const { gl } = st
	const lat = gam === 'vis' || gam === 'locus' ? gam : 'srgb', parts = map.parts?.length ? map.parts : null
	const hs = gam === 'vis' ? { b: st.vb, ib: st.vi, n: st.vn, cnt: st.vvn }
		: gam === 'locus' ? { b: st.lb, ib: st.li, n: st.ln, cnt: st.lvn }
		: { b: st.tb, ib: st.ti, n: st.tn, cnt: st.tvn }
	// a body in parts is baked from a lattice of its own: the volume's, a point on the void wherever a cell crossed it (seamLattice)
	const bkey = s + '|' + gam + (parts ? '|parts' : '')
	const seam = parts && (st.seams[bkey] ??= (() => { const src = lat !== 'srgb' ? 'xyz' : gam === 'srgb' ? 'rgb' : gam, u = src === 'rgb' || src === 'xyz' ? 1 : 1 / 255
		const pts = seamLattice(st.pts[lat], st.idx[lat], (x, y, z) => space[src][s](x * u, y * u, z * u), map.split, parts), b = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW)
		return { pts, b } })())
	if (seam) hs.b = seam.b
	gl.viewport(0, 0, cv.width, cv.height)
	gl.clearColor(0, 0, 0, 0); gl.clearDepth(1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE)
	q3Mode(quant) ? gl.disable(gl.DITHER) : gl.enable(gl.DITHER)
	// straight-alpha shaders on a premultiplied canvas: color blends by SRC_ALPHA,
	// alpha accumulates as coverage (ONE) – the past-the-box fade and the pane
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
		if (u.uSteps) gl.uniform1i(u.uSteps, 18)
		if (u.uDim) gl.uniform1i(u.uDim, 3)
		if (u.uOut) gl.uniform1i(u.uOut, map.out ? 1 : 0)
		if (u.uPx) gl.uniform1f(u.uPx, cv.width / (cv.clientWidth || cv.width))
		if (u.uClip) gl.uniform1i(u.uClip, map.clip ? 1 : 0)
		gl.uniform4i(u.uMap, map.ti, map.ai ?? -1, map.mi ?? 0, 0)
		gl.uniform2i(u.uWb, map.wI ?? -1, map.bI ?? -1)
		if (u.uBip !== undefined) gl.uniform2i(u.uBip, map.bip?.[0] ?? -1, map.bip?.[1] ?? -1)
		if (u.uQuant) gl.uniform1i(u.uQuant, q3Mode(quant))
		if (u.uGrid) gl.uniform1i(u.uGrid, map.grid ? 1 : 0)
		// the hovered plane's cut, drawn per pixel on the surface (see fsSurf's uCut band)
		if (u.uCut) gl.uniform2i(u.uCut, cut ? cut.axis : -1, cut && cut.wrap ? 1 : 0)
		if (u.uCutV) gl.uniform2f(u.uCutV, cut ? cut.val : 0, cut ? cut.span : 1)
		// the outline (EDGE_GLSL): which of the volume's edges and the box's faces draw it, and its ink
		if (u.uCrease) gl.uniform1i(u.uCrease, map.edge ?? 0)
		if (u.uWalls) gl.uniform2i(u.uWalls, map.edge ? map.walls ?? 0 : 0, map.edge ? (map.caps ?? 0) & ~(map.flat ?? 0) : 0)   // a face the body lies flat against is not crossed: no cut on it
		if (u.uRt) gl.uniform1f(u.uRt, map.rt ?? 0.03)
		if (u.uSplit) gl.uniform1i(u.uSplit, map.parts?.length ? map.split : -1)
		if (u.uNeutK) { gl.uniform3fv(u.uNeutK, map.neut?.[0] ?? [0, 0, 0]); gl.uniform3fv(u.uNeutW, map.neut?.[1] ?? [0, 0, 0]) }
		if (u.uInk) map.edge && map.ink ? gl.uniform4f(u.uInk, map.ink[0], map.ink[1], map.ink[2], 0.5) : gl.uniform4f(u.uInk, 0, 0, 0, 0)   // in front at half; behind the body (pass 4) at 0.15
		gl.uniform2f(u.uRot, rot.a, rot.b)
		gl.uniform1f(u.uScale, scale)
	}
	// ── the bake: run the conversion ONCE per (space, gamut) – {v, rgb, bad} per lattice vertex (bakeRun: a fragment pass,
	// or transform feedback); a switch simply rebakes the slot ──
	if (st.bakeKey !== bkey) {
		bakeRun(st, ps.bake, setU, !st.fsBake ? { buf: hs.b, n: hs.cnt } : seam ? seam.src ??= bakeSrc(gl, {}, seam.pts) : st.src[lat] ??= bakeSrc(gl, {}, st.pts[lat]), st.out, [dr.aV, dr.aRgb, dr.aBad])
		gl.viewport(0, 0, cv.width, cv.height)
		st.bakeKey = bkey
	}
	const bindBaked = () => { bakedAttrs(gl, st.out, dr)
		if (dr.aSrc >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, hs.b); gl.enableVertexAttribArray(dr.aSrc); gl.vertexAttribPointer(dr.aSrc, 3, gl.FLOAT, false, 0, 0) } }   // each point's own address in the volume, beside what the bake made of it
	gl.useProgram(dr.pr); setU(dr.u); bindLuts(gl, dr)
	if (dr.u.uPalIdx) gl.uniform1i(dr.u.uPalIdx, PAL_UNIT)
	if (dr.u.uPalSites) gl.uniform1i(dr.u.uPalSites, SITE_UNIT)
	if (dr.u.uMetric) gl.uniform1i(dr.u.uMetric, Math.max(0, METRICS.indexOf(metric || 'oklab')))
	if (PALETTES[quant]) bindPalette(gl, dr.u.uPalIdx, dr.u.uPalSites, quant, metric)
	gl.uniform1i(dr.u.uHasHue, map.ai != null && map.ai >= 0 ? 1 : 0)
	// the body, and the caps that seal its cuts, as a pass draws them (uPass): 0 themselves · 4 their outline where hidden ·
	// 5 their ink and depth (INK_FS). hollow: a space inside the volume holds no image of its surface – its caps are its body (wire3d)
	// A body in parts (map.parts: each one's two ends along the split channel, then the ends of the next they meet) is drawn
	// part by part (DRAW_VS uPart), and takes its faces from a test by the pixel – under a human volume a program of its own (fsCapOpen)
	const human = gam === 'vis' || gam === 'locus'
	const body = (pass) => { if (map.hollow) return
		gl.useProgram(dr.pr); bindBaked(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hs.ib)
		gl.uniform1i(dr.u.uPass, pass)
		for (const p of parts ?? [null]) { if (p) gl.uniform4f(dr.u.uPart, p[0], p[1], p[2], p[3]); gl.drawElements(gl.TRIANGLES, hs.n, gl.UNSIGNED_INT, 0) }
		gl.uniform1i(dr.u.uPass, 0) }
	const cp = parts && human ? ps.capsOpen() : ps.caps
	const capMask = (map.caps ?? 63) & ~(map.flat ?? 0), capped = capMask && cp && !cp.bad && !cp.pending   // a face the body itself lies along needs no cap: under it, its outline showed through as a second rim
	const per = st.cn / 6   // one fitted-box face per slice, in (fi, side) order
	const capBind = (pass) => { const u = cp.u
		gl.useProgram(cp.pr); setU(u); bindLuts(gl, cp)
		gl.bindBuffer(gl.ARRAY_BUFFER, st.cb)
		gl.enableVertexAttribArray(cp.aFrac); gl.vertexAttribPointer(cp.aFrac, 3, gl.FLOAT, false, 0, 0)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, st.ci)
		if (u.uPass) gl.uniform1i(u.uPass, pass)
		if (u.uMask) gl.uniform1i(u.uMask, MASK_UNIT)
		return u }
	const capFace = (u, f, box) => { const trim = (map.trim ?? 0) >> f & 1
		if (u.uHatch) gl.uniform1i(u.uHatch, trim)   // the face drawn: hatched, if a trim
		if (u.uStep) gl.uniform1f(u.uStep, trim ? 0 : parts ? 1e-3 : 0.012)   // …and where its colors are read (vsCap)
		if (u.uCapK) gl.uniform2i(u.uCapK, f >> 1, f & 1)
		// …over the part of the wall that holds it (capReach), or all of the wall
		const lo = [0, 0, 0], hi = [1, 1, 1], a = f >> 1 === 0 ? 1 : 0, b = f >> 1 === 2 ? 1 : 2
		if (box) { lo[a] = box[0]; lo[b] = box[1]; hi[a] = box[2]; hi[b] = box[3] }
		if (u.uBoxLo) { gl.uniform3f(u.uBoxLo, lo[0], lo[1], lo[2]); gl.uniform3f(u.uBoxHi, hi[0], hi[1], hi[2]) }
		gl.drawElements(gl.TRIANGLES, per, gl.UNSIGNED_INT, f * per * 4) }
	// A display volume's cap is tested by the pixel with the space's own inverse – over its whole wall, in each of a frame's
	// three passes – to seal what is often a small part of it: OSA-UCS's three walls took 8 of a turned frame's 11 ms of GPU
	// (M4 Max, a 721 px solid; 29 ms a frame in WebKit), a bisection of some two hundred steps a pixel. Where on its wall a
	// cap has anything to draw is the same from every view: asked once – the wall laid flat (uPass 6), REACH texels a side,
	// read back – and the cap is drawn over that part alone, a texel and a half round it; a wall that holds nothing is not
	// drawn at all. Not a body in parts' (DSH: its faces hold colors nearly all over – asked, it drew no less)
	const reach = !capped || parts || human ? null : (cp.reach ??= {})[JSON.stringify([capMask, map.trim, map.rt, map.cmin, map.cmax, map.min, map.max, map.ti, map.ai, map.mi, map.wI, map.bI, map.bip])] ??= (() => {
		const N = REACH, t = st.reach ??= (() => { const fbo = gl.createFramebuffer(), tex = gl.createTexture()
			gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.bindTexture(gl.TEXTURE_2D, null)
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
			return { fbo, px: new Uint8Array(N * N * 4) } })(), out = []
		gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.viewport(0, 0, N, N); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.DITHER)
		const u = capBind(6)
		for (let f = 0; f < 6; f++) { if (!(capMask >> f & 1)) continue
			gl.clear(gl.COLOR_BUFFER_BIT); capFace(u, f)
			gl.readPixels(0, 0, N, N, gl.RGBA, gl.UNSIGNED_BYTE, t.px)
			let x0 = N, x1 = -1, y0 = N, y1 = -1
			for (let y = 0, i = 3; y < N; y++) for (let x = 0; x < N; x++, i += 4) if (t.px[i]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
			out[f] = x1 < 0 ? null : [Math.max(0, (x0 - 1.5) / N), Math.max(0, (y0 - 1.5) / N), Math.min(1, (x1 + 2.5) / N), Math.min(1, (y1 + 2.5) / N)] }
		gl.uniform1i(u.uPass, 0)
		gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height); gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); q3Mode(quant) ? gl.disable(gl.DITHER) : gl.enable(gl.DITHER)
		return out })()
	// A human volume's caps: the wall where it lies inside the solid – where the eye's ray has crossed an odd number of the
	// body's sheets before it. Counted per face, and per SIDE of a curved one (a cylinder's wall, a cone's: its near half
	// and its far), each against that wall's own depth, into a channel of a mask its cap then reads. One count for a whole
	// wall – a stencil's, once – cancelled wherever both its halves were cut: a hole in each (CIELCh, the appearance models),
	// and no cap at all where the solid overran a cylinder on every side (HSI, IHLS, HSP)
	const sides = []   // [face, which side of it: gl.BACK or gl.FRONT culled, 0 a plane]
	if (capped && human && !parts) { const mk = maskTarget(st, cv.width, cv.height)
		const curved = map.ai != null && map.ai >= 0 ? (map.wI ?? -1) >= 0 ? map.wI : map.mi ?? -1 : -1   // the axis that is a radius
		for (let f = 0; f < 6; f++) if (capMask >> f & 1) for (const cull of f >> 1 === curved ? [gl.BACK, gl.FRONT] : [0]) sides.push([f, cull])
		gl.bindFramebuffer(gl.FRAMEBUFFER, mk.fbo); gl.disable(gl.DITHER)
		sides.forEach(([f, cull], i) => {
			if (!(i & 3)) { gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mk.tex[i >> 2], 0); gl.colorMask(true, true, true, true); gl.clear(gl.COLOR_BUFFER_BIT) }
			gl.clear(gl.DEPTH_BUFFER_BIT)
			// the wall's own depth, this side of it…
			gl.colorMask(false, false, false, false); gl.disable(gl.BLEND)
			if (cull) { gl.enable(gl.CULL_FACE); gl.cullFace(cull) }
			capFace(capBind(2), f)
			gl.disable(gl.CULL_FACE)
			// …and every sheet of the body in front of it: each turns the channel over
			gl.colorMask(i % 4 === 0, i % 4 === 1, i % 4 === 2, i % 4 === 3); gl.depthMask(false); gl.depthFunc(gl.LESS)
			gl.enable(gl.BLEND); gl.blendFunc(gl.ONE_MINUS_DST_COLOR, gl.ZERO)
			gl.useProgram(dr.pr); bindBaked(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hs.ib)
			gl.uniform1i(dr.u.uPass, 2); gl.drawElements(gl.TRIANGLES, hs.n, gl.UNSIGNED_INT, 0); gl.uniform1i(dr.u.uPass, 0)
			gl.depthMask(true); gl.depthFunc(gl.LEQUAL) })
		gl.colorMask(true, true, true, true); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
		gl.bindFramebuffer(gl.FRAMEBUFFER, null); q3Mode(quant) ? gl.disable(gl.DITHER) : gl.enable(gl.DITHER)
		gl.useProgram(cp.pr); gl.uniform1i(cp.u.uPass, 0) }
	const caps = (pass) => { if (!capped) return
		const u = capBind(pass)
		if (parts) { const k = map.split, lo = (map.cmin ?? map.min).slice(), hi = (map.cmax ?? map.max).slice()
			for (const [a, b] of parts) { lo[k] = a; hi[k] = b   // each part's own box: its walls along the split channel where it begins and ends
				gl.uniform3f(u.uCMin, lo[0], lo[1], lo[2]); gl.uniform3f(u.uCMax, hi[0], hi[1], hi[2])
				for (let f = 0; f < 6; f++) if (capMask >> f & 1) capFace(u, f) } }
		else if (sides.length) { const mk = st.mask
			sides.forEach(([f, cull], i) => {
				gl.activeTexture(gl.TEXTURE0 + MASK_UNIT); gl.bindTexture(gl.TEXTURE_2D, mk.tex[i >> 2]); gl.activeTexture(gl.TEXTURE0)
				gl.uniform1i(u.uMaskCh, i & 3)
				if (cull) { gl.enable(gl.CULL_FACE); gl.cullFace(cull) }
				capFace(u, f)
				gl.disable(gl.CULL_FACE) })
			gl.activeTexture(gl.TEXTURE0 + MASK_UNIT); gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(gl.TEXTURE0) }   // (left bound, the next frame's count would draw into a texture it reads)
		else for (let f = 0; f < 6; f++) if (capMask >> f & 1 && reach?.[f] !== null) capFace(u, f, reach?.[f])
		if (u.uPass) gl.uniform1i(u.uPass, 0) }
	body(0); caps(0)
	// the outline's other half (INK_FS): the body and its caps once more, as ink, depth and kind, then the half lines over the frame
	if (map.edge && map.ink && !st.inkP.pending && !st.inkP.bad) { const k = inkTarget(st, cv.width, cv.height), ip = st.inkP
		gl.bindFramebuffer(gl.FRAMEBUFFER, k.fbo); gl.disable(gl.BLEND); gl.disable(gl.DITHER)   // the channels carry numbers here: written as they are
		gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		body(5); caps(5)
		gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST); if (!q3Mode(quant)) gl.enable(gl.DITHER)
		gl.useProgram(ip.pr)
		gl.activeTexture(gl.TEXTURE0 + BAKE_UNIT); gl.bindTexture(gl.TEXTURE_2D, k.tex); gl.activeTexture(gl.TEXTURE0)
		gl.uniform1i(ip.uTex, BAKE_UNIT); gl.uniform4f(ip.uInk, map.ink[0], map.ink[1], map.ink[2], 0.5)
		gl.uniform1f(ip.uR, 0.5 * cv.width / (cv.clientWidth || cv.width))
		gl.drawArrays(gl.TRIANGLES, 0, 3)
		gl.enable(gl.DEPTH_TEST)
	}
	// the outline the body stands in front of: its own bands again, drawn where the depth buffer hides them – faint, as a
	// pane's frame goes behind the body. The body's, then each cap's
	if (map.edge) {
		gl.depthFunc(gl.GREATER); gl.depthMask(false)
		body(4); caps(4)
		gl.depthFunc(gl.LEQUAL); gl.depthMask(true)
	}
	// the CUT's far arc: the same per-pixel band, drawn where the body covers it. The
	// body is opaque, so a pane behind it can only wash the surface – the hidden CURVE
	// is what carries "the plane continues through here", and it carries it precisely.
	if (cut) {
		gl.depthFunc(gl.GREATER); gl.depthMask(false)
		body(3)
		gl.depthFunc(gl.LEQUAL); gl.depthMask(true)
	}
	if (sheet && sheet.length) { const sp = st.sheetP
		if (!sp.pending && !sp.bad) { gl.useProgram(sp.pr)
			gl.uniform2f(sp.uRot, rot.a, rot.b); gl.uniform1f(sp.uScale, scale)
			gl.bindBuffer(gl.ARRAY_BUFFER, sp.buf); gl.bufferData(gl.ARRAY_BUFFER, sheet, gl.DYNAMIC_DRAW)
			gl.enableVertexAttribArray(sp.aPos); gl.vertexAttribPointer(sp.aPos, 3, gl.FLOAT, false, 0, 0)
			gl.depthMask(false)
			// a half-transparent film where nothing covers it – and NOTHING where the body
			// does. Behind an opaque body the pane could only veil the solid's own colour
			// (the old 0.35 wash), which is exactly what greyed the cross-section out.
			gl.uniform4f(sp.uTint, 1, 1, 1, 0.5)
			gl.drawArrays(gl.TRIANGLES, 0, sheet.length / 3)
			gl.depthMask(true) } }
	for (const fm of [].concat(frame || [])) { const fp = st.frameP   // a pane's frame, the solid's edges where they are lines of their own (a body of light), or both
		if (!fp.pending && !fp.bad) { gl.useProgram(fp.pr)
			gl.bindBuffer(gl.ARRAY_BUFFER, fp.buf)
			gl.enableVertexAttribArray(fp.aPos); gl.vertexAttribPointer(fp.aPos, 3, gl.FLOAT, false, 0, 0)
			gl.depthMask(false)
			gl.enable(gl.STENCIL_TEST); gl.stencilFunc(gl.EQUAL, 0, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR)
			const rib = (v, r, g, b, a) => { if (!v.length) return
				gl.uniform4f(fp.uTint, r, g, b, a)
				gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW)
				gl.clear(gl.STENCIL_BUFFER_BIT)
				gl.drawArrays(gl.TRIANGLES, 0, v.length / 3) }
			const [tr, tg, tb] = fm.tint, A = fm.al || FRAME_AL   // al: the fringe's and the core's alpha in front, then behind the body
			rib(fm.fr, 1, 1, 1, A[0]); rib(fm.co, tr, tg, tb, A[1])
			gl.depthFunc(gl.GREATER)
			rib(fm.fr, 1, 1, 1, A[2]); rib(fm.co, tr, tg, tb, A[3])
			gl.depthFunc(gl.LEQUAL)
			gl.disable(gl.STENCIL_TEST); gl.depthMask(true) } }
	// ── the cloud, last: the image's own colours at their own coordinates. Its bake rides
	// the same TF program as the lattice; depth is off so the samples read THROUGH the body
	// (inside a closed solid a depth-tested cloud would simply vanish behind the near wall).
	// the image is sRGB, so its coordinates in this space are rgb→space – NEVER the solid's
	// own source (xyz for the human gamut, p3/rec2020 for wide cubes): feeding image bytes to
	// the xyz bake read them as tristimulus and scattered the cloud outside the solid. Bake it
	// through the srgb program always; its display colour is the pixel's own sRGB, and every
	// sample lands inside the body (sRGB ⊆ every target gamut).
	const cps = CLOUDA ? (gam === 'srgb' ? ps : mesh3Progs(st, s, 'srgb')) : null
	if (CLOUDA && cps && cps.bake && !cps.bake.bad && !cps.bake.pending) {
		const cp = st.cloudPr ??= cloudProg(gl)
		if (!cp.pending && !cp.bad) {
			const ckey = s + '|' + CLOUDR   // rgb→space is gamut-independent – no rebake on the gamut switch
			if (st.cloudKey !== ckey) {
				st.cloudN = CLOUDA.length / 3; st.cloudOut ??= {}
				let src
				if (cps.bake.fs) src = bakeSrc(gl, st.cloudSrc ??= {}, CLOUDA)
				else { src = st.cloudSrc ??= { buf: gl.createBuffer() }; src.n = st.cloudN
					gl.bindBuffer(gl.ARRAY_BUFFER, src.buf); gl.bufferData(gl.ARRAY_BUFFER, CLOUDA, gl.DYNAMIC_DRAW)
					st.cloudOut.buf ??= gl.createBuffer(); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, st.cloudOut.buf)
					gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, st.cloudN * 28, gl.DYNAMIC_COPY); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null) }
				bakeRun(st, cps.bake, setU, src, st.cloudOut, [dr.aV, dr.aRgb, dr.aBad, cp.aV, cp.aRgb, cp.aBad])
				gl.viewport(0, 0, cv.width, cv.height)
				st.cloudKey = ckey
				st.bakeKey = ''   // the lattice's own bake state was disturbed – let it rebake next frame
			}
			gl.useProgram(cp.pr)
			gl.uniform3f(cp.u.uMin, map.min[0], map.min[1], map.min[2])
			gl.uniform3f(cp.u.uMax, map.max[0], map.max[1], map.max[2])
			gl.uniform4i(cp.u.uMap, map.ti, map.ai ?? -1, map.mi ?? 0, 0)
			gl.uniform2i(cp.u.uWb, map.wI ?? -1, map.bI ?? -1)
			gl.uniform2f(cp.u.uRot, rot.a, rot.b)
			gl.uniform1f(cp.u.uScale, scale)
			gl.uniform1f(cp.u.uPtS, Math.max(1.75, cv.width / 280))
			bakedAttrs(gl, st.cloudOut, cp)
			gl.disable(gl.DEPTH_TEST); gl.depthMask(false)
			gl.drawArrays(gl.POINTS, 0, st.cloudN)
			gl.depthMask(true); gl.enable(gl.DEPTH_TEST)
		}
	}
	return true
}

// ── the CIE xy chromaticity diagram: the visible-gamut horseshoe with THIS
// space's reachable chromaticities rendered vivid, the rest ghosted – the
// "shape of the gamut on the xy plane" panel of the dossier ──

// a chroma-encoded gamma space's base: the first rgb cube on its path before xyz (the reach is held to it – gamutProg below,
// and the lifted plate's own box); null for any other space
export const plateBase = (s) => {
	if (s === 'rgb' || meta[s]?.encoding !== 'gamma' || classify(s).archetype === 'additive') return null
	const path = pathToRgb(s) || []
	for (let i = 1; i < path.length; i++) {
		const n = path[i]
		if (n === 'xyz') return null
		if (classify(n).archetype === 'additive') return n
	}
	return null
}
const gamutProgs = new Map()
function gamutProg(s) {
	if (gamutProgs.has(s)) return gamutProgs.get(s)
	const d = dimOf(s)
	// the first rgb-cube space on the path BEFORE xyz bounds the gamut: a
	// chroma-encoded space (ycbcr on sRGB, yccbccrc on Rec.2020) only owns colors
	// whose base rgb is valid – past that, in-box coordinates decode through
	// negative light and the coverage lies. Only gamma-domain device encodings are
	// so bounded; a colorimetric space (xyz, oklab, lab, the CAMs – encoding
	// linear/perceptual) spans all vision and nothing bounds it. Topology can't tell
	// them apart (oklch/oklab/xyz carry a shortcut →rgb edge that skips xyz); encoding does.
	// An additive space is a cube of its own: its range alone bounds it (Display P3 rides a p3 → rgb shortcut – sRGB
	// as its base clipped it to sRGB's triangle)
	const base = plateBase(s)
	let lib
	try { lib = s === 'rgb' ? glsl('xyz', 'lrgb') : glsl(base ? [['xyz', s], [s, 'xyz'], [s, base]] : [['xyz', s], [s, 'xyz']]) } catch { gamutProgs.set(s, null); return null }
	const S = san(s)
	// a white not D65 is drawn in the space's own XYZ (definition.js nativeOf): a pixel's chromaticity is its own, taken
	// to the hub before the space reads it – its primaries and white land where the specification prints them
	const nat = nativeOf(s)
	// a log curve's codes under its black are footroom, no color (footroom.js): its reach is its primaries' triangle
	const ft = footroom(space[s], meta[s]), T = ft && ft.tri.flat().map(v => v.toFixed(8))
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
out vec4 O;${ft ? `
bool inFoot(vec2 p) {   // non-negative light: inside the primaries' triangle (hub xy)
	vec2 a = vec2(${T[0]}, ${T[1]}), b = vec2(${T[2]}, ${T[3]}), c = vec2(${T[4]}, ${T[5]});
	float d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
	float l1 = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / d, l2 = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / d;
	return l1 >= -1e-4 && l2 >= -1e-4 && 1.0 - l1 - l2 >= -1e-4;
}` : ''}
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
	const float YQ[6] = float[6](2.0, 10.0, 25.0, 45.0, 70.0, 95.0);${nat ? `
	const mat3 TOHUB = mat3(${[0, 3, 6, 1, 4, 7, 2, 5, 8].map(i => nat.toHub[i].toFixed(10)).join(', ')});` : ''}
	${s === 'rgb'
		? `vec3 r1 = xyz_lrgb(vec3(xy.x / xy.y, 1.0, (1.0 - xy.x - xy.y) / xy.y) * 50.0);   // sRGB reaches a chromaticity iff its linear rgb is non-negative there – at any luminance, scale cancels; an absolute tolerance at low Y once let a band past the primaries in
	cov = min(r1.x, min(r1.y, r1.z)) >= -0.001 * max(r1.x, max(r1.y, r1.z));`
		: `for (int q = 0; q < 6; q++) {
		float Yq = YQ[q];
		vec3 XYZq = vec3(xy.x * Yq / xy.y, Yq, (1.0 - xy.x - xy.y) * Yq / xy.y);${nat ? `
		XYZq = TOHUB * XYZq;` : ''}
		vec2 hq = XYZq.xy / (XYZq.x + XYZq.y + XYZq.z);
		${VT[d]} vq = xyz_${S}(XYZq);
		bool ok = !(${'xyzw'.slice(0, d).split('').map(c => `isnan(${d === 1 ? 'vq' : `vq.${c}`})`).join(' || ')})${ft ? ' && inFoot(hq)' : ''};
		${'xyzw'.slice(0, d).split('').map((c, k) => `if (${d === 1 ? 'vq' : `vq.${c}`} < ${lo[k].toFixed(6)} || ${d === 1 ? 'vq' : `vq.${c}`} > ${hi[k].toFixed(6)}) ok = false;`).join('\n\t\t')}
		if (ok) {   // and it must genuinely encode this chromaticity (poles lie)
			vec3 back = ${S}_xyz(vq);
			float sb = back.x + back.y + back.z;
			if (sb > 0.0 && abs(back.x / sb - hq.x) < 0.004 && abs(back.y / sb - hq.y) < 0.004) {
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
	}, null, { kind: 'gamut', space: s })
	st.lutN = lutNames(fs)
	gamutProgs.set(s, st)
	return st
}

/** Paint the xy-diagram gamut panel for a space ('pending'/'no' → false). */
export function paintGamutGL(cv2d, s) {
	if (!G) return false
	flushCells()   // it draws at CV's origin: an open batch's cells go out first
	const st = gamutProg(s)
	if (!st || st.bad || st.pending) return false
	const w = cv2d.width, h = cv2d.height
	fitCV(w, h)
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
	ctx.drawImage(CV, ...cutCV(w, h), 0, 0, w, h)
	return true
}
/** xy position of a chromaticity inside the panel (for the marker), 0..1 each. */
export const gamutPos = (x, y) => [(x + 0.107) / 0.857, 1 - (y + 0.055) / 0.955]

// ── the hero slice: OKLCH hue across × chroma down at lightness L, chroma
// normalized per hue to the sRGB gamut edge (bisected in-shader) – cheap enough
// to repaint every frame, so the lightness itself can animate ──
// ── the hero: three horizontal bands of pure hues per space – continuous on top,
// then 20 steps, then 10 – pick the stepping you like. Each hue sits at its most
// saturated displayable tone (the sRGB cusp, via a per-space LUT); bounded cylinders
// sit at full saturation. Static per space – nothing repaints on color change. ──
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
	flushCells()   // it draws at CV's origin: an open batch's cells go out first
	const st = heroProg(spec)
	if (!st || st.bad || st.pending) return false
	const w = cv2d.width, h = cv2d.height
	fitCV(w, h)
	G.viewport(0, 0, w, h)
	G.disable(G.DEPTH_TEST)
	G.useProgram(st.pr)
	bindLuts(G, st)
	G.uniform2f(st.u.uRes, w, h)
	if (st.u.uCusp && cusp) G.uniform1fv(st.u.uCusp, cusp)
	G.drawArrays(G.TRIANGLES, 0, 3)
	cv2d.getContext('2d').drawImage(CV, ...cutCV(w, h), 0, 0, w, h)
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
	}, null, { kind: 'img', space: s })
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
	flushCells()   // it draws at CV's origin: an open batch's cells go out first
	const st = imgProg(s)
	if (!st || st.bad || st.pending) return false
	const w = cv2d.width, h = cv2d.height
	fitCV(w, h)
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
	ctx.drawImage(CV, ...cutCV(w, h), 0, 0, w, h)
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
/** The xy-diagram panel works for ANY dimensionality – a 1-channel space IS a locus
 *  (kelvin's Planckian curve, gray's neutral axis). It needs the xyz round trip;
 *  one-way spaces (wavelength) honestly have no coverage to show. */
const gamutOK = new Map()
export const hasGamutGL = s => { if (!G || !meta[s]?.range || softGL()) return false
	if (!gamutOK.has(s)) { let ok = s === 'rgb'
		if (!ok) try { glsl([['xyz', s], [s, 'xyz']]); ok = true } catch {}
		gamutOK.set(s, ok) }
	return gamutOK.get(s) }
