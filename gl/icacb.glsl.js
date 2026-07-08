// GLSL chunk: CIE XYZ D65 0-100 <-> ICaCb (Fröhlich 2017). Mirrors icacb.js:
// XYZ ×2.03 (media white 203 cd/m², BT.2100 — XYZ-100 → absolute nits) -> M1 ->
// ST 2084 (PQ) encode per channel -> M2, and its exact inverse.
// Private helpers icacb_pq_encode_/icacb_pq_decode_ duplicate transfers.js'
// pqST2084Encode/Decode (chunks can't import — self-contained per chunk).
export default {
	name: 'icacb',
	edges: { xyz: ['xyz_icacb', 'icacb_xyz'] },
	code: /* glsl */ `
float icacb_pq_encode_(float v) {
	float m1 = 2610.0 / 16384.0;
	float m2 = 2523.0 / 32.0;
	float c1 = 3424.0 / 4096.0;
	float c2 = 2413.0 / 128.0;
	float c3 = 2392.0 / 128.0;
	float t = pow(max(v / 10000.0, 0.0), m1);
	return pow((c1 + c2 * t) / (1.0 + c3 * t), m2);
}
float icacb_pq_decode_(float signal) {
	float m1 = 2610.0 / 16384.0;
	float m2 = 2523.0 / 32.0;
	float c1 = 3424.0 / 4096.0;
	float c2 = 2413.0 / 128.0;
	float c3 = 2392.0 / 128.0;
	float vp = pow(signal, 1.0 / m2);
	return 10000.0 * pow(max(vp - c1, 0.0) / (c2 - c3 * vp), 1.0 / m1);
}
vec3 xyz_icacb(vec3 c) {
	float x = c.x * 2.03; float y = c.y * 2.03; float z = c.z * 2.03;
	float l = 0.37613 * x + 0.70431 * y - 0.05675 * z;
	float m = -0.21649 * x + 1.14744 * y + 0.05356 * z;
	float s = 0.02567 * x + 0.16713 * y + 0.74235 * z;
	float lp = icacb_pq_encode_(l); float mp = icacb_pq_encode_(m); float sp = icacb_pq_encode_(s);
	return vec3(
		0.4949 * lp + 0.5037 * mp + 0.0015 * sp,
		4.2854 * lp - 4.5462 * mp + 0.2609 * sp,
		0.3605 * lp + 1.1499 * mp - 1.5105 * sp);
}
vec3 icacb_xyz(vec3 c) {
	float I = c.x; float a = c.y; float b = c.z;
	float lp = 0.9998905049616943 * I + 0.11610737965679684 * a + 0.02104750156233091 * b;
	float mp = 0.9999095312780033 * I - 0.11390319857447986 * a - 0.018680887263266995 * b;
	float sp = 0.9998387931514509 * I - 0.059000713455490995 * a - 0.6712304057933204 * b;
	float l = icacb_pq_decode_(lp); float m = icacb_pq_decode_(mp); float s = icacb_pq_decode_(sp);
	return vec3(
		(1.938009763032372 * l - 1.2240118236920854 * m + 0.2364654507025463 * s) / 2.03,
		(0.3726932255022944 * l + 0.6453747900837897 * m - 0.01807224787449664 * s) / 2.03,
		(-0.15092197668921595 * l - 0.10297178575136791 * m + 1.3429653757226785 * s) / 2.03);
}`,
}
