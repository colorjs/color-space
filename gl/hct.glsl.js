// GLSL chunk: CIE XYZ D65 0-100 <-> HCT (H, C, T) — Google Material Design's hue/
// chroma from CAM16 paired with CIELAB's L* as tone. Baked to hct.js's own viewing
// conditions (precise D65 white, La = (200/π)·Y(L*=50)/100, Yb = Y(L*=50), average
// surround, no discounting — distinct from cam16.js's Material-Design-app defaults),
// reusing CAM16's CAT16/CAT16⁻¹ and M1 matrices and the L*/Y toe from cie.js (labF/
// labFInv). Forward only needs CAM16's hue and chroma (C), not M/Q, so the FL^0.25
// chroma scaling never enters. The inverse mirrors hct.js's Newton solve on J exactly:
// same quadratic seeds, same "best-so-far" fallback, same 2e-12 stopping threshold and
// 16-iteration cap (attempt 0..15). The solve converges to hct.js's own 2e-12
// threshold for every sample tested, so no tolerance relaxation is needed here.
export default {
	name: 'hct',
	edges: { xyz: ['xyz_hct', 'hct_xyz'] },
	code: /* glsl */ `
const float HCT_FL_ = 0.3884814537800353;
const float HCT_AW_ = 29.980990887425254;
const float HCT_NBB_ = 1.0169191804458755;
const float HCT_DRGB0_ = 1.0211931250282207;
const float HCT_DRGB1_ = 0.98629630699647;
const float HCT_DRGB2_ = 0.9338046211456175;
const float HCT_DRGBINV0_ = 0.9792467022066614;
const float HCT_DRGBINV1_ = 1.0138940933939633;
const float HCT_DRGBINV2_ = 1.0708878253067244;
const float HCT_POW1_073_ = 0.8834525670408592;
const float HCT_POW1_NEG073_ = 1.1319226830134397;
const float HCT_HALF_C_Z_ = 0.6586635011268599;
const float HCT_2_C_Z_ = 1.518225920047448;
const float HCT_T_PREFACTOR_ = 3911.227617099521;
const float HCT_UNADAPT_CONST_ = 666201.197723509;

float hct_adapt_(float v) {
	float x = pow(HCT_FL_ * abs(v) * 0.01, 0.42);
	return sign(v) * 400.0 * x / (x + 27.13);
}
float hct_unadapt_(float v) {
	float a = abs(v);
	float ratio = a / (400.0 - a);
	return sign(v) * HCT_UNADAPT_CONST_ * pow(abs(ratio), 2.380952380952381);
}
float hct_labf_(float t) {
	if (t > 0.008856451679035631) { return cbrt_(t); }
	return (903.2962962962963 * t + 16.0) / 116.0;
}
float hct_labfinv_(float ft) {
	if (ft > 0.20689655172413793) { return ft * ft * ft; }
	return (116.0 * ft - 16.0) / 903.2962962962963;
}
float hct_tolstar_(float y) {
	return 116.0 * hct_labf_(y / 100.0) - 16.0;
}
float hct_fromlstar_(float l) {
	return hct_labfinv_((l + 16.0) / 116.0) * 100.0;
}
vec3 hct_fromcam16_(float j, float cc, float h) {
	float hRad = h * 0.017453292519943295;
	float cosh = cos(hRad);
	float sinh = sin(hRad);
	float Jroot = spow_(j, 0.5) * 0.1;
	float alpha = 0.0;
	if (Jroot != 0.0) { alpha = cc / Jroot; }
	float t = spow_(alpha * HCT_POW1_NEG073_, 10.0 / 9.0);
	float A = HCT_AW_ * spow_(Jroot, HCT_2_C_Z_);
	float p1 = HCT_T_PREFACTOR_ * (0.25 * (cos(hRad + 2.0) + 3.8));
	float p2 = A / HCT_NBB_;
	float denom = 23.0 * p1 + t * (11.0 * cosh + 108.0 * sinh);
	float r = 0.0;
	if (denom != 0.0) { r = 23.0 * (p2 + 0.305) * t / denom; }
	float aa = r * cosh;
	float bb = r * sinh;
	float rc0 = (p2 * 460.0 + aa * 451.0 + bb * 288.0) / 1403.0;
	float rc1 = (p2 * 460.0 - aa * 891.0 - bb * 261.0) / 1403.0;
	float rc2 = (p2 * 460.0 - aa * 220.0 - bb * 6300.0) / 1403.0;
	float u0 = hct_unadapt_(rc0);
	float u1 = hct_unadapt_(rc1);
	float u2 = hct_unadapt_(rc2);
	float g0 = u0 * HCT_DRGBINV0_;
	float g1 = u1 * HCT_DRGBINV1_;
	float g2 = u2 * HCT_DRGBINV2_;
	return vec3(
		1.8620678550872327 * g0 - 1.0112546305316843 * g1 + 0.14918677544445175 * g2,
		0.38752654323613717 * g0 + 0.6214474419314753 * g1 - 0.008973985167612518 * g2,
		-0.015841498849333856 * g0 - 0.03412293802851557 * g1 + 1.0499644368778496 * g2);
}
vec3 xyz_hct(vec3 c) {
	float x = c.x; float y = c.y; float z = c.z;
	float tone = hct_tolstar_(y);
	if (tone == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float rc0 = (0.401288 * x + 0.650173 * y - 0.051461 * z) * HCT_DRGB0_;
	float rc1 = (-0.250268 * x + 1.204414 * y + 0.045854 * z) * HCT_DRGB1_;
	float rc2 = (-0.002079 * x + 0.048952 * y + 0.953127 * z) * HCT_DRGB2_;
	float ra0 = hct_adapt_(rc0);
	float ra1 = hct_adapt_(rc1);
	float ra2 = hct_adapt_(rc2);
	float a = ra0 + (-12.0 * ra1 + ra2) / 11.0;
	float b = (ra0 + ra1 - 2.0 * ra2) / 9.0;
	float hRad = atan2_(b, a);
	if (hRad < 0.0) { hRad = hRad + 6.283185307179586; }
	float et = 0.25 * (cos(hRad + 2.0) + 3.8);
	float denom = ra0 + ra1 + 1.05 * ra2 + 0.305;
	float camT = 0.0;
	if (denom != 0.0) { camT = HCT_T_PREFACTOR_ * et * sqrt(a * a + b * b) / denom; }
	float alpha = spow_(camT, 0.9) * HCT_POW1_073_;
	float A = HCT_NBB_ * (2.0 * ra0 + ra1 + 0.05 * ra2);
	float Jroot = spow_(A / HCT_AW_, HCT_HALF_C_Z_);
	float C = alpha * Jroot;
	float h = hRad * 57.29577951308232;
	return vec3(h, C, tone);
}
vec3 hct_xyz(vec3 c) {
	float h = c.x; float cc = c.y; float t = c.z;
	if (t == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float y = hct_fromlstar_(t);
	float j = 0.0;
	if (t > 0.0) {
		j = 0.00379058511492914 * t * t + 0.608983189401032 * t + 0.9155088574762233;
	} else {
		j = 9.514440756550361e-6 * t * t + 0.08693057439788597 * t - 21.928975842194614;
	}
	float last = 1.0e30;
	float best = j;
	vec3 res = vec3(0.0, 0.0, 0.0);
	for (int attempt = 0; attempt <= 15; attempt++) {
		res = hct_fromcam16_(j, cc, h);
		float delta = abs(res.y - y);
		if (delta < last) {
			if (delta <= 2.0e-12) { return res; }
			best = j;
			last = delta;
		}
		if (res.y == 0.0) { break; }
		j = j - ((res.y - y) * j) / (2.0 * res.y);
	}
	if (last > 1.0e-3) { return vec3(sqrt(-1.0), sqrt(-1.0), sqrt(-1.0)); }
	return hct_fromcam16_(best, cc, h);
}`,
}
