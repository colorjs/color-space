// GLSL chunk: Beta RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, sign-extended.
// Mirrors betargb.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'betargb',
	deps: [xyz],
	edges: { xyz: ['xyz_betargb', 'betargb_xyz'] },
	code: /* glsl */ `
vec3 betargb_xyz(vec3 c) {
	float r = spow_(c.x, 2.2); float g = spow_(c.y, 2.2); float b = spow_(c.z, 2.2);
	return vec3(
		100.0 * (0.6344565231756327 * r + 0.15404230714264938 * g + 0.1619570989212039 * b),
		100.0 * (0.2873043925181378 * r + 0.6662824449865162 * g + 0.04641318986585666 * b),
		100.0 * (0.0020467088152851167 * r + 0.04268157763059684 * g + 1.0443294130266956 * b));
}
vec3 xyz_betargb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.7531305192888733 * x - 0.38900909064713246 * y - 0.2545909143552041 * z;
	float g = -0.7578771606140942 * x + 1.673318517151835 * y + 0.043166012243613605 * z;
	float b = 0.027538480500785913 * x - 0.06762587070184567 * y + 0.9562870369338096 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
