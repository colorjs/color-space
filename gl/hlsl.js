/**
 * color-space/gl/hlsl — the conversion chunks as HLSL, for DirectX, Unity and Unreal.
 *
 *     import { hlsl } from 'color-space/gl/hlsl'
 *     const src = await hlsl('rgb', 'oklch')
 *     // → HLSL defining `float3 rgb_oklch(float3)` (plus the functions it calls)
 *
 * Written by naga from the verified WGSL (see ./naga.js), so it needs the optional peer
 * dependency: `npm i naga-wasm@30.2.0`. Async because naga loads on the first call.
 * One shader needing several conversions takes a pair list, like `glsl()` — each
 * function emitted once: `await hlsl([['oklch', 'rgb'], ['rgb', 'xyz']])`.
 */
import { glsl } from './index.js'
import { load, emit } from './naga.js'

/**
 * Compose the HLSL source converting `from` → `to` with entry
 * `float3 ${from}_${to}(float3)` (float…float4 by channel count; hyphens stripped).
 * @param {string|Array<[string,string]>} from source space name, or pair list
 * @param {string} [to] target space name
 * @returns {Promise<string>} self-contained HLSL source
 */
export const hlsl = async (from, to) => emit(await load(), 'hlsl', glsl(from, to))

export default hlsl
