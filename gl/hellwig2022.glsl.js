// GLSL chunk: CIE XYZ D65 0-100 <-> Hellwig2022 (J, M, h), the CIE-recommended CAM16
// refinement (CIECAM16, CIE 248:2022). Baked to hellwig2022.js's own viewing
// conditions (D65 [95.05,100,108.88], La = 318.31, Yb = 20, average surround — the
// canonical CIECAM reference conditions, not cam16.js's Material-Design ones), reusing
// CAM16's CAT16/CAT16⁻¹ and M1 matrices. Mirrors hellwig2022.js exactly: the
// achromatic response drops the nbb scaling CAM16 applies (2Ra+Ga+0.05Ba, no Nbb
// factor — the CAM16→Hellwig simplification), J/A use the sign-preserving spow
// directly on the exponent c·z (no Jroot-square roundtrip), and M is 43·Nc·ecc(h)·|a,b|
// with no FL^0.25 chroma scaling. No zdiv guards — hellwig2022.js divides by
// 43·ecc(h) unguarded, so this chunk does too (matches for all h; ecc(h) has no real root).
export default {
	name: 'hellwig2022',
	edges: { xyz: ['xyz_hellwig2022', 'hellwig2022_xyz'] },
	code: /* glsl */ `
const float HELLWIG2022_FL_ = 1.1675444641471802;
const float HELLWIG2022_AW_ = 46.17419979967692;
const float HELLWIG2022_DRGB0_ = 1.0249069085488132;
const float HELLWIG2022_DRGB1_ = 0.9838960164386467;
const float HELLWIG2022_DRGB2_ = 0.9223114999141022;
const float HELLWIG2022_DRGBINV0_ = 0.9756983699289534;
const float HELLWIG2022_DRGBINV1_ = 1.0163675665845706;
const float HELLWIG2022_DRGBINV2_ = 1.0842323879655986;
const float HELLWIG2022_C_Z_ = 1.3297773808949709;
const float HELLWIG2022_INV_C_Z_ = 0.7520055720356568;
const float HELLWIG2022_UNADAPT_CONST_ = 221667.62615817983;

float hellwig2022_adapt_(float v) {
	float x = pow(HELLWIG2022_FL_ * abs(v) * 0.01, 0.42);
	return sign(v) * 400.0 * x / (x + 27.13);
}
float hellwig2022_unadapt_(float v) {
	float a = abs(v);
	float ratio = a / (400.0 - a);
	return sign(v) * HELLWIG2022_UNADAPT_CONST_ * pow(abs(ratio), 2.380952380952381);
}
float hellwig2022_ecc_(float h) {
	return -0.0582 * cos(h) - 0.0258 * cos(2.0 * h) - 0.1347 * cos(3.0 * h) + 0.0289 * cos(4.0 * h)
		- 0.1475 * sin(h) - 0.0308 * sin(2.0 * h) + 0.0385 * sin(3.0 * h) + 0.0096 * sin(4.0 * h) + 1.0;
}
vec3 xyz_hellwig2022(vec3 c) {
	float x = c.x; float y = c.y; float z = c.z;
	float rc0 = (0.401288 * x + 0.650173 * y - 0.051461 * z) * HELLWIG2022_DRGB0_;
	float rc1 = (-0.250268 * x + 1.204414 * y + 0.045854 * z) * HELLWIG2022_DRGB1_;
	float rc2 = (-0.002079 * x + 0.048952 * y + 0.953127 * z) * HELLWIG2022_DRGB2_;
	float ra0 = hellwig2022_adapt_(rc0);
	float ra1 = hellwig2022_adapt_(rc1);
	float ra2 = hellwig2022_adapt_(rc2);
	float a = ra0 - 12.0 * ra1 / 11.0 + ra2 / 11.0;
	float b = (ra0 + ra1 - 2.0 * ra2) / 9.0;
	float hRad = atan2_(b, a);
	float A = 2.0 * ra0 + ra1 + 0.05 * ra2;
	float J = 100.0 * spow_(A / HELLWIG2022_AW_, HELLWIG2022_C_Z_);
	float M = 43.0 * hellwig2022_ecc_(hRad) * sqrt(a * a + b * b);
	float h = hRad * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	return vec3(J, M, h);
}
vec3 hellwig2022_xyz(vec3 c) {
	float J = c.x; float M = c.y; float h = c.z;
	float hRad = h * 0.017453292519943295;
	float A = HELLWIG2022_AW_ * spow_(J / 100.0, HELLWIG2022_INV_C_Z_);
	float ecc = hellwig2022_ecc_(hRad);
	float r = M / (43.0 * ecc);
	float aa = r * cos(hRad);
	float bb = r * sin(hRad);
	float rc0 = (A * 460.0 + aa * 451.0 + bb * 288.0) / 1403.0;
	float rc1 = (A * 460.0 - aa * 891.0 - bb * 261.0) / 1403.0;
	float rc2 = (A * 460.0 - aa * 220.0 - bb * 6300.0) / 1403.0;
	float u0 = hellwig2022_unadapt_(rc0);
	float u1 = hellwig2022_unadapt_(rc1);
	float u2 = hellwig2022_unadapt_(rc2);
	float g0 = u0 * HELLWIG2022_DRGBINV0_;
	float g1 = u1 * HELLWIG2022_DRGBINV1_;
	float g2 = u2 * HELLWIG2022_DRGBINV2_;
	return vec3(
		1.8620678550872327 * g0 - 1.0112546305316843 * g1 + 0.14918677544445175 * g2,
		0.38752654323613717 * g0 + 0.6214474419314753 * g1 - 0.008973985167612518 * g2,
		-0.015841498849333856 * g0 - 0.03412293802851557 * g1 + 1.0499644368778496 * g2);
}`,
}
