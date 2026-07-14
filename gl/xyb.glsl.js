// GLSL chunk: linear sRGB 0-1 <-> XYB (JPEG XL internal space): RGB -> LMS (biased
// cube-root gamma-3 curve) -> X/Y/B opponent recombination. Mirrors xyb.js (ported
// from culori); cube computed by multiplication (not pow) so a negative LMS' never
// hits GLSL's undefined negative-base pow.
import lrgb from './lrgb.glsl.js'
export default {
	name: 'xyb',
	deps: [lrgb],
	edges: { lrgb: ['lrgb_xyb', 'xyb_lrgb'] },
	code: /* glsl */ `
vec3 lrgb_xyb(vec3 c) {
	float bias = 0.00379307325527544933;
	float bc = cbrt_(bias);
	float l = cbrt_(0.3 * c.x + 0.622 * c.y + 0.078 * c.z + bias) - bc;
	float m = cbrt_(0.23 * c.x + 0.692 * c.y + 0.078 * c.z + bias) - bc;
	float s = cbrt_(0.24342268924547819 * c.x + 0.20476744424496821 * c.y + 0.5518098665095536 * c.z + bias) - bc;
	float x = (l - m) / 2.0;
	float y = (l + m) / 2.0;
	return vec3(x, y, s - y);
}
vec3 xyb_lrgb(vec3 c) {
	float bias = 0.00379307325527544933;
	float bc = cbrt_(bias);
	float lp = (c.x + c.y) + bc;
	float mp = (c.y - c.x) + bc;
	float sp = (c.z + c.y) + bc;
	float l = lp * lp * lp - bias;
	float m = mp * mp * mp - bias;
	float s = sp * sp * sp - bias;
	return vec3(
		11.031566904639861 * l - 9.866943908131562 * m - 0.16462299650829934 * s,
		-3.2541473810744237 * l + 4.418770377582723 * m - 0.16462299650829934 * s,
		-3.6588512867136815 * l + 2.7129230459360922 * m + 1.9459282407775895 * s);
}`,
}
