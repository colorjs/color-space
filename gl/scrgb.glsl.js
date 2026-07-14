// GLSL chunk: scRGB (linear-light sRGB, HDR-extended range) <-> linear sRGB (lrgb).
// Identity: scrgb.js defines scrgb <-> lrgb as a pass-through; only the declared
// channel range differs (±0.5..7.4998779296875 vs lrgb's 0-1), which has no shader effect.
import lrgb from './lrgb.glsl.js'
export default {
	name: 'scrgb',
	deps: [lrgb],
	edges: { lrgb: ['lrgb_scrgb', 'scrgb_lrgb'] },
	code: /* glsl */ `
vec3 lrgb_scrgb(vec3 c) { return c; }
vec3 scrgb_lrgb(vec3 c) { return c; }`,
}
