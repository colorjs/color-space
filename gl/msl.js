/**
 * color-space/gl/msl — the conversion chunks as MSL, the Metal Shading Language.
 *
 *     import { msl } from 'color-space/gl/msl'
 *     const src = await msl('rgb', 'oklch')
 *     // → MSL defining `metal::float3 rgb_oklch(metal::float3)` (plus what it calls)
 *
 * Written by naga from the verified WGSL (see ./naga.js), so it needs the optional peer
 * dependency: `npm i naga-wasm@30.2.0`. Async because naga loads on the first call.
 * One shader needing several conversions takes a pair list, like `glsl()` — each
 * function emitted once: `await msl([['oklch', 'rgb'], ['rgb', 'xyz']])`.
 */
import { glsl } from './index.js'
import { load, emit } from './naga.js'

/**
 * Compose the MSL source converting `from` → `to` with entry
 * `metal::float3 ${from}_${to}(metal::float3)` (float…float4 by channel count; hyphens stripped).
 * @param {string|Array<[string,string]>} from source space name, or pair list
 * @param {string} [to] target space name
 * @returns {Promise<string>} self-contained MSL source
 */
export const msl = async (from, to) => emit(await load(), 'msl', glsl(from, to))

export default msl
