// GLSL chunk: CIE XYZ 0-100 <-> ATD95 (Guth 1995 stage-2 A/T/D final responses).
// Baked to atd95.js's conditions (D65 white, Y_0=318.31 cd/m², k_1=0, k_2=50,
// σ=300): the adaptation gains G and the inverse cone matrix are precomputed
// constants. Analytic both ways, as atd95.js.
export default {
	name: 'atd95',
	edges: { xyz: ['xyz_atd95', 'atd95_xyz'] },
	code: /* glsl */ `
float atd95_ret_(float v) { return 18.0 * pow(318.31 * max(v, 0.0) / 100.0, 0.8); }
float atd95_fr_(float v) { return v / (200.0 + abs(v)); }
float atd95_frinv_(float y) { return 200.0 * y / (1.0 - abs(y)); }
vec3 xyz_atd95(vec3 c) {
	float xr = atd95_ret_(c.x); float yr = atd95_ret_(c.y); float zr = atd95_ret_(c.z);
	float L = (spow_((0.2435 * xr + 0.8524 * yr - 0.0516 * zr) * 0.66, 0.7) + 0.024) * 0.11756526084279342;
	float m = (spow_(-0.3954 * xr + 1.1642 * yr + 0.0837 * zr, 0.7) + 0.036) * 0.10055844778674315;
	float S = (spow_((0.04 * yr + 0.6225 * zr) * 0.43, 0.7) + 0.31) * 0.18980260287425693;
	float A1 = 3.57 * L + 2.64 * m;
	float T1 = 7.18 * L - 6.21 * m;
	float D1 = -0.7 * L + 0.085 * m + S;
	return vec3(atd95_fr_(0.09 * A1), atd95_fr_(0.43 * T1 + 0.76 * D1), atd95_fr_(D1));
}
vec3 atd95_xyz(vec3 c) {
	float A1 = atd95_frinv_(c.x) / 0.09;
	float D1 = atd95_frinv_(c.z);
	float T1 = (atd95_frinv_(c.y) - 0.76 * D1) / 0.43;
	float det = 3.57 * -6.21 - 2.64 * 7.18;
	float L = (-6.21 * A1 - 2.64 * T1) / det;
	float m = (-7.18 * A1 + 3.57 * T1) / det;
	float S = D1 + 0.7 * L - 0.085 * m;
	float u = spow_(L / 0.11756526084279342 - 0.024, 1.0 / 0.7) / 0.66;
	float v = spow_(m / 0.10055844778674315 - 0.036, 1.0 / 0.7);
	float w = spow_(S / 0.18980260287425693 - 0.31, 1.0 / 0.7) / 0.43;
	float xr = 1.8674917551765704 * u - 1.3790231603806402 * v + 0.3402197800658162 * w;
	float yr = 0.6372043675413509 * u + 0.3924108839057131 * v + 0.000056151618032972454 * w;
	float zr = -0.04094485895848038 * u - 0.02521515719876068 * v + 1.6064220946751464 * w;
	return vec3(
		pow(max(xr, 0.0) / 18.0, 1.25) * 100.0 / 318.31,
		pow(max(yr, 0.0) / 18.0, 1.25) * 100.0 / 318.31,
		pow(max(zr, 0.0) / 18.0, 1.25) * 100.0 / 318.31);
}`,
}
