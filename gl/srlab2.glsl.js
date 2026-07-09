// GLSL chunk: CIE XYZ D65 0-100 <-> SRLAB2 (L 0-100, a/b ±125), Behrens.
// CAT02-style M1/M2 matrices and their inverses (baked, same as srlab2.js's
// inv3(M1)/inv3(M2)); f/f^-1 use the shared CIE 1976 toe (cie.js eps/kappa-free
// form: srlab2.js's own 24389/2700 slope).
import xyz from './xyz.glsl.js'
export default {
	name: 'srlab2',
	deps: [xyz],
	edges: { xyz: ['xyz_srlab2', 'srlab2_xyz'] },
	code: /* glsl */ `
float srlab2_f_(float x) {
	if (x <= 216.0 / 24389.0) { return x * 24389.0 / 2700.0; }
	return 1.16 * cbrt_(x) - 0.16;
}
float srlab2_finv_(float v) {
	if (v <= 216.0 / 24389.0 * 24389.0 / 2700.0) { return v * 2700.0 / 24389.0; }
	float t = (v + 0.16) / 1.16;
	return t * t * t;
}
vec3 xyz_srlab2(vec3 c) {
	float xn = c.x / 95.0456; float yn = c.y / 100.0; float zn = c.z / 108.9058;
	float p1 = 0.320530 * xn + 0.636920 * yn + 0.042560 * zn;
	float p2 = 0.161987 * xn + 0.756636 * yn + 0.081376 * zn;
	float p3 = 0.017228 * xn + 0.108660 * yn + 0.874112 * zn;
	float fp1 = srlab2_f_(p1); float fp2 = srlab2_f_(p2); float fp3 = srlab2_f_(p3);
	return vec3(
		37.0950 * fp1 + 62.9054 * fp2 - 0.0008 * fp3,
		663.4684 * fp1 - 750.5078 * fp2 + 87.0328 * fp3,
		63.9569 * fp1 + 108.4576 * fp2 - 172.4152 * fp3);
}
vec3 srlab2_xyz(vec3 c) {
	float l = c.x; float a = c.y; float b = c.z;
	float q1 = 0.010000102867215928 * l + 0.0009041271715941017 * a + 0.0004563444476915107 * b;
	float q2 = 0.010000002927254975 * l - 0.0005331592745662989 * a - 0.0002691778016892686 * b;
	float q3 = 0.00999999940000239 * l - 2.4570194627157588e-11 * a - 0.005799999084407483 * b;
	float fq1 = srlab2_finv_(q1); float fq2 = srlab2_finv_(q2); float fq3 = srlab2_finv_(q3);
	float x = 5.435039931492935 * fq1 - 4.598577399185538 * fq2 + 0.16347851871588892 * fq3;
	float y = -1.167669384435469 * fq1 + 2.3275113697497165 * fq2 - 0.15982798110903337 * fq3;
	float z = 0.03803183959606753 * fq1 - 0.19869661325303367 * fq2 + 1.160664194641957 * fq3;
	return vec3(x * 95.0456, y * 100.0, z * 108.9058);
}`,
}
