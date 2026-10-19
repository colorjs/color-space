// GLSL chunk: Rec. 2020 display 0-1 <-> linear-light Rec. 2020 (rec2020-linear), BT.1886
// reference EOTF with zero black level: a pure 2.4 power, sign-extended – CSS Color 4's
// lin_2020 / gam_2020. Mirrors rec2020-display.js (transfers.js gammaEncode/gammaDecode(v, 2.4)).
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'rec2020-display',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_rec2020display', 'rec2020display_rec2020linear'] },
	code: /* glsl */ `
float rec2020display_dec_(float u) { return sign(u) * pow(abs(u), 2.4); }
float rec2020display_enc_(float u) { return sign(u) * pow(abs(u), 1.0 / 2.4); }
vec3 rec2020linear_rec2020display(vec3 c) {
	return vec3(rec2020display_enc_(c.x), rec2020display_enc_(c.y), rec2020display_enc_(c.z));
}
vec3 rec2020display_rec2020linear(vec3 c) {
	return vec3(rec2020display_dec_(c.x), rec2020display_dec_(c.y), rec2020display_dec_(c.z));
}`,
}
