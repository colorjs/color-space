// GLSL chunk: Samsung Log 0-1 <-> scene-linear Rec. 2020 (BT.2020 container).
// Two log10 segments (the mirrored toe below xt), 0 below x0 on encode and x0 below
// code 0 on decode; mirrors samsunglog.js enc/dec (ln 10 pre-evaluated in float64).
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'samsunglog',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_samsunglog', 'samsunglog_rec2020linear'] },
	code: /* glsl */ `
float samsunglog_enc_(float x) {
	if (x >= 0.01) { return 0.258984868 * (log(x + 0.0003645) / 2.302585092994046) + 0.720504856; }
	if (x >= -0.05) { return -0.20942 * (log(0.016904 - x) / 2.302585092994046) - 0.24597; }
	return 0.0;
}
float samsunglog_dec_(float y) {
	if (y >= 0.206561909) { return pow(10.0, (y - 0.720504856) / 0.258984868) - 0.0003645; }
	if (y >= 0.0) { return 0.016904 - pow(10.0, (y + 0.24597) / -0.20942); }
	return -0.05;
}
vec3 rec2020linear_samsunglog(vec3 c) {
	return vec3(samsunglog_enc_(c.x), samsunglog_enc_(c.y), samsunglog_enc_(c.z));
}
vec3 samsunglog_rec2020linear(vec3 c) {
	return vec3(samsunglog_dec_(c.x), samsunglog_dec_(c.y), samsunglog_dec_(c.z));
}`,
}
