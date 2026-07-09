// GLSL chunk: CIE XYZ D65 0-100 <-> IPT (Ebner & Fairchild 1998). Mirrors ipt.js:
// XYZ -> M1 -> signed power 0.43 -> M2. spow_ matches ipt.js's local spow
// exactly (sign-extended power, safe for the out-of-gamut/negative branch).
import xyz from './xyz.glsl.js'
export default {
	name: 'ipt',
	deps: [xyz],
	edges: { xyz: ['xyz_ipt', 'ipt_xyz'] },
	code: /* glsl */ `
vec3 xyz_ipt(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float l = 0.4002 * x + 0.7075 * y - 0.0807 * z;
	float m = -0.2280 * x + 1.1500 * y + 0.0612 * z;
	float s = 0.9184 * z;
	float lp = spow_(l, 0.43); float mp = spow_(m, 0.43); float sp = spow_(s, 0.43);
	return vec3(
		0.4000 * lp + 0.4000 * mp + 0.2000 * sp,
		4.4550 * lp - 4.8510 * mp + 0.3960 * sp,
		0.8056 * lp + 0.3572 * mp - 1.1628 * sp);
}
vec3 ipt_xyz(vec3 c) {
	float i = c.x; float p = c.y; float t = c.z;
	float lp = i + 0.09756893051461392 * p + 0.2052264331645916 * t;
	float mp = 1.0000000000000002 * i - 0.11387648547314712 * p + 0.13321715836999806 * t;
	float sp = 0.9999999999999999 * i + 0.03261510991706641 * p - 0.6768871830691794 * t;
	float l = spow_(lp, 1.0 / 0.43); float m = spow_(mp, 1.0 / 0.43); float s = spow_(sp, 1.0 / 0.43);
	return vec3(
		100.0 * (1.8502429449432056 * l - 1.138301637867233 * m + 0.23843495850870133 * s),
		100.0 * (0.3668307751713486 * l + 0.6438845448402355 * m - 0.010673443584379992 * s),
		100.0 * (1.088850174216028 * s));
}`,
}
