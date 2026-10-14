// GLSL chunk: Best RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, sign-extended.
// Mirrors bestrgb.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'bestrgb',
	deps: [xyz],
	edges: { xyz: ['xyz_bestrgb', 'bestrgb_xyz'] },
	code: /* glsl */ `
vec3 bestrgb_xyz(vec3 c) {
	float r = spow_(c.x, 2.2); float g = spow_(c.y, 2.2); float b = spow_(c.z, 2.2);
	return vec3(
		100.0 * (0.5993176099417291 * r + 0.179009960250767 * g + 0.1721283590469902 * b),
		100.0 * (0.2128256823638404 * r + 0.7390873587294723 * g + 0.04808698627719815 * b),
		100.0 * (0.003106066449028534 * r + 0.0000548994327301839 * g + 1.085896733590819 * b));
}
vec3 xyz_bestrgb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.827105856317641 * x - 0.4425124022391486 * y - 0.27002350773220574 * z;
	float g = -0.5257903712506599 * x + 1.4803672717821068 * y + 0.017789014853012104 * z;
	float b = -0.005199616530150375 * x + 0.0011909066142454826 * y + 0.9216693479143674 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
