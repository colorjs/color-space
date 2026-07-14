// GLSL chunk: CIE XYZ D65 0-100 <-> proLab (L 0-100, a/b ±125), Konovalenko et al. 2021.
// Single projective (4x4 homogeneous) transform in place of Lab's cube root; Q/QI
// are the paper's published matrices verbatim (prolab.js), not re-derived.
import xyz from './xyz.glsl.js'
export default {
	name: 'prolab',
	deps: [xyz],
	edges: { xyz: ['xyz_prolab', 'prolab_xyz'] },
	code: /* glsl */ `
vec3 xyz_prolab(vec3 c) {
	float xn = c.x / 95.0456; float yn = c.y / 100.0; float zn = c.z / 108.9058;
	float v0 = 75.54 * xn + 486.66 * yn + 167.39 * zn;
	float v1 = 617.72 * xn - 595.45 * yn - 22.27 * zn;
	float v2 = 48.34 * xn + 194.94 * yn - 243.28 * zn;
	float v3 = 0.7554 * xn + 3.8666 * yn + 1.6739 * zn + 1.0;
	return vec3(v0 / v3, v1 / v3, v2 / v3);
}
vec3 prolab_xyz(vec3 c) {
	float l = c.x; float a = c.y; float b = c.z;
	float v0 = 0.0013706328 * l + 0.0013873820 * a + 0.0008160689 * b;
	float v1 = 0.0013706328 * l - 0.0002431549 * a + 0.0009653292 * b;
	float v2 = 0.0013706328 * l + 0.0000808346 * a - 0.0031748190 * b;
	float v3 = -0.0086293672 * l - 0.0002431549 * a + 0.0009653292 * b + 1.0;
	return vec3(95.0456 * v0 / v3, 100.0 * v1 / v3, 108.9058 * v2 / v3);
}`,
}
