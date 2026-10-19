// GLSL chunk: CIE XYZ D65 0-100 <-> YyCxCz, linearized CIELAB (Flohr et al. 1993):
// Yy = 116·Y/Yn − 16, Cx = 500·(X/Xn − Y/Yn), Cz = 200·(Y/Yn − Z/Zn), D65 white as
// whitepoints.js. Mirrors ycxcz.js.
import xyz from './xyz.glsl.js'
export default {
	name: 'ycxcz',
	deps: [xyz],
	edges: { xyz: ['xyz_ycxcz', 'ycxcz_xyz'] },
	code: /* glsl */ `
vec3 xyz_ycxcz(vec3 c) {
	float x = c.x / 95.04559270516717;
	float y = c.y / 100.0;
	float z = c.z / 108.90577507598783;
	return vec3(116.0 * y - 16.0, 500.0 * (x - y), 200.0 * (y - z));
}
vec3 ycxcz_xyz(vec3 c) {
	float y = (c.x + 16.0) / 116.0;
	return vec3(
		(y + c.y / 500.0) * 95.04559270516717,
		y * 100.0,
		(y - c.z / 200.0) * 108.90577507598783);
}`,
}
