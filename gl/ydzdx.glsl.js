// GLSL chunk: absolute XYZ D65 (cd/m²) <-> Y′D′zD′x, SMPTE ST 2085: X′Y′Z′ = ST 2084 PQ of
// absolute XYZ, D′z = (c1·Z′ − Y′)/2, D′x = (X′ − c2·Y′)/2, c1 = 0.986566, c2 = 0.991902.
// Mirrors ydzdx.js (PQ as transfers.js pqST2084Encode/Decode).
import xyzAbsD65 from './xyz-abs-d65.glsl.js'
export default {
	name: 'ydzdx',
	deps: [xyzAbsD65],
	edges: { 'xyz-abs-d65': ['xyzabsd65_ydzdx', 'ydzdx_xyzabsd65'] },
	code: /* glsl */ `
float ydzdx_pq_enc_(float absNits) {
	float x = absNits / 10000.0;
	if (x < 0.0) { x = 0.0; }
	float v = pow(x, 2610.0 / 16384.0);
	return pow((3424.0 / 4096.0 + 2413.0 / 128.0 * v) / (1.0 + 2392.0 / 128.0 * v), 2523.0 / 32.0);
}
float ydzdx_pq_dec_(float signal) {
	float vp = pow(signal, 32.0 / 2523.0);
	float num = vp - 3424.0 / 4096.0;
	if (num < 0.0) { num = 0.0; }
	return 10000.0 * pow(num / (2413.0 / 128.0 - 2392.0 / 128.0 * vp), 16384.0 / 2610.0);
}
vec3 xyzabsd65_ydzdx(vec3 c) {
	float x = ydzdx_pq_enc_(c.x); float y = ydzdx_pq_enc_(c.y); float z = ydzdx_pq_enc_(c.z);
	return vec3(y, (0.986566 * z - y) / 2.0, (x - 0.991902 * y) / 2.0);
}
vec3 ydzdx_xyzabsd65(vec3 c) {
	float y = c.x;
	return vec3(
		ydzdx_pq_dec_(2.0 * c.z + 0.991902 * y),
		ydzdx_pq_dec_(y),
		ydzdx_pq_dec_((2.0 * c.y + y) / 0.986566));
}`,
}
