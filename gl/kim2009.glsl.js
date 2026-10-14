// GLSL chunk: CIE XYZ D65 0-100 <-> Kim, Weyrich & Kautz 2009 (J, M, h). Mirrors
// kim2009.js under cam16.js's viewing conditions (D65 [95.047, 100, 108.883], La =
// 64/π·0.2, white 64/π cd/m², average surround, CRT media E = 1.4572). The linear
// front end (absolute scaling, CAT02 adaptation, HPE) is one matrix K; K⁻¹, the derived
// [A, a, b] -> L'M'S' inverse, La^0.57, σ_j^n_j, the colorfulness factor and A_w are
// printed from kim2009.js.
import xyz from './xyz.glsl.js'
export default {
	name: 'kim2009',
	deps: [xyz],
	edges: { xyz: ['xyz_kim2009', 'kim2009_xyz'] },
	code: /* glsl */ `
const float KIM2009_LAN_ = 2.227071987197361;
const float KIM2009_SN_ = 0.20755526368950106;
const float KIM2009_MK_ = 0.7539933111418728;
const float KIM2009_AW_ = 0.7142978444982602;
float kim2009_cone_(float v) {
	float p = spow_(v, 0.57);
	return p / (p + KIM2009_LAN_);
}
float kim2009_uncone_(float p) {
	return spow_(KIM2009_LAN_ * p / (1.0 - p), 1.0 / 0.57);
}
vec3 xyz_kim2009(vec3 c) {
	float l = kim2009_cone_(0.0851932314533244 * c.x + 0.14108864798315085 * c.y - 0.01767361071465202 * c.z);
	float m = kim2009_cone_(-0.04238383805816688 * c.x + 0.23603710094848596 * c.y + 0.00780428347620208 * c.z);
	float s = kim2009_cone_(-0.00012847855989118456 * c.x - 0.00016908068097735155 * c.y + 0.19016369605099914 * c.z);
	float A = (40.0 * l + 20.0 * m + s) / 61.0;
	float a = l - 12.0 / 11.0 * m + s / 11.0;
	float b = (l + m - 2.0 * s) / 9.0;
	float r = A / KIM2009_AW_;
	float Jp = spow_(-(r - 0.24) * KIM2009_SN_ / (r - 0.24 - 0.89), 1.0 / 3.65);
	vec3 p = polar_fwd(vec3(0.0, a, b));
	return vec3(100.0 * (1.4572 * (Jp - 1.0) + 1.0), 456.5 * pow(p.y, 0.62) * KIM2009_MK_, p.z);
}
vec3 kim2009_xyz(vec3 c) {
	float Jn = spow_((c.x / 100.0 - 1.0) / 1.4572 + 1.0, 3.65);
	float A = KIM2009_AW_ * (0.89 * Jn / (Jn + KIM2009_SN_) + 0.24);
	vec3 p = polar_inv(vec3(0.0, spow_(c.y / KIM2009_MK_ / 456.5, 1.0 / 0.62), c.z));
	float l = kim2009_uncone_(A + 0.32145402708481824 * p.y + 0.20527441197434074 * p.z);
	float m = kim2009_uncone_(1.0000000000000002 * A - 0.6350677120456166 * p.y - 0.1860299358517463 * p.z);
	float s = kim2009_uncone_(1.0000000000000002 * A - 0.15680684248039914 * p.y - 4.490377761938703 * p.z);
	return vec3(
		9.04903196510503 * l - 5.408200467488245 * m + 1.062958924535763 * s,
		1.6246332347438557 * l + 3.265527158632847 * m + 0.016975036596236597 * s,
		0.007558228614621876 * l - 0.0007504074378937872 * m + 5.259360531751405 * s);
}`,
}
