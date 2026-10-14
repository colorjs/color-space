// GLSL chunk: Rec. 2020 Linear 0-1 <-> IPT-PQ-C2 (SMPTE ST 2128). Mirrors iptpqc2.js:
// BT.2100 RGB -> LMS (Formula 2, /4096), ST 2084 PQ at media white 203 cd/m² (as
// ictcp), LMS2IPT (Formula 1, /4096). Inverses printed from iptpqc2.js (inv3).
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'iptpqc2',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_iptpqc2', 'iptpqc2_rec2020linear'] },
	code: /* glsl */ `
float iptpqc2_pq_enc_(float absNits) {
	float x = absNits / 10000.0;
	if (x < 0.0) { x = 0.0; }
	float v = pow(x, 2610.0 / 16384.0);
	return pow((3424.0 / 4096.0 + 2413.0 / 128.0 * v) / (1.0 + 2392.0 / 128.0 * v), 2523.0 / 32.0);
}
float iptpqc2_pq_dec_(float signal) {
	float vp = pow(signal, 32.0 / 2523.0);
	float num = vp - 3424.0 / 4096.0;
	if (num < 0.0) { num = 0.0; }
	return 10000.0 * pow(num / (2413.0 / 128.0 - 2392.0 / 128.0 * vp), 16384.0 / 2610.0);
}
vec3 rec2020linear_iptpqc2(vec3 c) {
	float l = iptpqc2_pq_enc_((1747.0 * c.x + 2169.0 * c.y + 180.0 * c.z) / 4096.0 * 203.0);
	float m = iptpqc2_pq_enc_((673.0 * c.x + 3029.0 * c.y + 394.0 * c.z) / 4096.0 * 203.0);
	float s = iptpqc2_pq_enc_((50.0 * c.x + 207.0 * c.y + 3839.0 * c.z) / 4096.0 * 203.0);
	return vec3(
		(1638.0 * l + 1638.0 * m + 820.0 * s) / 4096.0,
		(18248.0 * l - 19870.0 * m + 1622.0 * s) / 4096.0,
		(3300.0 * l + 1463.0 * m - 4763.0 * s) / 4096.0);
}
vec3 iptpqc2_rec2020linear(vec3 c) {
	float l = iptpqc2_pq_dec_(c.x + 0.0975578875686935 * c.y + 0.20538292958984272 * c.z) / 203.0;
	float m = iptpqc2_pq_dec_(c.x - 0.11388362209560723 * c.y + 0.13337828363655785 * c.z) / 203.0;
	float s = iptpqc2_pq_dec_(c.x + 0.032611650189127685 * c.y - 0.6766961795912734 * c.z) / 203.0;
	return vec3(
		3.2374662424353895 * l - 2.324205800020636 * m + 0.08673955758524626 * s,
		-0.7188754693535147 * l + 1.877899954242238 * m - 0.1590244848887234 * s,
		-0.003403513926958051 * l - 0.07098593397424108 * m + 1.074389447901199 * s);
}`,
}
