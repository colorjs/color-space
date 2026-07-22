// Differential tests for the GL chunks: every declared edge (and every composed
// rgb→space path) is evaluated as JS — the chunk dialect (see the contract in
// gl/index.js) transforms mechanically to JS — and compared against the scalar
// library, which is itself pinned to the authoritative references. This checks
// formula equivalence in float64; GPU compilation is smoke-tested separately
// (scripts/check-gl-gpu.js) since GLSL/WGSL only add float32 rounding.
import test, { is } from 'tst'
import space from '../index.js'
import data from '../data.json' with { type: 'json' }
const meta = data.spaces
import glslDefault, { chunks, graph, glsl, luts } from '../gl/index.js'

// ---- GLSL chunk dialect → JS ----
export function glslToJs(src) {
	let s = src
	// LUT samplers (composer-emitted): the uniform resolves to the chunk-declared
	// data, texelFetch to a typed-array read — same numbers as the GPU texture
	s = s.replace(/\buniform\s+highp\s+sampler2D\s+(\w+)tex;/g, "const $1tex = __lut('$1');")
	// const tables: const float A_[81] = float[81](…); → const A_ = __arr(…);
	s = s.replace(/\bconst\s+float\s+(\w+)\s*\[\s*\d+\s*\]\s*=\s*float\s*\[\s*\d+\s*\]\s*\(/g, 'const $1 = __arr(')
	// function definitions
	s = s.replace(/\b(?:vec[234]|float|int)\s+(\w+)\s*\(([^)]*)\)\s*{/g, (m, name, params) => {
		const ps = params.trim() === '' ? '' : params.split(',').map(p => p.trim().split(/\s+/).pop()).join(', ')
		return `function ${name}(${ps}) {`
	})
	// declarations
	s = s.replace(/\bconst\s+(?:float|int|vec[234])\s+(\w+)\s*=/g, 'const $1 =')
	s = s.replace(/\b(?:float|int|vec[234])\s+(\w+)\s*=/g, 'let $1 =')
	return s
}

const lutData = {}   // memoized chunk-declared LUTs, keyed by lut name
const H = {
	vec2: (x, y) => ({ x, y }),
	vec3: (x, y, z) => ({ x, y, z }),
	vec4: (x, y, z, w) => ({ x, y, z, w }),
	__arr: (...v) => v,
	__lut: (n) => lutData[n] ??= { w: luts[n].w, d: luts[n].data() },
	ivec2: (x, y) => ({ x, y }),
	texelFetch: (t, ij) => { const o = (ij.y * t.w + ij.x) * 4
		return { x: t.d[o], y: t.d[o + 1], z: t.d[o + 2], w: t.d[o + 3] } },
	pow: Math.pow, abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil,
	sqrt: Math.sqrt, exp: Math.exp, log: Math.log, exp2: (x) => 2 ** x, log2: Math.log2,
	sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos,
	atan: (a, b) => b === undefined ? Math.atan(a) : Math.atan2(a, b),
	min: Math.min, max: Math.max,
	clamp: (x, a, b) => Math.min(Math.max(x, a), b),
	mix: (a, b, t) => a + (b - a) * t,
	step: (e, x) => x < e ? 0 : 1,
	fract: (x) => x - Math.floor(x),
	float: (x) => x,
	int: (x) => Math.trunc(x),
}

export function evalGlsl(src) {
	const js = glslToJs(src)
	const names = [...new Set([...js.matchAll(/function (\w+)/g)].map(m => m[1]))]
	return new Function(...Object.keys(H), `${js}; return { ${names.join(', ')} }`)(...Object.values(H))
}

const pack = (arr) => arr.length === 1 ? arr[0] : H['vec' + arr.length](...arr)
const unpack = (v) => typeof v === 'number' ? [v]
	: v.w !== undefined ? [v.x, v.y, v.z, v.w]
	: v.z !== undefined ? [v.x, v.y, v.z] : [v.x, v.y]

// ---- samples & tolerances ----
const RGB_SAMPLES = [
	[255, 0, 0], [0, 255, 0], [0, 0, 255],
	[255, 255, 0], [0, 255, 255], [255, 0, 255],
	[255, 255, 255], [0, 0, 0], [128, 128, 128],
	[200, 100, 50], [33, 180, 90], [100, 150, 200], [240, 24, 120], [17, 17, 17],
]
// native-space inputs for spaces rgb cannot project into (one-way / parametric)
const SAMPLE = {
	wavelength: [[400], [480], [550], [620], [700]],
}
// normalized-error tolerance: 1e-6 default; iterative/table chunks declare their own `tol`
const tolOf = (a, b) => Math.max(chunks[a]?.tol ?? 0, chunks[b]?.tol ?? 0, 1e-6)

const samplesIn = (name) => name === 'rgb' ? RGB_SAMPLES
	: SAMPLE[name] ?? (typeof space.rgb[name] === 'function' ? RGB_SAMPLES.map(s => space.rgb[name](...s)) : null)

const isHue = (name, k) => {
	const r = meta[name]?.range?.[k]
	return !!r && r[0] === 0 && r[1] === 360
}
const err = (got, exp, hue) => {
	const d = hue ? Math.min(Math.abs(got - exp) % 360, 360 - Math.abs(got - exp) % 360) : Math.abs(got - exp)
	return d / (1 + Math.abs(exp))
}
const san = (s) => s.replace(/-/g, '')

// ---- contract lint: the chunk dialect stays translatable ----
test('gl: chunks obey the dialect contract', () => {
	const bad = [], fns = new Map()
	for (const name in chunks) {
		const code = chunks[name].code || ''
		if (/\?/.test(code)) bad.push(`${name}: ternary`)
		if (/\bmod\s*\(/.test(code)) bad.push(`${name}: mod() — use mod_`)
		if (/\batan\s*\(/.test(code)) bad.push(`${name}: atan() — use atan2_`)
		for (const m of code.matchAll(/\b(?:vec[234]|float|int)\s+(\w+)\s*\([^)]*\)\s*{/g)) {
			if (fns.has(m[1])) bad.push(`${name}: fn ${m[1]} collides with chunk ${fns.get(m[1])}`)
			else fns.set(m[1], name)
		}
		for (const nbr in chunks[name].edges || {}) {
			for (const fn of chunks[name].edges[nbr]) {
				if (fn && !['polar_fwd', 'polar_inv'].includes(fn) && !new RegExp(`\\b${fn}\\s*\\(`).test(code))
					bad.push(`${name}: edge fn ${fn} not defined in code`)
			}
		}
	}
	is(bad, [], 'no contract violations')
})

// ---- every declared primitive edge, both directions ----
const EDGES = []
for (const name in graph) for (const nbr in graph[name]) EDGES.push([name, nbr])

for (const [a, b] of EDGES) {
	test(`gl: ${a} → ${b}`, () => {
		const fns = evalGlsl(glsl(a, b))
		const entry = fns[`${san(a)}_${san(b)}`]
		is(typeof entry, 'function', `entry ${san(a)}_${san(b)} defined`)
		const ins = samplesIn(a)
		is(Array.isArray(ins), true, `samples available for ${a}`)
		let worst = 0, at = ''
		for (const input of ins) {
			const exp = space[a][b](...input)
			const got = unpack(entry(pack(input)))
			for (let k = 0; k < exp.length; k++) {
				const e = err(got[k], exp[k], isHue(b, k))
				if (e > worst) { worst = e; at = `[${input.map(v => +v.toFixed(4))}] ch${k}: ${got[k]} vs ${exp[k]}` }
			}
		}
		is(worst <= tolOf(a, b), true, `${a}→${b} max err ${worst.toExponential(2)} at ${at} (tol ${tolOf(a, b)})`)
	})
}

// ---- multi-pair composition: shared chunks emit once, every entry works ----
test('gl: multi-pair glsl() dedupes chunks across pairs', () => {
	const src = glsl([['oklch', 'rgb'], ['oklch', 'xyz'], ['xyz', 'p3-linear'], ['xyz', 'lrgb']])
	const defs = [...src.matchAll(/\b(?:vec[234]|float|int)\s+(\w+)\s*\([^)]*\)\s*{/g)].map(m => m[1])
	is(defs.filter((d, i) => defs.indexOf(d) !== i), [], 'no duplicate definitions')
	const fns = evalGlsl(src)
	const input = space.rgb.oklch(200, 100, 50)
	for (const [fn, from, to] of [['oklch_rgb', 'oklch', 'rgb'], ['oklch_xyz', 'oklch', 'xyz'], ['xyz_p3linear', 'xyz', 'p3-linear']]) {
		const inn = from === 'oklch' ? input : space.oklch.xyz(...input)
		const exp = space[from][to](...inn)
		const got = unpack(fns[fn](pack(inn)))
		is(exp.every((e, k) => err(got[k], e, isHue(to, k)) < 1e-6), true, `${fn} matches scalar lib`)
	}
})

// ---- composed paths: rgb → every reachable space (exercises wrappers/dedup) ----
test('gl: composed rgb → space → rgb across the graph', () => {
	const misses = []
	for (const name in graph) {
		if (name === 'rgb') continue
		let fwd, inv
		try { fwd = glsl('rgb', name) } catch { continue } // not reachable from rgb (one-way space)
		try { inv = glsl(name, 'rgb') } catch { inv = null }
		const fns = evalGlsl(fwd), entry = fns[`rgb_${san(name)}`]
		for (const s of RGB_SAMPLES) {
			const exp = space.rgb[name](...s)
			const got = unpack(entry(pack(s)))
			for (let k = 0; k < exp.length; k++)
				if (err(got[k], exp[k], isHue(name, k)) > tolOf('rgb', name))
					misses.push(`rgb→${name} [${s}] ch${k}: ${got[k]} vs ${exp[k]}`)
		}
		if (inv) {
			const ifns = evalGlsl(inv), ientry = ifns[`${san(name)}_rgb`]
			for (const s of RGB_SAMPLES) {
				const mid = space.rgb[name](...s)
				const exp = space[name].rgb(...mid)
				const got = unpack(ientry(pack(mid)))
				for (let k = 0; k < exp.length; k++)
					if (err(got[k], exp[k], isHue('rgb', k)) > tolOf(name, 'rgb'))
						misses.push(`${name}→rgb [${s}] ch${k}: ${got[k]} vs ${exp[k]}`)
			}
		}
	}
	is(misses.slice(0, 20), [], `composed paths match scalar lib (${misses.length} misses)`)
})

// ── the lean tier: registry-free composition from imported chunks ──
const bundle = (name) => glsl([[name, 'rgb'], ['rgb', name]])

test('gl: compose (lean) emits byte-identical sources to the registry', async () => {
	const { glsl: lean, compose } = await import('../gl/compose.js')
	const oklch = (await import('../gl/oklch.glsl.js')).default
	const p3 = (await import('../gl/p3.glsl.js')).default
	is(lean('rgb', oklch), glsl('rgb', 'oklch'), 'rgb→oklch')
	is(lean(oklch, 'rgb'), glsl('oklch', 'rgb'), 'oklch→rgb')
	is(lean(oklch), bundle('oklch'), 'single-chunk arg = the both-ways bundle')
	is(lean(oklch, p3), glsl('oklch', 'p3'), 'cross-space from two imported chunks')
	is(compose([oklch, p3]).glsl([['oklch', 'rgb'], ['oklch', 'p3']]),
		glsl([['oklch', 'rgb'], ['oklch', 'p3']]), 'multi-pair')
	const { wgsl: leanWgsl } = await import('../gl/compose.js')
	const { wgsl: fatWgsl } = await import('../gl/wgsl.js')
	is(leanWgsl(oklch, 'rgb'), fatWgsl('oklch', 'rgb'), 'lean wgsl parity')
})

// ── chunks are pure data; the engine composes them (data never imports the engine) ──
test('gl: chunk files are pure data — none import the composer', async () => {
	const fs = await import('node:fs')
	const { fileURLToPath } = await import('node:url')
	const dir = fileURLToPath(new URL('../gl/', import.meta.url))
	const offenders = fs.readdirSync(dir).filter(f => f.endsWith('.glsl.js'))
		.filter(f => fs.readFileSync(dir + f, 'utf8').includes("from './compose.js'"))
	is(offenders, [], 'no chunk imports ./compose.js — data must not depend on the engine')
})

test('gl: an imported chunk is pure data — you name the conversion via glsl()', async () => {
	const oklch = (await import('../gl/oklch.glsl.js')).default
	is(Object.keys(oklch), ['name', 'deps', 'edges', 'code'], 'only data fields, no accessors')
	is(oklch.rgb, undefined, 'no self-composing property — that would couple data to the engine')
	// name the conversion through the composer (mirrors scalar oklch.rgb, one level down)
	is(/\bvec3\s+oklch_rgb\s*\(/.test(glsl(oklch, 'rgb')), true, 'glsl(oklch, "rgb") = oklch→rgb, never inverted')
	is(glsl(oklch), bundle('oklch'), 'glsl(oklch) = the both-ways bundle')
})

// ── measured-dataset chunks: the `lut` contract ──
test('gl: a lut chunk composes with its sampler and exact data', async () => {
	const munsell = (await import('../gl/munsell.glsl.js')).default
	const src = glsl(munsell)
	is(/uniform highp sampler2D munsell_ren_tex;/.test(src), true, 'composed source declares the lut sampler')
	is(/vec4 munsell_ren_\(int i, int j\)/.test(src), true, 'and its texelFetch accessor')
	const tex=luts.munsell_ren_.data()
	is(luts.munsell_ren_.w * luts.munsell_ren_.h * 4, tex.length, 'registry descriptor matches its data')
	// RG packs this value plane; BA packs the adjacent one. Column zero reserves
	// BA for the current/next local rim so the web field can void non-Munsell C.
	const { cellXY, maxChroma, WC } = await import('../spaces/munsell-renotation.js')
	const packed=[[0,0,0],[7,3,5],[23,7,11],[39,8,19]].every(([h,v,k])=>{
		const o=((v*20+k)*40+h)*4, a=k?cellXY(h,v,2*k):WC
		const b=k?cellXY(h,Math.min(v+1,8),2*k):[maxChroma(h,v),maxChroma(h,Math.min(v+1,8))]
		return [a[0],a[1],b[0],b[1]].every((x,i)=>Math.abs(tex[o+i]-x)<1e-7) })
	is(packed,true,'RGBA texels pack exact adjacent-value xy pairs')
	const { translate } = await import('../gl/translate.js')
	const w = translate(src)
	is(/@group\(0\) @binding\(0\) var munsell_ren_tex: texture_2d<f32>;/.test(w), true, 'WGSL: the sampler becomes a texture binding')
	is(/textureLoad\(munsell_ren_tex, vec2i\(i, j\), 0\)/.test(w), true, 'WGSL: texelFetch becomes textureLoad')
	// lattice nodes are the renotation itself: the composed forward at a node
	// equals the scalar library to texture precision (float32 texels — the same
	// numbers the GPU reads; interpolation weights are identical)
	const fns = evalGlsl(glsl('munsell', 'xyy'))
	const exp = space.munsell.xyy(50, 5, 10)
	const got = unpack(fns.munsell_xyy(pack([50, 5, 10])))
	is(exp.every((e, k) => Math.abs(got[k] - e) < 2e-7), true, 'lattice-node forward is texture-exact')
	is(Math.abs(fns.munsell_maxc_(20,4)-maxChroma(7,3))<1e-7,true,'local MacAdam rim is texture-exact')
	// Quantized 3D sections call space→RGB in the draw fragment (not the bake
	// vertex stage), so measured spaces must discover and bind their LUT there.
	const { readFileSync } = await import('node:fs')
	const siteGL=readFileSync(new URL('../web/js/gl.js',import.meta.url),'utf8')
	is(/draw\.lutN\s*=\s*lutNames\(fsSurf\)/.test(siteGL),true,'3D draw discovers measured-space LUTs')
	is(/setU\(dr\.u\);\s*bindLuts\(gl,\s*dr\)/.test(siteGL),true,'3D draw binds measured-space LUTs')
})

// ── the full-catalog tier: one function, any space by name ──
test('gl: default export is the by-name composer', () => {
	is(glslDefault, glsl, 'default export === named glsl')
	is(glsl('oklch', 'p3'), glsl('oklch', 'p3'), 'any pair routes by name')
	let threw = ''
	try { glsl('rgb', 'nope') } catch (e) { threw = e.message }
	is(/no path/.test(threw), true, 'unknown space throws no-path, not a silent empty source')
})

test('gl: every chunk carries its edge/requires chain in deps', () => {
	for (const [n, c] of Object.entries(chunks)) {
		const have = new Set((c.deps || []).map((d) => d.name))
		for (const nb of [...Object.keys(c.edges || {}), ...(c.requires || [])]) {
			if (nb === 'rgb' || !chunks[nb]) continue
			is(have.has(nb), true, `${n} deps carry ${nb}`)
		}
	}
})
