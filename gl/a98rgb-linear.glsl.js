// GLSL chunk: linear-light Adobe RGB 0-1 <-> CIE XYZ D65 0-100.
// Matrix mirrors a98rgb-linear.js M (Adobe RGB 1998 primaries, D65 white); inverse via inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'a98rgb-linear',
	deps: [xyz],
	edges: { xyz: ['xyz_a98rgblinear', 'a98rgblinear_xyz'] },
	code: /* glsl */ `
vec3 a98rgblinear_xyz(vec3 c) {
	return vec3(
		100.0 * (0.5766690429101305 * c.x + 0.1855582379065463 * c.y + 0.1882286462349947 * c.z),
		100.0 * (0.29734497525053605 * c.x + 0.6273635662554661 * c.y + 0.07529145849399788 * c.z),
		100.0 * (0.02703136138641234 * c.x + 0.07068885253582723 * c.y + 0.9913375368376388 * c.z));
}
vec3 xyz_a98rgblinear(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		2.0415879038107465 * x - 0.5650069742788597 * y - 0.34473135077832956 * z,
		-0.9692436362808796 * x + 1.8759675015077202 * y + 0.04155505740717559 * z,
		0.013444280632031149 * x - 0.11836239223101837 * y + 1.0151749943912054 * z);
}`,
}
