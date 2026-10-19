// GLSL chunk: Rec. 709 display 0-1 <-> linear-light sRGB (lrgb), BT.1886 reference EOTF with
// zero black level: a pure 2.4 power, sign-extended. Mirrors rec709-display.js
// (transfers.js gammaEncode/gammaDecode(v, 2.4)).
import lrgb from './lrgb.glsl.js'
export default {
	name: 'rec709-display',
	deps: [lrgb],
	edges: { lrgb: ['lrgb_rec709display', 'rec709display_lrgb'] },
	code: /* glsl */ `
float rec709display_dec_(float u) { return sign(u) * pow(abs(u), 2.4); }
float rec709display_enc_(float u) { return sign(u) * pow(abs(u), 1.0 / 2.4); }
vec3 lrgb_rec709display(vec3 c) {
	return vec3(rec709display_enc_(c.x), rec709display_enc_(c.y), rec709display_enc_(c.z));
}
vec3 rec709display_lrgb(vec3 c) {
	return vec3(rec709display_dec_(c.x), rec709display_dec_(c.y), rec709display_dec_(c.z));
}`,
}
