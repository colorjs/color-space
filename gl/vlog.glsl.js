// GLSL chunk: V-Log (Panasonic) <-> CIE XYZ D65 0-100. V-Gamut primaries.
// Mirrors vlog.js decode/encode + M/MI; same decomposition/constants as wasm/batch.js xyz_vlog.
import xyz from './xyz.glsl.js'
export default {
	name: 'vlog',
	deps: [xyz],
	edges: { xyz: ['xyz_vlog', 'vlog_xyz'] },
	code: /* glsl */ `
float vlog_log10_(float x) { return log(x) / log(10.0); }
float vlog_dec_(float v) {
	if (v < 0.181) { return (v - 0.125) / 5.6; }
	return pow(10.0, (v - 0.598206) / 0.241514) - 0.00873;
}
float vlog_enc_(float l) {
	if (l < 0.01) { return 5.6 * l + 0.125; }
	return 0.241514 * vlog_log10_(l + 0.00873) + 0.598206;
}
vec3 vlog_xyz(vec3 c) {
	float r = vlog_dec_(c.x); float g = vlog_dec_(c.y); float b = vlog_dec_(c.z);
	return vec3(
		100.0 * (0.6796444698784739 * r + 0.1522114124397545 * g + 0.1186000447334430 * b),
		100.0 * (0.2606855500903736 * r + 0.7748944633296593 * g - 0.0355800134200329 * b),
		100.0 * (-0.0093101982175133 * r - 0.0046124670436289 * g + 1.1029804160210204 * b));
}
vec3 xyz_vlog(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.5890117738723923 * x - 0.31320448446022 * y - 0.18096485152800618 * z;
	float g = -0.5340529104491584 * x + 1.3960114333501836 * y + 0.10245767101658204 * z;
	float b = 0.011179448842977967 * x + 0.003194128240850844 * y + 0.9055353562812193 * z;
	return vec3(vlog_enc_(r), vlog_enc_(g), vlog_enc_(b));
}`,
}
