// GLSL chunk: Insta360 I-Log (10-bit container curve, white paper 2026.05.20) 0-1 <->
// scene-linear Rec. 2020. log10 curve over a linear toe that runs on below 0; mirrors
// ilog.js enc/dec (ln 10 pre-evaluated in float64).
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'ilog',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_ilog', 'ilog_rec2020linear'] },
	code: /* glsl */ `
float ilog_enc_(float x) {
	if (x > 0.01104854) { return 0.623992 + 0.280055 * (log(x + 0.01) / 2.302585092994046); }
	return 5.77837328 * x + 0.09055934;
}
float ilog_dec_(float y) {
	if (y < 0.154402) { return (y - 0.09055934) / 5.77837328; }
	return pow(10.0, (y - 0.623992) / 0.280055) - 0.01;
}
vec3 rec2020linear_ilog(vec3 c) {
	return vec3(ilog_enc_(c.x), ilog_enc_(c.y), ilog_enc_(c.z));
}
vec3 ilog_rec2020linear(vec3 c) {
	return vec3(ilog_dec_(c.x), ilog_dec_(c.y), ilog_dec_(c.z));
}`,
}
