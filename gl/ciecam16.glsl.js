// GLSL chunk: CIE XYZ D65 0-100 <-> CIECAM16 (J, M, h), CIE 248:2022. Baked to ciecam16.js's
// viewing conditions (D65 [95.05,100,108.88], La = 318.31, Yb = 20, average surround – the CIE
// reference conditions of ciecam02 and hellwig2022, not cam16.js's Material Design ones):
// FL, Aw, Nbb = Ncb, D_RGB, the c·z exponents and the f_e line constants (f(q_L), f(q_U) and
// the slope f'(q_U)) are consts computed once and pasted here. Mirrors ciecam16.js exactly:
// CAT16 / CAT16⁻¹, the CIE 248 f_e compression (linear below q_L = 0.26 through zero, tangent
// above q_U = 150, CAM16's 0.42 hyperbola between) and its inverse, CAM16's M1 matrix and
// closed-form r for the inverse, and the same zero-denominator guards (chroma signal t, alpha
// and r). The middle branch of f_e only sees q >= 0.26 and its inverse only f(q_L)..f(q_U), so
// pow() always has a positive base; black and white stay finite in float32.
import xyz from './xyz.glsl.js'
export default {
	name: 'ciecam16',
	deps: [xyz],
	edges: { xyz: ['xyz_ciecam16', 'ciecam16_xyz'] },
	code: /* glsl */ `
const float CIECAM16_FL_ = 1.1675444641471802;
const float CIECAM16_FLROOT_ = 1.03948531235718;
const float CIECAM16_AW_ = 46.18823696694178;
const float CIECAM16_NBB_ = 1.0003040045593807;
const float CIECAM16_DRGB0_ = 1.0249069085488132;
const float CIECAM16_DRGB1_ = 0.9838960164386467;
const float CIECAM16_DRGB2_ = 0.9223114999141022;
const float CIECAM16_DRGBINV0_ = 0.9756983699289534;
const float CIECAM16_DRGBINV1_ = 1.0163675665845706;
const float CIECAM16_DRGBINV2_ = 1.0842323879655986;
const float CIECAM16_C_Z_ = 1.3297773808949709;
const float CIECAM16_INV_C_Z_ = 0.7520055720356568;
const float CIECAM16_T_PREFACTOR_ = 3847.323094459157;
const float CIECAM16_POW1_073_ = 0.8952178848134279;
const float CIECAM16_FQL_ = 1.2875191081556234;
const float CIECAM16_FQU_ = 17.82484749298214;
const float CIECAM16_DFQU_ = 0.047685496663313495;

float ciecam16_fe_(float q) {
	if (q < 0.26) { return CIECAM16_FQL_ * q / 0.26; }
	if (q > 150.0) { return CIECAM16_FQU_ + CIECAM16_DFQU_ * (q - 150.0); }
	float x = pow(CIECAM16_FL_ * q / 100.0, 0.42);
	return 400.0 * x / (x + 27.13);
}
float ciecam16_feinv_(float y) {
	if (y < CIECAM16_FQL_) { return 0.26 * y / CIECAM16_FQL_; }
	if (y > CIECAM16_FQU_) { return 150.0 + (y - CIECAM16_FQU_) / CIECAM16_DFQU_; }
	return 100.0 / CIECAM16_FL_ * pow(27.13 * y / (400.0 - y), 2.380952380952381);
}
vec3 xyz_ciecam16(vec3 c) {
	float x = c.x; float y = c.y; float z = c.z;
	float ra = ciecam16_fe_((0.401288 * x + 0.650173 * y - 0.051461 * z) * CIECAM16_DRGB0_);
	float ga = ciecam16_fe_((-0.250268 * x + 1.204414 * y + 0.045854 * z) * CIECAM16_DRGB1_);
	float ba = ciecam16_fe_((-0.002079 * x + 0.048952 * y + 0.953127 * z) * CIECAM16_DRGB2_);
	float a = ra - 12.0 * ga / 11.0 + ba / 11.0;
	float b = (ra + ga - 2.0 * ba) / 9.0;
	float hRad = atan2_(b, a);
	float et = 0.25 * (cos(hRad + 2.0) + 3.8);
	float J = 100.0 * spow_(CIECAM16_NBB_ * (2.0 * ra + ga + 0.05 * ba) / CIECAM16_AW_, CIECAM16_C_Z_);
	float den = ra + ga + 1.05 * ba + 0.305;
	float t = 0.0;
	if (den != 0.0) { t = CIECAM16_T_PREFACTOR_ * et * sqrt(a * a + b * b) / den; }
	float C = spow_(t, 0.9) * spow_(J / 100.0, 0.5) * CIECAM16_POW1_073_;
	float h = hRad * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	return vec3(J, C * CIECAM16_FLROOT_, h);
}
vec3 ciecam16_xyz(vec3 c) {
	float J = c.x; float M = c.y; float h = c.z;
	float hRad = h * 0.017453292519943295;
	float cosh = cos(hRad);
	float sinh = sin(hRad);
	float Jroot = spow_(J / 100.0, 0.5);
	float alpha = 0.0;
	if (Jroot != 0.0) { alpha = M / CIECAM16_FLROOT_ / Jroot; }
	float t = spow_(alpha / CIECAM16_POW1_073_, 1.0 / 0.9);
	float et = 0.25 * (cos(hRad + 2.0) + 3.8);
	float p2 = CIECAM16_AW_ * spow_(J / 100.0, CIECAM16_INV_C_Z_) / CIECAM16_NBB_;
	float den = 23.0 * CIECAM16_T_PREFACTOR_ * et + t * (11.0 * cosh + 108.0 * sinh);
	float r = 0.0;
	if (den != 0.0) { r = 23.0 * (p2 + 0.305) * t / den; }
	float aa = r * cosh;
	float bb = r * sinh;
	float g0 = ciecam16_feinv_((p2 * 460.0 + aa * 451.0 + bb * 288.0) / 1403.0) * CIECAM16_DRGBINV0_;
	float g1 = ciecam16_feinv_((p2 * 460.0 - aa * 891.0 - bb * 261.0) / 1403.0) * CIECAM16_DRGBINV1_;
	float g2 = ciecam16_feinv_((p2 * 460.0 - aa * 220.0 - bb * 6300.0) / 1403.0) * CIECAM16_DRGBINV2_;
	return vec3(
		1.8620678550872327 * g0 - 1.0112546305316843 * g1 + 0.14918677544445175 * g2,
		0.38752654323613717 * g0 + 0.6214474419314753 * g1 - 0.008973985167612518 * g2,
		-0.015841498849333856 * g0 - 0.03412293802851557 * g1 + 1.0499644368778496 * g2);
}`,
}
