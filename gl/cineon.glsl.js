// GLSL chunk: Cineon <-> linear-light RGB 0-1 (SMPTE 268M). No native gamut of its
// own — edges to lrgb. Mirrors cineon.js decode/encode (black 95/white 685 over 10 bits).
export default {
	name: 'cineon',
	edges: { lrgb: ['lrgb_cineon', 'cineon_lrgb'] },
	code: /* glsl */ `
float cineon_dec_(float y) {
	float bo = pow(10.0, (95.0 - 685.0) / 300.0);
	return (pow(10.0, (1023.0 * y - 685.0) / 300.0) - bo) / (1.0 - bo);
}
float cineon_enc_(float x) {
	float bo = pow(10.0, (95.0 - 685.0) / 300.0);
	return (685.0 + 300.0 * (log(x * (1.0 - bo) + bo) / log(10.0))) / 1023.0;
}
vec3 lrgb_cineon(vec3 c) {
	return vec3(cineon_enc_(c.x), cineon_enc_(c.y), cineon_enc_(c.z));
}
vec3 cineon_lrgb(vec3 c) {
	return vec3(cineon_dec_(c.x), cineon_dec_(c.y), cineon_dec_(c.z));
}`,
}
