// GLSL chunk: F-Log 0-1 <-> linear-light Rec. 2020 (F-Gamut primaries match BT.2020).
// Linear toe + log10 highlight; mirrors flog.js enc/dec exactly.
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'flog',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_flog', 'flog_rec2020linear'] },
	code: /* glsl */ `
float flog_enc_(float x) {
	if (x < 0.00089) { return 8.735631 * x + 0.092864; }
	return 0.344676 * (log(0.555556 * x + 0.009468) / 2.302585092994046) + 0.790453;
}
float flog_dec_(float y) {
	if (y < 0.100537775223865) { return (y - 0.092864) / 8.735631; }
	return (pow(10.0, (y - 0.790453) / 0.344676) - 0.009468) / 0.555556;
}
vec3 rec2020linear_flog(vec3 c) {
	return vec3(flog_enc_(c.x), flog_enc_(c.y), flog_enc_(c.z));
}
vec3 flog_rec2020linear(vec3 c) {
	return vec3(flog_dec_(c.x), flog_dec_(c.y), flog_dec_(c.z));
}`,
}
