// GLSL chunk: CIE XYZ D65 0-100 <-> MacLeod-Boynton chromaticity (l 0.4-1, s 0-1,
// Y 0-100). Mirrors macboyn.js: same Smith-Pokorny cone matrix as dkl.js (no white
// subtraction here); achromatic (lum==0) inputs sit at the D65 white's (l, s).
// Inverse is inv3(M), same literals as gl/dkl.js's dkl_xyz (independently embedded
// per chunk-isolation).
export default {
	name: 'macboyn',
	edges: { xyz: ['xyz_macboyn', 'macboyn_xyz'] },
	code: `
vec3 xyz_macboyn(vec3 c) {
	float L = 0.15514 * c.x + 0.54312 * c.y - 0.03286 * c.z;
	float m = -0.15514 * c.x + 0.45684 * c.y + 0.03286 * c.z;
	float S = 0.01608 * c.z;
	float lum = L + m;
	if (lum == 0.0) { return vec3(0.65481348737232159, 0.017512749142184529, 0.0); }
	return vec3(L / lum, S / lum, lum);
}
vec3 macboyn_xyz(vec3 c) {
	float l = c.x; float s = c.y; float lum = c.z;
	float L = l * lum; float m = (1.0 - l) * lum; float S = s * lum;
	return vec3(
		2.9448129066067628 * L - 3.5009779919364874 * m + 13.172182147147465 * S,
		1.000040001600064 * L + 1.000040001600064 * m,
		62.189054726368155 * S);
}`,
}
