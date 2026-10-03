// GLSL chunk: GP-Log2 0-1 <-> linear-light Rec. 2020 (GoPro's clip-normalized linear).
// Single log-base-600 curve, sign-mirrored for negatives; mirrors gplog2.js enc/dec
// (ln 600 pre-evaluated in float64).
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'gplog2',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_gplog2', 'gplog2_rec2020linear'] },
	code: /* glsl */ `
float gplog2_enc_(float x) {
	return sign(x) * log(abs(x) * 599.0 + 1.0) / 6.396929655216146;
}
float gplog2_dec_(float y) {
	return sign(y) * (pow(600.0, abs(y)) - 1.0) / 599.0;
}
vec3 rec2020linear_gplog2(vec3 c) {
	return vec3(gplog2_enc_(c.x), gplog2_enc_(c.y), gplog2_enc_(c.z));
}
vec3 gplog2_rec2020linear(vec3 c) {
	return vec3(gplog2_dec_(c.x), gplog2_dec_(c.y), gplog2_dec_(c.z));
}`,
}
