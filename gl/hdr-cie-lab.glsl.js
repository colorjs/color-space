// GLSL chunk: CIE XYZ D65 0-100 <-> hdr-CIELAB (Fairchild & Wyble). Mirrors
// hdr-cie-lab.js exactly — Michaelis-Menten lightness replacing Lab's cube root,
// exponent e derived the same way (spow_ guards the dynamic exponent, never raw pow).
import xyz from './xyz.glsl.js'
export default {
	name: 'hdr-cie-lab',
	deps: [xyz],
	edges: { xyz: ['xyz_hdrcielab', 'hdrcielab_xyz'] },
	code: /* glsl */ `
float hdrcielab_e_() { return 0.58 / (1.25 - 0.25 * (0.2 / 0.184)) / (log(318.0) / log(100.0)); }
float hdrcielab_light_(float v) {
	float e = hdrcielab_e_();
	float p = spow_(v, e);
	float ke = spow_(2.0, e);
	return 247.0 * p / (p + ke);
}
float hdrcielab_lightinv_(float L) {
	float e = hdrcielab_e_();
	float ke = spow_(2.0, e);
	return spow_(L * ke / (247.0 - L), 1.0 / e);
}
vec3 xyz_hdrcielab(vec3 c) {
	float L = hdrcielab_light_(c.y / 100.0);
	float a = 5.0 * (hdrcielab_light_(c.x / 95.0456) - L);
	float b = 2.0 * (L - hdrcielab_light_(c.z / 108.9058));
	return vec3(L, a, b);
}
vec3 hdrcielab_xyz(vec3 c) {
	return vec3(
		95.0456 * hdrcielab_lightinv_(c.x + c.y / 5.0),
		100.0 * hdrcielab_lightinv_(c.x),
		108.9058 * hdrcielab_lightinv_(c.x - c.z / 2.0));
}`,
}
