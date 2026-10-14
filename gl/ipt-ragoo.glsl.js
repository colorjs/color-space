// GLSL chunk: CIE XYZ D65 0-100 <-> IPT Ragoo & Farup 2021. Mirrors ipt-ragoo.js:
// XYZ -> M1 (Eq. 27) -> signed power 0.4071 (Eq. 28) -> M2 (Eq. 29); inverses printed
// from ipt-ragoo.js (inv3).
import xyz from './xyz.glsl.js'
export default {
	name: 'ipt-ragoo',
	deps: [xyz],
	edges: { xyz: ['xyz_iptragoo', 'iptragoo_xyz'] },
	code: /* glsl */ `
vec3 xyz_iptragoo(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float lp = spow_(0.4321 * x + 0.6906 * y - 0.0930 * z, 0.4071);
	float mp = spow_(-0.1793 * x + 1.1458 * y + 0.0226 * z, 0.4071);
	float sp = spow_(0.0631 * x + 0.1532 * y + 0.7226 * z, 0.4071);
	return vec3(
		0.3037 * lp + 0.6688 * mp + 0.0276 * sp,
		3.9247 * lp - 4.7339 * mp + 0.8093 * sp,
		1.5932 * lp - 0.5205 * mp - 1.0727 * sp);
}
vec3 iptragoo_xyz(vec3 c) {
	float lp = 0.999887228244948 * c.x + 0.127830322275134 * c.y + 0.12216832974440806 * c.z;
	float mp = 0.999906732181264 * c.x - 0.06722854482159996 * c.y - 0.02499360074197628 * c.z;
	float sp = 0.9998777644630402 * c.x + 0.22247760513506687 * c.y - 0.7386522306935867 * c.z;
	float l = spow_(lp, 1.0 / 0.4071); float m = spow_(mp, 1.0 / 0.4071); float s = spow_(sp, 1.0 / 0.4071);
	return vec3(
		100.0 * (1.808089066061612 * l - 1.1255977610731531 * m + 0.2679086528424899 * s),
		100.0 * (0.2872534678493166 * l + 0.6975924571236832 * m + 0.015152204510090238 * s),
		100.0 * (-0.21878999632300447 * l - 0.04960689967842832 * m + 1.3572843153538516 * s));
}`,
}
