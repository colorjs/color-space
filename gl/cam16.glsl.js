// GLSL chunk: CIE XYZ D65 0-100 <-> CAM16 (J, M, h), Li et al. 2017. Baked to the
// library's default viewing conditions (cam16.js viewingConditions: white
// [0.95047,1,1.08883]*100, La = 64/π·0.2, Yb 20, average surround, no discounting)
// — every condition-derived scalar (FL, Aw, Nbb, dRgb, the c/z exponents) is a fixed
// const computed once from environment() and pasted here. Mirrors cam16.js's
// toCam16/fromCam16 exactly: CAT16 forward/inverse, the 0.42-exponent adapt/unadapt
// compression, the M1 (post-adaptation) matrix, and the same zdiv guards (JS returns
// 0 instead of dividing by an exact-zero denominator) at the two spots the scalar
// library uses them (chroma-signal t, and alpha/r in the inverse).
export default {
	name: 'cam16',
	edges: { xyz: ['xyz_cam16', 'cam16_xyz'] },
	code: /* glsl */ `
const float CAM16_FL_ = 0.2731305366732074;
const float CAM16_FLROOT_ = 0.7229238694926879;
const float CAM16_AW_ = 25.51850208110783;
const float CAM16_NBB_ = 1.0003040045593807;
const float CAM16_DRGB0_ = 1.0208410446152913;
const float CAM16_DRGB1_ = 0.9865253929974012;
const float CAM16_DRGB2_ = 0.9350103262350229;
const float CAM16_DRGBINV0_ = 0.9795844370431389;
const float CAM16_DRGBINV1_ = 1.013658651970081;
const float CAM16_DRGBINV2_ = 1.0695069048345904;
const float CAM16_POW1_073_ = 0.8952178848134279;
const float CAM16_POW1_NEG073_ = 1.1170464944502418;
const float CAM16_HALF_C_Z_ = 0.6648886904474854;
const float CAM16_2_C_Z_ = 1.5040111440713138;
const float CAM16_T_PREFACTOR_ = 3847.323094459157;
const float CAM16_UNADAPT_CONST_ = 947557.2118517241;

float cam16_adapt_(float v) {
	float x = pow(CAM16_FL_ * abs(v) * 0.01, 0.42);
	return sign(v) * 400.0 * x / (x + 27.13);
}
float cam16_unadapt_(float v) {
	float a = abs(v);
	float ratio = a / (400.0 - a);
	return sign(v) * CAM16_UNADAPT_CONST_ * pow(abs(ratio), 2.380952380952381);
}
vec3 xyz_cam16(vec3 c) {
	float x = c.x; float y = c.y; float z = c.z;
	float rc0 = (0.401288 * x + 0.650173 * y - 0.051461 * z) * CAM16_DRGB0_;
	float rc1 = (-0.250268 * x + 1.204414 * y + 0.045854 * z) * CAM16_DRGB1_;
	float rc2 = (-0.002079 * x + 0.048952 * y + 0.953127 * z) * CAM16_DRGB2_;
	float ra0 = cam16_adapt_(rc0);
	float ra1 = cam16_adapt_(rc1);
	float ra2 = cam16_adapt_(rc2);
	float a = ra0 + (-12.0 * ra1 + ra2) / 11.0;
	float b = (ra0 + ra1 - 2.0 * ra2) / 9.0;
	float hRad = atan2_(b, a);
	if (hRad < 0.0) { hRad = hRad + 6.283185307179586; }
	float et = 0.25 * (cos(hRad + 2.0) + 3.8);
	float denom = ra0 + ra1 + 1.05 * ra2 + 0.305;
	float t = 0.0;
	if (denom != 0.0) { t = CAM16_T_PREFACTOR_ * et * sqrt(a * a + b * b) / denom; }
	float alpha = spow_(t, 0.9) * CAM16_POW1_073_;
	float A = CAM16_NBB_ * (2.0 * ra0 + ra1 + 0.05 * ra2);
	float Jroot = spow_(A / CAM16_AW_, CAM16_HALF_C_Z_);
	float J = 100.0 * spow_(Jroot, 2.0);
	float C = alpha * Jroot;
	float M = C * CAM16_FLROOT_;
	float h = hRad * 57.29577951308232;
	return vec3(J, M, h);
}
vec3 cam16_xyz(vec3 c) {
	float J = c.x; float M = c.y; float h = c.z;
	float hh = mod_(h, 360.0);
	float hRad = hh * 0.017453292519943295;
	float cosh = cos(hRad);
	float sinh = sin(hRad);
	float Jroot = spow_(J, 0.5) * 0.1;
	float mFlRoot = M / CAM16_FLROOT_;
	float alpha = 0.0;
	if (Jroot != 0.0) { alpha = mFlRoot / Jroot; }
	float t = spow_(alpha * CAM16_POW1_NEG073_, 10.0 / 9.0);
	float et = 0.25 * (cos(hRad + 2.0) + 3.8);
	float A = CAM16_AW_ * spow_(Jroot, CAM16_2_C_Z_);
	float p1 = CAM16_T_PREFACTOR_ * et;
	float p2 = A / CAM16_NBB_;
	float denom = 23.0 * p1 + t * (11.0 * cosh + 108.0 * sinh);
	float r = 0.0;
	if (denom != 0.0) { r = 23.0 * (p2 + 0.305) * t / denom; }
	float aa = r * cosh;
	float bb = r * sinh;
	float rc0 = (p2 * 460.0 + aa * 451.0 + bb * 288.0) / 1403.0;
	float rc1 = (p2 * 460.0 - aa * 891.0 - bb * 261.0) / 1403.0;
	float rc2 = (p2 * 460.0 - aa * 220.0 - bb * 6300.0) / 1403.0;
	float u0 = cam16_unadapt_(rc0);
	float u1 = cam16_unadapt_(rc1);
	float u2 = cam16_unadapt_(rc2);
	float g0 = u0 * CAM16_DRGBINV0_;
	float g1 = u1 * CAM16_DRGBINV1_;
	float g2 = u2 * CAM16_DRGBINV2_;
	return vec3(
		1.8620678550872327 * g0 - 1.0112546305316843 * g1 + 0.14918677544445175 * g2,
		0.38752654323613717 * g0 + 0.6214474419314753 * g1 - 0.008973985167612518 * g2,
		-0.015841498849333856 * g0 - 0.03412293802851557 * g1 + 1.0499644368778496 * g2);
}`,
}
