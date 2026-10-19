// GLSL chunk: CIE XYZ D65 0-100 <-> CIECAM97s (J, M, h), CIE 131-1998. Baked to ciecam97s.js's
// viewing conditions (D65 [95.05,100,108.88], La = 318.31, Yb = 20, average surround): FL, Aw,
// Nbb = Ncb, the adaptation factors k = D/Rw + 1 − D (blue: D/Bw^p + 1 − D), the blue exponent
// p, the c·z and 0.67·n exponents and 2.44(1.64 − 0.29^n) are consts computed once and pasted
// here; M_H·M_B⁻¹ (M_B⁻¹ the exact inverse of M_B), its inverse and M_B⁻¹ are expanded into
// scalar rows. Mirrors ciecam97s.js exactly: Bc·Y = k_B·B·|B/Y|^(p−1) (0 at Y = 0), the
// odd-about-1 hyperbolic compression and its inverse, the linear eccentricity between unique
// hues (blue to red across 360°), CAM16's M1 matrix for R'a G'a B'a, and the inverse's Newton
// solve for Y (8 fixed steps; it converges in 3).
import xyz from './xyz.glsl.js'
export default {
	name: 'ciecam97s',
	deps: [xyz],
	edges: { xyz: ['xyz_ciecam97s', 'ciecam97s_xyz'] },
	code: /* glsl */ `
const float CIECAM97S_FL_ = 1.1675444641471802;
const float CIECAM97S_FL015_ = 1.0235074645094855;
const float CIECAM97S_AW_ = 44.79987828761955;
const float CIECAM97S_NBB_ = 1.0003040045593807;
const float CIECAM97S_K0_ = 1.0620006620276592;
const float CIECAM97S_K1_ = 0.9612862831473444;
const float CIECAM97S_K2_ = 0.9175236648940005;
const float CIECAM97S_P_ = 1.0071747948820478;
const float CIECAM97S_C_Z_ = 0.9985773808949708;
const float CIECAM97S_INV_C_Z_ = 1.0014246458334097;
const float CIECAM97S_JN_ = 0.134;
const float CIECAM97S_CN_ = 2.096712087805054;
const float CIECAM97S_S_ = 3847.323094459157;

float ciecam97s_compress_(float q) {
	float x = pow(CIECAM97S_FL_ * abs(q) / 100.0, 0.73);
	return sign(q) * 40.0 * x / (x + 2.0) + 1.0;
}
float ciecam97s_decompress_(float q) {
	float w = q - 1.0;
	float a = abs(w);
	return sign(w) * 100.0 / CIECAM97S_FL_ * pow(2.0 * a / (40.0 - a), 1.36986301369863);
}
float ciecam97s_ecc_(float h) {
	float hp = h;
	if (hp < 20.14) { hp = hp + 360.0; }
	if (hp < 90.0) { return 0.8 - 0.1 * (hp - 20.14) / 69.86; }
	if (hp < 164.25) { return 0.7 + 0.3 * (hp - 90.0) / 74.25; }
	if (hp < 237.53) { return 1.0 + 0.2 * (hp - 164.25) / 73.28; }
	return 1.2 - 0.4 * (hp - 237.53) / 142.61;
}
vec3 xyz_ciecam97s(vec3 c) {
	float x = c.x; float y = c.y; float z = c.z;
	float R = 0.8951 * x + 0.2664 * y - 0.1614 * z;
	float G = -0.7502 * x + 1.7135 * y + 0.0367 * z;
	float B = 0.0389 * x - 0.0685 * y + 1.0296 * z;
	float rc = CIECAM97S_K0_ * R;
	float gc = CIECAM97S_K1_ * G;
	float bc = 0.0;
	if (B != 0.0 && y != 0.0) { bc = CIECAM97S_K2_ * B * pow(abs(B / y), CIECAM97S_P_ - 1.0); }
	float ra = ciecam97s_compress_(0.6831617252522318 * rc + 0.29668077640584156 * gc + 0.020099182169401514 * bc);
	float ga = ciecam97s_compress_(0.284373401262426 * rc + 0.6490804713576964 * gc + 0.06651769003975144 * bc);
	float ba = ciecam97s_compress_(-0.008528664575177328 * rc + 0.04004282165408487 * gc + 0.9684866957875501 * bc);
	float a = ra - 12.0 * ga / 11.0 + ba / 11.0;
	float b = (ra + ga - 2.0 * ba) / 9.0;
	float h = atan2_(b, a) * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	float J = 100.0 * spow_(CIECAM97S_NBB_ * (2.0 * ra + ga + ba / 20.0 - 2.05) / CIECAM97S_AW_, CIECAM97S_C_Z_);
	float den = ra + ga + 21.0 / 20.0 * ba;
	float s = 0.0;
	if (den != 0.0) { s = CIECAM97S_S_ * sqrt(a * a + b * b) * ciecam97s_ecc_(h) / den; }
	float C = CIECAM97S_CN_ * spow_(s, 0.69) * spow_(J / 100.0, CIECAM97S_JN_);
	return vec3(J, C * CIECAM97S_FL015_, h);
}
vec3 ciecam97s_xyz(vec3 c) {
	float J = c.x; float M = c.y; float h = c.z;
	float jn = CIECAM97S_CN_ * spow_(J / 100.0, CIECAM97S_JN_);
	float s = 0.0;
	if (jn != 0.0) { s = spow_(M / CIECAM97S_FL015_ / jn, 1.0 / 0.69); }
	float p2 = CIECAM97S_AW_ * spow_(J / 100.0, CIECAM97S_INV_C_Z_) / CIECAM97S_NBB_ + 2.05;
	float hRad = h * 0.017453292519943295;
	float cosh = cos(hRad);
	float sinh = sin(hRad);
	float den = CIECAM97S_S_ * ciecam97s_ecc_(mod_(h, 360.0)) + s * (11.0 * cosh + 108.0 * sinh) / 23.0;
	float r = 0.0;
	if (den != 0.0) { r = s * p2 / den; }
	float aa = r * cosh;
	float bb = r * sinh;
	float ra = ciecam97s_decompress_((p2 * 460.0 + aa * 451.0 + bb * 288.0) / 1403.0);
	float ga = ciecam97s_decompress_((p2 * 460.0 - aa * 891.0 - bb * 261.0) / 1403.0);
	float ba = ciecam97s_decompress_((p2 * 460.0 - aa * 220.0 - bb * 6300.0) / 1403.0);
	float R = (1.8086382896694266 * ra - 0.8278820422650344 * ga + 0.019325666212710788 * ba) / CIECAM97S_K0_;
	float G = (-0.7974066886917084 * ra + 1.9121998144117065 * ga - 0.1147851516531109 * ba) / CIECAM97S_K1_;
	float v2 = 0.048896575799588976 * ra - 0.08635183606084233 * ga + 1.0374547712954951 * ba;
	float sig = spow_(v2 / CIECAM97S_K2_, 1.0 / CIECAM97S_P_);
	float q = 1.0 - 1.0 / CIECAM97S_P_;
	float a0 = 0.43230526972339456 * R + 0.5183602715367776 * G;
	float g = 0.0492912282128556 * sig;
	float Y = a0 + g;
	for (int i = 0; i < 8; i++) {
		if (sig != 0.0 && Y != 0.0) {
			float yq = pow(abs(Y), q);
			Y = Y - (Y - a0 - g * yq) / (1.0 - q * g * yq / Y);
		}
	}
	float Bv = 0.0;
	if (sig != 0.0) { Bv = sig * pow(abs(Y), q); }
	return vec3(
		0.9869929054667123 * R - 0.14705425642099013 * G + 0.15996265166373122 * Bv,
		0.43230526972339456 * R + 0.5183602715367776 * G + 0.0492912282128556 * Bv,
		-0.008528664575177328 * R + 0.04004282165408487 * G + 0.9684866957875501 * Bv);
}`,
}
