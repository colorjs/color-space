// GLSL chunk: Apple RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 1.8, no linear toe.
// Mirrors apple-rgb.js M / inv3(M) and transfers.js gammaEncode/Decode(v, 1.8).
export default {
	name: 'apple-rgb',
	edges: { xyz: ['xyz_applergb', 'applergb_xyz'] },
	code: `
float applergb_dec_(float u) { return sign(u) * pow(abs(u), 1.8); }
float applergb_enc_(float u) { return sign(u) * pow(abs(u), 1.0 / 1.8); }
vec3 applergb_xyz(vec3 c) {
	float r = applergb_dec_(c.x); float g = applergb_dec_(c.y); float b = applergb_dec_(c.z);
	return vec3(
		100.0 * (0.44966162 * r + 0.31625612 * g + 0.18453819 * b),
		100.0 * (0.24461592 * r + 0.67204425 * g + 0.08333983 * b),
		100.0 * (0.02518105 * r + 0.14118577 * g + 0.92269093 * b));
}
vec3 xyz_applergb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.9519784936928604 * x - 1.2896043168923152 * y - 0.47391531594218134 * z;
	float g = -1.0850835719313674 * x + 1.9908093455683555 * y + 0.0372016726563805 * z;
	float b = 0.08547221935830218 * x - 0.2694297207336622 * y + 1.0910276732288102 * z;
	return vec3(applergb_enc_(r), applergb_enc_(g), applergb_enc_(b));
}`,
}
