// GLSL chunk: CIE XYZ D65 0-100 <-> CIECAM02 (J, M, h), Moroney et al. 2002. Baked to
// ciecam02.js's fixed viewing conditions (D65 [95.05,100,108.88], La = 318.31, Yb = 20,
// average surround) — FL, D, n, z, Nbb=Ncb, Aw, the CAT02-white adaptation factors and
// the (1.64-0.29^n) term are all condition-derived consts computed once and pasted
// here. Mirrors ciecam02.js's forward/inverse exactly, including its M_HPE_CAT02 /
// M_CAT02 matrices, the compress/decompress (+0.1 offset) response compression, and
// the closed-form linear solve (Mi) the scalar library uses for the inverse instead of
// CAM16's iterative-looking p1/p2 split — same reference implementation, different
// derivation path. NOTE (see issues): ciecam02.js's J and A formulas use a plain
// fractional pow() (not the sign-preserving spow), so — like the scalar library
// itself — this chunk is only defined where the achromatic signal stays non-negative
// (true for the whole sRGB gamut).
export default {
	name: 'ciecam02',
	edges: { xyz: ['xyz_ciecam02', 'ciecam02_xyz'] },
	code: `
const float CIECAM02_FL_ = 1.16754446414718;
const float CIECAM02_AW_ = 46.18820879175914;
const float CIECAM02_NBB_ = 1.0003040045593807;
const float CIECAM02_ADAPT0_ = 1.0531065373989335;
const float CIECAM02_ADAPT1_ = 0.9660273665528357;
const float CIECAM02_ADAPT2_ = 0.9202566012466876;
const float CIECAM02_POW1_073_ = 0.8952178848134279;
const float CIECAM02_C_Z_ = 1.3297773808949709;
const float CIECAM02_INV_C_Z_ = 0.7520055720356568;
const float CIECAM02_T_PREFACTOR_ = 3847.323094459157;
const float CIECAM02_FLROOT_ = 1.0394853123571797;

float ciecam02_compress_(float v) {
	float f = pow(CIECAM02_FL_ * abs(v) / 100.0, 0.42);
	return 400.0 * sign(v) * f / (f + 27.13) + 0.1;
}
float ciecam02_decompress_(float v) {
	float w = v - 0.1;
	float aw = abs(w);
	return sign(w) * (100.0 / CIECAM02_FL_) * pow(27.13 * aw / (400.0 - aw), 2.380952380952381);
}
vec3 xyz_ciecam02(vec3 col) {
	float x = col.x; float y = col.y; float z = col.z;
	float r0 = (0.7328 * x + 0.4296 * y - 0.1624 * z) * CIECAM02_ADAPT0_;
	float g0 = (-0.7036 * x + 1.6975 * y + 0.0061 * z) * CIECAM02_ADAPT1_;
	float b0 = (0.0030 * x + 0.0136 * y + 0.9834 * z) * CIECAM02_ADAPT2_;
	float Rp = 0.7409792 * r0 + 0.2180250 * g0 + 0.0410058 * b0;
	float Gp = 0.2853532 * r0 + 0.6242014 * g0 + 0.0904454 * b0;
	float Bp = -0.0096280 * r0 - 0.0056980 * g0 + 1.0153260 * b0;
	float Ra = ciecam02_compress_(Rp);
	float Ga = ciecam02_compress_(Gp);
	float Ba = ciecam02_compress_(Bp);
	float a = Ra - 12.0 * Ga / 11.0 + Ba / 11.0;
	float b = (Ra + Ga - 2.0 * Ba) / 9.0;
	float h = atan2_(b, a) * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	float et = 0.25 * (cos(h * 0.017453292519943295 + 2.0) + 3.8);
	float A = CIECAM02_NBB_ * (2.0 * Ra + Ga + 0.05 * Ba - 0.305);
	float J = 100.0 * pow(A / CIECAM02_AW_, CIECAM02_C_Z_);
	float denom = Ra + Ga + (21.0 / 20.0) * Ba;
	float t = 0.0;
	if (denom != 0.0) { t = CIECAM02_T_PREFACTOR_ * et * sqrt(a * a + b * b) / denom; }
	float alpha = pow(t, 0.9) * CIECAM02_POW1_073_;
	float C = alpha * sqrt(J / 100.0);
	return vec3(J, C * CIECAM02_FLROOT_, h);
}
vec3 ciecam02_xyz(vec3 col) {
	float J = col.x; float M = col.y; float h = col.z;
	float C = M / CIECAM02_FLROOT_;
	float alpha = 0.0;
	if (J != 0.0) { alpha = C / sqrt(J / 100.0); }
	float t = pow(alpha / CIECAM02_POW1_073_, 1.0 / 0.9);
	float hr = h * 0.017453292519943295;
	float cosh = cos(hr);
	float sinh = sin(hr);
	float et = 0.25 * (cos(hr + 2.0) + 3.8);
	float A = CIECAM02_AW_ * pow(J / 100.0, CIECAM02_INV_C_Z_);
	float p2 = A / CIECAM02_NBB_ + 0.305;
	float p1 = CIECAM02_T_PREFACTOR_ * et;
	float kp0 = 0.3278688525;
	float kp1 = 0.3278688525;
	float kp2 = 0.3278688525;
	float kr0 = 0.3214540271 * cosh + 0.0228082680 * 9.0 * sinh;
	float kr1 = -0.6350677120 * cosh + -0.0206699929 * 9.0 * sinh;
	float kr2 = -0.1568068425 * cosh + -0.4989308624 * 9.0 * sinh;
	float Sp = kp0 + kp1 + 1.05 * kp2;
	float Sr = kr0 + kr1 + 1.05 * kr2;
	float r = 0.0;
	if (t != 0.0 && abs(p1 - t * Sr) > 1.0e-15) { r = t * Sp * p2 / (p1 - t * Sr); }
	float Ra = kp0 * p2 + kr0 * r;
	float Ga = kp1 * p2 + kr1 * r;
	float Ba = kp2 * p2 + kr2 * r;
	float Rd = ciecam02_decompress_(Ra);
	float Gd = ciecam02_decompress_(Ga);
	float Bd = ciecam02_decompress_(Ba);
	float l0 = 1.5591519556 * Rd - 0.5447222871 * Gd - 0.0144452601 * Bd;
	float l1 = -0.7143265795 * Rd + 1.8503102655 * Gd - 0.1359765427 * Bd;
	float l2 = 0.0107761273 * Rd + 0.0052185029 * Gd + 0.9840052620 * Bd;
	float m0 = l0 / CIECAM02_ADAPT0_;
	float m1 = l1 / CIECAM02_ADAPT1_;
	float m2 = l2 / CIECAM02_ADAPT2_;
	return vec3(
		1.096124 * m0 - 0.278869 * m1 + 0.182745 * m2,
		0.454369 * m0 + 0.473533 * m1 + 0.072098 * m2,
		-0.009628 * m0 - 0.005698 * m1 + 1.015326 * m2);
}`,
}
