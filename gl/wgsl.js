/**
 * color-space/gl/wgsl — the same conversion chunks as WGSL, for WebGPU.
 *
 *     import { wgsl } from 'color-space/gl/wgsl.js'
 *     const src = wgsl('rgb', 'oklch')
 *     // → self-contained WGSL defining `fn rgb_oklch(c: vec3f) -> vec3f`
 *
 * Chunks are authored once, in the restricted GLSL subset (see the contract in
 * ./index.js); this module translates that subset mechanically — the grammar is
 * small enough that the translation is exact, not heuristic. Differential tests
 * (test/gl.js) pin both languages to the scalar JS library.
 */
import { glsl } from './index.js'

const TYPE = { vec2: 'vec2f', vec3: 'vec3f', vec4: 'vec4f', float: 'f32', int: 'i32' }

/**
 * Translate restricted-subset GLSL (the chunk dialect) to WGSL.
 * @param {string} src GLSL source produced by `glsl()` or a chunk's `code`
 * @returns {string} WGSL source
 */
export function translate(src) {
	let s = src
	// const tables: const float A_[81] = float[81](…) → const A_ = array<f32, 81>(…)
	s = s.replace(/\bconst\s+float\s+(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*float\s*\[\s*\d+\s*\]\s*\(/g,
		'const $1 = array<f32, $2>(')
	// function definitions: vec3 name(vec3 a, float b) { → fn name(a: vec3f, b: f32) -> vec3f {
	s = s.replace(/\b(vec[234]|float|int)\s+(\w+)\s*\(([^)]*)\)\s*{/g, (m, ret, name, params) => {
		const ps = params.trim() === '' ? '' : params.split(',').map(p => {
			const [t, n] = p.trim().split(/\s+/)
			return `${n}: ${TYPE[t]}`
		}).join(', ')
		return `fn ${name}(${ps}) -> ${TYPE[ret]} {`
	})
	// global constants: const float X = … → const X = … (abstract-float, exact)
	s = s.replace(/\bconst\s+(?:float|int)\s+(\w+)\s*=/g, 'const $1 =')
	// local declarations: float x = / int i = / vec3 v = → var x =
	s = s.replace(/\b(?:vec[234]|float|int)\s+(\w+)\s*=/g, 'var $1 =')
	// constructors/casts: vec3(…) → vec3f(…), float(…) → f32(…), int(…) → i32(…)
	s = s.replace(/\b(vec[234])\s*\(/g, '$1f(')
	s = s.replace(/\bfloat\s*\(/g, 'f32(')
	s = s.replace(/\bint\s*\(/g, 'i32(')
	// util atan2_ body: GLSL two-arg atan is WGSL atan2
	s = s.replace(/\batan\(y, x\)/g, 'atan2(y, x)')
	return s
}

/**
 * Compose the WGSL source converting `from` → `to` with entry
 * `fn ${from}_${to}(c: vec3f) -> vec3f` (hyphens stripped).
 * @param {string} from source space name
 * @param {string} to target space name
 * @returns {string} self-contained WGSL source
 */
export const wgsl = (from, to) => translate(glsl(from, to))

export default wgsl
