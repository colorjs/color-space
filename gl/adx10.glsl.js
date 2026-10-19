// GLSL chunk: ADX10 code/1023 <-> ACES2065-1 (AP0, linear). Mirrors adx10.js, the Academy's
// ACEScsc.Academy.ADX10_to_ACES.ctl: cdd = (code − 95)/500, CDD_TO_CID, the 11-point LUT_1D read
// by interpolate1D (held at −6 below −0.19) up to cid 0.6 and the line (100/55)·cid − REF_PT
// above, 10^logE, EXP_TO_ACES; back the same way, the table read from its log-exposure column.
// REF_PT = (7120 − 1520)/8000·(100/55) − log10(0.18) = 2.017454767623967. Inverse matrices
// printed from math.js inv3. adx16 reuses the density helpers (requires: ['adx10']).
import aces2065_1 from './aces2065-1.glsl.js'
export default {
	name: 'adx10',
	deps: [aces2065_1],
	edges: { 'aces2065-1': ['aces20651_adx10', 'adx10_aces20651'] },
	code: /* glsl */ `
float adx10_seg_(float p, float x0, float x1, float y0, float y1) {
	float s = (p - x0) / (x1 - x0);
	return y0 * (1.0 - s) + y1 * s;
}
float adx10_loge_(float d) {
	if (d > 0.6) { return 100.0 / 55.0 * d - 2.017454767623967; }
	if (d < -0.19) { return -6.0; }
	if (d < 0.01) { return adx10_seg_(d, -0.19, 0.01, -6.0, -2.721718645); }
	if (d < 0.028) { return adx10_seg_(d, 0.01, 0.028, -2.721718645, -2.521718645); }
	if (d < 0.054) { return adx10_seg_(d, 0.028, 0.054, -2.521718645, -2.321718645); }
	if (d < 0.095) { return adx10_seg_(d, 0.054, 0.095, -2.321718645, -2.121718645); }
	if (d < 0.145) { return adx10_seg_(d, 0.095, 0.145, -2.121718645, -1.921718645); }
	if (d < 0.22) { return adx10_seg_(d, 0.145, 0.22, -1.921718645, -1.721718645); }
	if (d < 0.3) { return adx10_seg_(d, 0.22, 0.3, -1.721718645, -1.521718645); }
	if (d < 0.4) { return adx10_seg_(d, 0.3, 0.4, -1.521718645, -1.321718645); }
	if (d < 0.5) { return adx10_seg_(d, 0.4, 0.5, -1.321718645, -1.121718645); }
	if (d < 0.6) { return adx10_seg_(d, 0.5, 0.6, -1.121718645, -0.926545676714876); }
	return -0.926545676714876;
}
float adx10_cid_(float e) {
	if (e <= 0.0) { return -0.19; }
	float l = log(e) / log(10.0);
	if (l > -0.926545676714876) { return (l + 2.017454767623967) * 55.0 / 100.0; }
	if (l < -6.0) { return -0.19; }
	if (l < -2.721718645) { return adx10_seg_(l, -6.0, -2.721718645, -0.19, 0.01); }
	if (l < -2.521718645) { return adx10_seg_(l, -2.721718645, -2.521718645, 0.01, 0.028); }
	if (l < -2.321718645) { return adx10_seg_(l, -2.521718645, -2.321718645, 0.028, 0.054); }
	if (l < -2.121718645) { return adx10_seg_(l, -2.321718645, -2.121718645, 0.054, 0.095); }
	if (l < -1.921718645) { return adx10_seg_(l, -2.121718645, -1.921718645, 0.095, 0.145); }
	if (l < -1.721718645) { return adx10_seg_(l, -1.921718645, -1.721718645, 0.145, 0.22); }
	if (l < -1.521718645) { return adx10_seg_(l, -1.721718645, -1.521718645, 0.22, 0.3); }
	if (l < -1.321718645) { return adx10_seg_(l, -1.521718645, -1.321718645, 0.3, 0.4); }
	if (l < -1.121718645) { return adx10_seg_(l, -1.321718645, -1.121718645, 0.4, 0.5); }
	if (l < -0.926545676714876) { return adx10_seg_(l, -1.121718645, -0.926545676714876, 0.5, 0.6); }
	return 0.6;
}
vec3 adx10_aces_(float r, float g, float b) {
	float e0 = pow(10.0, adx10_loge_(0.75573 * r + 0.22197 * g + 0.0223 * b));
	float e1 = pow(10.0, adx10_loge_(0.05901 * r + 0.96928 * g - 0.02829 * b));
	float e2 = pow(10.0, adx10_loge_(0.16134 * r + 0.07406 * g + 0.7646 * b));
	return vec3(
		0.72286 * e0 + 0.1263 * e1 + 0.15084 * e2,
		0.11923 * e0 + 0.76418 * e1 + 0.11659 * e2,
		0.01427 * e0 + 0.08213 * e1 + 0.90359 * e2);
}
vec3 adx10_cdd_(vec3 c) {
	float d0 = adx10_cid_(1.4225979781010893 * c.x - 0.21254450579001996 * c.y - 0.21005557286679785 * c.z);
	float d1 = adx10_cid_(-0.2216040425778405 * c.x + 1.3601031659132479 * c.y - 0.13850050834049085 * c.z);
	float d2 = adx10_cid_(-0.0023242102398040093 * c.x - 0.1202672261964292 * c.y + 1.1226026624628578 * c.z);
	return vec3(
		1.35808648696218 * d0 - 0.30711397453874584 * d1 - 0.05097251242343413 * d2,
		-0.09078806402880728 * d0 + 1.0493157688059929 * d1 + 0.04147229522281447 * d2,
		-0.2777791129799957 * d0 - 0.036833059358737354 * d1 + 1.3146121723387332 * d2);
}
vec3 adx10_aces20651(vec3 c) {
	return adx10_aces_((c.x * 1023.0 - 95.0) / 500.0, (c.y * 1023.0 - 95.0) / 500.0, (c.z * 1023.0 - 95.0) / 500.0);
}
vec3 aces20651_adx10(vec3 c) {
	vec3 d = adx10_cdd_(c);
	return vec3((d.x * 500.0 + 95.0) / 1023.0, (d.y * 500.0 + 95.0) / 1023.0, (d.z * 500.0 + 95.0) / 1023.0);
}`,
}
