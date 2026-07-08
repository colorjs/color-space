// GLSL chunk: Rec. 2020 Linear 0-1 <-> Rec. 2100 PQ signal 0-1 — SMPTE ST 2084 (PQ),
// normalizing absolute nits by media white Yw=203 cd/m². Mirrors rec2100-pq.js
// (toLinear/fromLinear) and transfers.js pqST2084Encode/Decode.
export default {
	name: 'rec2100-pq',
	edges: { 'rec2020-linear': ['rec2020linear_rec2100pq', 'rec2100pq_rec2020linear'] },
	code: /* glsl */ `
float rec2100pq_enc_(float absNits) {
	float x = absNits / 10000.0;
	if (x < 0.0) { x = 0.0; }
	float v = pow(x, 2610.0 / 16384.0);
	return pow((3424.0 / 4096.0 + 2413.0 / 128.0 * v) / (1.0 + 2392.0 / 128.0 * v), 2523.0 / 32.0);
}
float rec2100pq_dec_(float signal) {
	float vp = pow(signal, 32.0 / 2523.0);
	float num = vp - 3424.0 / 4096.0;
	if (num < 0.0) { num = 0.0; }
	return 10000.0 * pow(num / (2413.0 / 128.0 - 2392.0 / 128.0 * vp), 16384.0 / 2610.0);
}
vec3 rec2020linear_rec2100pq(vec3 c) {
	return vec3(rec2100pq_enc_(c.x * 203.0), rec2100pq_enc_(c.y * 203.0), rec2100pq_enc_(c.z * 203.0));
}
vec3 rec2100pq_rec2020linear(vec3 c) {
	return vec3(rec2100pq_dec_(c.x) / 203.0, rec2100pq_dec_(c.y) / 203.0, rec2100pq_dec_(c.z) / 203.0);
}`,
}
