// GLSL chunk: PAL/SECAM 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, no linear toe.
// Mirrors pal.js M / inv3(M) and transfers.js gammaEncode/Decode(v, 2.2).
import xyz from './xyz.glsl.js'
export default {
	name: 'pal',
	deps: [xyz],
	edges: { xyz: ['xyz_pal', 'pal_xyz'] },
	code: /* glsl */ `
float pal_dec_(float u) { return sign(u) * pow(abs(u), 2.2); }
float pal_enc_(float u) { return sign(u) * pow(abs(u), 1.0 / 2.2); }
vec3 pal_xyz(vec3 c) {
	float r = pal_dec_(c.x); float g = pal_dec_(c.y); float b = pal_dec_(c.z);
	return vec3(
		100.0 * (0.43055381 * r + 0.34154980 * g + 0.17835231 * b),
		100.0 * (0.22200431 * r + 0.70665477 * g + 0.07134092 * b),
		100.0 * (0.02018221 * r + 0.12955337 * g + 0.93932217 * b));
}
vec3 xyz_pal(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 3.063361106835459 * x - 1.3933901606943229 * y - 0.47582374616515244 * z;
	float g = -0.9692436351055882 * x + 1.875967483863757 * y + 0.04155506633571009 * z;
	float b = 0.06786104294226718 * x - 0.2287992592678865 * y + 1.0690896137197816 * z;
	return vec3(pal_enc_(r), pal_enc_(g), pal_enc_(b));
}`,
}
