/**
 * color-space/gl/wgsl — the same conversion chunks as WGSL, for WebGPU.
 *
 *     import { wgsl } from 'color-space/gl/wgsl.js'
 *     const src = wgsl('rgb', 'oklch')
 *     // → self-contained WGSL defining `fn rgb_oklch(c: vec3f) -> vec3f`
 *
 * This is the full-registry convenience (any space by name). For lean bundles,
 * compose from imported chunks and translate: see ./compose.js + ./translate.js.
 */
import { glsl } from './index.js'
import { translate } from './translate.js'

export { translate }

/**
 * Compose the WGSL source converting `from` → `to` with entry
 * `fn ${from}_${to}(c: vec3f) -> vec3f` (hyphens stripped).
 * @param {string} from source space name
 * @param {string} to target space name
 * @returns {string} self-contained WGSL source
 */
export const wgsl = (from, to) => translate(glsl(from, to))

export default wgsl
