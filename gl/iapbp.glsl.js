// GLSL chunk: CIE XYZ D65 0-100 <-> IaPbP (Huang et al. 2024). Mirrors iapbp.js:
// XYZ / D65 white -> projective M1 (3×3 block / (1 + d·v)) -> SA-PQ per cone (point-
// symmetric about f(0) for negatives) -> projective M2. Inverse blocks A⁻¹ and −d·A⁻¹
// and f(0) = 0.7707^78.2171 printed from iapbp.js.
import xyz from './xyz.glsl.js'
export default {
	name: 'iapbp',
	deps: [xyz],
	edges: { xyz: ['xyz_iapbp', 'iapbp_xyz'] },
	code: /* glsl */ `
const float IAPBP_F0_ = 1.4206948702566805e-9;
float iapbp_sapq_(float v) {
	float t = pow(abs(v), 0.2926);
	return IAPBP_F0_ + sign(v) * (pow((0.7707 + 44.4561 * t) / (1.0 + 44.2269 * t), 78.2171) - IAPBP_F0_);
}
float iapbp_sapq_inv_(float v) {
	float t = pow(IAPBP_F0_ + abs(v - IAPBP_F0_), 1.0 / 78.2171);
	return sign(v - IAPBP_F0_) * spow_((t - 0.7707) / (44.4561 - 44.2269 * t), 1.0 / 0.2926);
}
vec3 xyz_iapbp(vec3 c) {
	float x = c.x / 95.04559270516717; float y = c.y / 100.0; float z = c.z / 108.90577507598783;
	float w1 = 1.0 + 1.967421 * x - 0.807475 * y - 0.143517 * z;
	float l = iapbp_sapq_((0.490978 * x + 1.045001 * y + 0.482481 * z) / w1);
	float m = iapbp_sapq_((0.517558 * x + 1.256543 * y + 0.240489 * z) / w1);
	float s = iapbp_sapq_((1.587132 * x + 0.553389 * y - 0.124257 * z) / w1);
	float w2 = 1.0 - 0.741126 * l + 1.127297 * m - 1.255019 * s;
	return vec3(
		(-0.011823 * l + 0.248826 * m - 0.106030 * s) / w2,
		(5.055264 * l - 5.937734 * m + 0.881421 * s) / w2,
		(1.247189 * l - 3.372989 * m + 2.125450 * s) / w2);
}
vec3 iapbp_xyz(vec3 c) {
	float w2 = 1.0 + 6.635755898804213 * c.x - 0.07265393282453614 * c.y + 0.951632313192193 * c.z;
	float lp = (7.637114995100801 * c.x + 0.13555010722778593 * c.y + 0.32477197387269313 * c.z) / w2;
	float mp = (7.635594195649971 * c.x - 0.08479165133815368 * c.y + 0.4160715117640468 * c.z) / w2;
	float sp = (7.635959169477722 * c.x - 0.21409956006433595 * c.y + 0.9402021214666024 * c.z) / w2;
	float l = iapbp_sapq_inv_(lp); float m = iapbp_sapq_inv_(mp); float s = iapbp_sapq_inv_(sp);
	float w1 = 1.0 - 1.3681927197346515 * l + 2.4988749683158353 * m - 1.6312324404660277 * s;
	return vec3(
		95.04559270516717 * (0.5784881910236209 * l - 0.7937677149031926 * m + 0.709957241072243 * s) / w1,
		100.0 * (-0.8920757549652192 * l + 1.6536848512214957 * m - 0.2632977308800916 * s) / w1,
		108.90577507598783 * (3.4160828736510114 * l - 2.773953457407804 * m - 0.15218629177053844 * s) / w1);
}`,
}
