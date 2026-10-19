// GLSL chunk: ACES2065-1 (AP0 linear, 1.0 = 100 cd/m² reference white) <-> ACES 2.0 JMh, the
// simplified Hellwig 2022 the ACES 2.0 output transforms work in. Mirrors aces2-jmh.js exactly:
// K is its AP0 → adapted-cone matrix (the CTL's CAM16_PRI cone matrix × AP0 → XYZ × 100, fully
// adapted to the ACES white) and KINV its inverse, printed from there, as are F_L (L_A = 100),
// A_w, c·z (dim surround, Y_b 20) and the unadapt constant (100/F_L)·27.13^(1/0.42). The
// post-adaptation compression is CAM16's (0.42 exponent, 27.13); M = 43·N_c·|a,b| with N_c 0.9
// and no eccentricity factor. Unclamped like the JS: A < 0 reads as negative J (spow_).
import aces20651 from './aces2065-1.glsl.js'
export default {
	name: 'aces2-jmh',
	deps: [aces20651],
	edges: { 'aces2065-1': ['aces20651_aces2jmh', 'aces2jmh_aces20651'] },
	code: /* glsl */ `
const float ACES2JMH_FL_ = 0.7937005275461674;
const float ACES2JMH_AW_ = 39.48899202669033;
const float ACES2JMH_CZ_ = 1.137056021344975;
const float ACES2JMH_INV_CZ_ = 0.8794641435671241;
const float ACES2JMH_NC43_ = 38.7;
const float ACES2JMH_UNADAPT_CONST_ = 326076.1468834672;

float aces2jmh_adapt_(float v) {
	float x = pow(ACES2JMH_FL_ * abs(v) * 0.01, 0.42);
	return sign(v) * 400.0 * x / (x + 27.13);
}
float aces2jmh_unadapt_(float v) {
	float a = abs(v);
	float ratio = a / (400.0 - a);
	return sign(v) * ACES2JMH_UNADAPT_CONST_ * pow(abs(ratio), 2.380952380952381);
}
vec3 aces20651_aces2jmh(vec3 c) {
	float ra0 = aces2jmh_adapt_(56.08929223610134 * c.x + 44.053045491661216 * c.y - 0.1423377277625573 * c.z);
	float ra1 = aces2jmh_adapt_(15.58952050721305 * c.x + 77.31425080806491 * c.y + 7.0962286847220355 * c.z);
	float ra2 = aces2jmh_adapt_(1.4741990363928867 * c.x + 3.5354381914578603 * c.y + 94.99036277214924 * c.z);
	float a = ra0 - 12.0 * ra1 / 11.0 + ra2 / 11.0;
	float b = (ra0 + ra1 - 2.0 * ra2) / 9.0;
	float A = 2.0 * ra0 + ra1 + 0.05 * ra2;
	float J = 100.0 * spow_(A / ACES2JMH_AW_, ACES2JMH_CZ_);
	float M = ACES2JMH_NC43_ * sqrt(a * a + b * b);
	float h = atan2_(b, a) * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	return vec3(J, M, h);
}
vec3 aces2jmh_aces20651(vec3 c) {
	float hRad = c.z * 0.017453292519943295;
	float A = ACES2JMH_AW_ * spow_(c.x / 100.0, ACES2JMH_INV_CZ_);
	float r = c.y / ACES2JMH_NC43_;
	float aa = r * cos(hRad);
	float bb = r * sin(hRad);
	float u0 = aces2jmh_unadapt_((A * 460.0 + aa * 451.0 + bb * 288.0) / 1403.0);
	float u1 = aces2jmh_unadapt_((A * 460.0 - aa * 891.0 - bb * 261.0) / 1403.0);
	float u2 = aces2jmh_unadapt_((A * 460.0 - aa * 220.0 - bb * 6300.0) / 1403.0);
	return vec3(
		0.021168425274689866 * u0 - 0.012104400879950506 * u1 + 0.0009359756052606412 * u2,
		-0.0042527416868712795 * u0 + 0.015410339301765288 * u1 - 0.0011575976148940081 * u2,
		-0.0001702400779595117 * u0 - 0.0003857023484090842 * u1 + 0.010555942426368597 * u2);
}`,
}
