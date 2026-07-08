// GLSL chunk: Adobe RGB (1998) 0-1 <-> linear-light Adobe RGB (a98rgb-linear).
// Pure power-law gamma (563/256 and its inverse), sign-extended; mirrors a98rgb.js.
export default {
	name: 'a98rgb',
	edges: { 'a98rgb-linear': ['a98rgblinear_a98rgb', 'a98rgb_a98rgblinear'] },
	code: /* glsl */ `
vec3 a98rgblinear_a98rgb(vec3 c) {
	return vec3(spow_(c.x, 256.0 / 563.0), spow_(c.y, 256.0 / 563.0), spow_(c.z, 256.0 / 563.0));
}
vec3 a98rgb_a98rgblinear(vec3 c) {
	return vec3(spow_(c.x, 563.0 / 256.0), spow_(c.y, 563.0 / 256.0), spow_(c.z, 563.0 / 256.0));
}`,
}
