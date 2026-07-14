// GLSL chunk: CIE XYZ 0-100 <-> RLAB (Fairchild 1996, L 0-100, a/b ±125).
// Baked to the paper's reference viewing condition (Illuminant A, Yn=31.83,
// sigma=1/2.3 average surround, D=1 hard-copy) exactly as rlab.js; M/MI are that
// module's precomputed von-Kries adaptation matrix (HPE cones) and its inverse.
import xyz from './xyz.glsl.js'
export default {
	name: 'rlab',
	deps: [xyz],
	edges: { xyz: ['xyz_rlab', 'rlab_xyz'] },
	code: /* glsl */ `
vec3 xyz_rlab(vec3 c) {
	float xr = 0.009884447260336647 * c.x - 0.002460970928159542 * c.y + 0.004505074796738987 * c.z;
	float yr = -0.00025692864731414393 * c.x + 0.01026374924415157 * c.y + 0.00005195861417374258 * c.z;
	float zr = 0.028105677346824058 * c.z;
	float sigma = 1.0 / 2.3;
	float pxr = spow_(xr, sigma); float pyr = spow_(yr, sigma); float pzr = spow_(zr, sigma);
	return vec3(100.0 * pyr, 430.0 * (pxr - pyr), 170.0 * (pyr - pzr));
}
vec3 rlab_xyz(vec3 c) {
	float sigma = 1.0 / 2.3;
	float yrs = spow_(c.x / 100.0, 1.0);
	float yr = spow_(c.x / 100.0, 1.0 / sigma);
	float xr = spow_(c.y / 430.0 + yrs, 1.0 / sigma);
	float zr = spow_(yrs - c.z / 170.0, 1.0 / sigma);
	return vec3(
		101.80352391335948 * xr + 24.40974606601298 * yr - 16.36326997937242 * zr,
		2.5484100467260298 * xr + 98.04132379904063 * yr - 0.5897338457666503 * zr,
		35.58 * zr);
}`,
}
