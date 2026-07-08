// GLSL chunk: NTSC 1953 (illuminant C, Bradford-adapted to D65) 0-1 <-> CIE XYZ
// D65 0-100. Pure gamma 2.2, no linear toe.
// Mirrors ntsc.js M / inv3(M) and transfers.js gammaEncode/Decode(v, 2.2).
export default {
	name: 'ntsc',
	edges: { xyz: ['xyz_ntsc', 'ntsc_xyz'] },
	code: /* glsl */ `
float ntsc_dec_(float u) { return sign(u) * pow(abs(u), 2.2); }
float ntsc_enc_(float u) { return sign(u) * pow(abs(u), 1.0 / 2.2); }
vec3 ntsc_xyz(vec3 c) {
	float r = ntsc_dec_(c.x); float g = ntsc_dec_(c.y); float b = ntsc_dec_(c.z);
	return vec3(
		100.0 * (0.59890468 * r + 0.16686952 * g + 0.18468173 * b),
		100.0 * (0.29604814 * r + 0.59342244 * g + 0.11052942 * b),
		100.0 * (-0.00013817 * r + 0.06404973 * g + 1.02514619 * b));
}
vec3 xyz_ntsc(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.9211507427461076 * x - 0.5087902651879309 * y - 0.29124153487637494 * z;
	float g = -0.9697621757146261 * x + 1.9618093829467256 * y - 0.0368145512476795 * z;
	float b = 0.06084834682637759 * x - 0.12263973866999923 * y + 0.9777314991773136 * z;
	return vec3(ntsc_enc_(r), ntsc_enc_(g), ntsc_enc_(b));
}`,
}
