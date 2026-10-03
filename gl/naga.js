/**
 * color-space/gl/naga — the chunks as HLSL and MSL, written by naga (wgpu's shader
 * translator, as the npm package naga-wasm) from the same WGSL ./translate.js emits.
 *
 * The verified WGSL stays the single source: naga parses and validates it, then its
 * own HLSL / MSL backends write the output — the backends wgpu runs on DirectX and
 * Metal, compiled with DXC, FXC and `xcrun metal` in upstream CI. No formula is
 * re-derived here. Two fix-ups to the names naga writes:
 *  - naga appends `_` to a function name ending in a digit (`lrgb_rec709` →
 *    `lrgb_rec709_`); each gets its own name back, only when that name is free.
 *  - naga strips trailing `_` (a private helper `oklab_toe_` lands as `oklab_toe`), so
 *    the shared helpers (`cbrt_`, `spow_`, `atan2_`, `mod_`) would land as bare
 *    `cbrt` / `spow` / `mod` — names host shaders often define (HLSL ports of GLSL
 *    `#define mod(x, y)`). They become `colorspace_cbrt`, `colorspace_spow`,
 *    `colorspace_atan2`, `colorspace_mod`.
 *
 * The one LUT space (munsell) keeps its texture: HLSL declares
 * `Texture2D<float4> munsell_ren_tex : register(t0)`; MSL passes
 * `texture2d<float> munsell_ren_tex` as an extra parameter to every function that reads
 * it, the entry included. Upload `luts.munsell_ren_.data()` there (w×h RGBA32F, NEAREST).
 *
 * `color-space/gl/hlsl` and `color-space/gl/msl` are the one-call forms. Without a
 * bundler (a browser loading a vendored naga-wasm), pass the module in yourself:
 *
 *     import * as naga from './vendor/naga-wasm/index.js'
 *     import { glsl } from './gl/index.js'
 *     import { emit } from './gl/naga.js'
 *     await naga.init()                       // fetches naga_bg.wasm beside it
 *     emit(naga, 'hlsl', glsl('rgb', 'oklch'))  // float3 rgb_oklch(float3)
 */
import util from './util.js'
import { translate } from './translate.js'

/** The naga-wasm version the HLSL/MSL output is tested against (optional peer dependency). */
export const NAGA_WASM = '30.2.0'

// util helpers whose trailing `_` naga would strip, leaving a generic name
const HELPER = new RegExp(`\\b(${util.filter((u) => u.name.endsWith('_')).map((u) => u.name).join('|')})(?=\\s*\\()`, 'g')

let loading = null
/**
 * Load naga-wasm once (a dynamic import — the package itself keeps zero dependencies).
 * Only a failed import asks for the install; a failed wasm init (a bundler that did not
 * serve naga_bg.wasm) rejects with its own error.
 * @returns {Promise<object>} the initialized naga-wasm module
 */
export function load() {
	return loading ??= import('naga-wasm').catch((e) => {
		throw new Error(`color-space/gl: HLSL/MSL output needs naga-wasm, an optional peer dependency — install it with: npm i naga-wasm@${NAGA_WASM} (${e.message})`, { cause: e })
	}).then(async (naga) => { await naga.init?.(); return naga }).catch((e) => { loading = null; throw e })
}

/**
 * Write a composed source (the GLSL `glsl()` returns) as HLSL or MSL.
 * @param {object} naga an initialized naga-wasm module (`load()`, or your own import + `init()`)
 * @param {'hlsl'|'msl'} target output language
 * @param {string} src GLSL from `glsl()` (full registry or lean composer)
 * @returns {string} HLSL / MSL source; entry and edge functions keep their GLSL/WGSL names
 */
export function emit(naga, target, src) {
	if (target !== 'hlsl' && target !== 'msl') throw new Error(`color-space/gl: emit target is 'hlsl' or 'msl', not '${target}'`)
	const wgsl = translate(src).replace(HELPER, (name) => `colorspace_${name}`)
	const mod = naga.parseWgsl(wgsl)
	try {
		const info = naga.validate(mod)
		try {
			let out = target === 'hlsl' ? naga.writeHlsl(mod, info) : naga.writeMsl(mod, info)
			if (typeof out !== 'string') out = out.code   // naga-wasm's next major returns { code, reflection }
			for (const [, name] of wgsl.matchAll(/\bfn\s+(\w*?\d)_*\s*\(/g))   // naga's name: trailing _ stripped, then _ if it ends in a digit
				if (!new RegExp(`\\b${name}\\b`).test(out)) out = out.replace(new RegExp(`\\b${name}_\\b`, 'g'), name)
			return out
		} finally { info.free() }
	} finally { mod.free() }
}
