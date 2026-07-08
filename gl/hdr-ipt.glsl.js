// GLSL chunk: CIE XYZ D65 0-100 <-> hdr-IPT (Fairchild & Wyble 2010/2011).
// Mirrors hdr-ipt.js: same IPT cone matrices M1/M2, but the fixed 0.43 power is
// replaced by a Michaelis-Menten response with exponent e computed the same way
// (0.59 / (1.25 - 0.25·(0.2/0.184)) / (log(318)/log(100)) ≈ 0.4820209198458999),
// Vmax = 247. Private helpers hdript_e_/hdript_light_/hdript_lightinv_ (chunk
// name with the hyphen stripped, per the edge-fn convention).
export default {
	name: 'hdr-ipt',
	edges: { xyz: ['xyz_hdript', 'hdript_xyz'] },
	code: /* glsl */ `
float hdript_e_() {
	return 0.59 / (1.25 - 0.25 * (0.2 / 0.184)) / (log(318.0) / log(100.0));
}
float hdript_light_(float v) {
	float e = hdript_e_();
	float ke = pow(2.0, e);
	float av = abs(v);
	float p = pow(av, e);
	return 247.0 * p / (p + ke) * sign(v);
}
float hdript_lightinv_(float L) {
	float e = hdript_e_();
	float ke = pow(2.0, e);
	float aL = abs(L);
	return sign(L) * pow(aL * ke / (247.0 - aL), 1.0 / e);
}
vec3 xyz_hdript(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float l = 0.4002 * x + 0.7075 * y - 0.0807 * z;
	float m = -0.2280 * x + 1.1500 * y + 0.0612 * z;
	float s = 0.9184 * z;
	float lp = hdript_light_(l); float mp = hdript_light_(m); float sp = hdript_light_(s);
	return vec3(
		0.4000 * lp + 0.4000 * mp + 0.2000 * sp,
		4.4550 * lp - 4.8510 * mp + 0.3960 * sp,
		0.8056 * lp + 0.3572 * mp - 1.1628 * sp);
}
vec3 hdript_xyz(vec3 c) {
	float i = c.x; float p = c.y; float t = c.z;
	float lp = i + 0.09756893051461392 * p + 0.2052264331645916 * t;
	float mp = 1.0000000000000002 * i - 0.11387648547314712 * p + 0.13321715836999806 * t;
	float sp = 0.9999999999999999 * i + 0.03261510991706641 * p - 0.6768871830691794 * t;
	float l = hdript_lightinv_(lp); float m = hdript_lightinv_(mp); float s = hdript_lightinv_(sp);
	return vec3(
		100.0 * (1.8502429449432056 * l - 1.138301637867233 * m + 0.23843495850870133 * s),
		100.0 * (0.3668307751713486 * l + 0.6438845448402355 * m - 0.010673443584379992 * s),
		100.0 * (1.088850174216028 * s));
}`,
}
