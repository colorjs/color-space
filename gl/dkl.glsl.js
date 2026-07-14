// GLSL chunk: CIE XYZ D65 0-100 <-> DKL cardinal-axis space. Mirrors dkl.js:
// Smith-Pokorny cone matrix M, subtracting the D65 cone white (mat3(M, 95.0456,
// 100, 108.9058) — dkl.js's own rounded literal, not xyz.js's full-precision
// whitepoint). Inverse matrix is inv3(M) (computed once, embedded as literals,
// same source of truth as dkl.js's runtime inv3(M)).
import xyz from './xyz.glsl.js'
export default {
	name: 'dkl',
	deps: [xyz],
	edges: { xyz: ['xyz_dkl', 'dkl_xyz'] },
	code: /* glsl */ `
vec3 xyz_dkl(vec3 c) {
	float L = 0.15514 * c.x + 0.54312 * c.y - 0.03286 * c.z;
	float m = -0.15514 * c.x + 0.45684 * c.y + 0.03286 * c.z;
	float S = 0.01608 * c.z;
	float Lw = 65.478729796; float Mw = 34.517270204000006; float Sw = 1.751205264;
	return vec3((L + m) - (Lw + Mw), (L - m) - (Lw - Mw), (S - (L + m)) - (Sw - (Lw + Mw)));
}
vec3 dkl_xyz(vec3 c) {
	float Lw = 65.478729796; float Mw = 34.517270204000006; float Sw = 1.751205264;
	float sum = c.x + (Lw + Mw);
	float diff = c.y + (Lw - Mw);
	float L = (sum + diff) / 2.0; float m = (sum - diff) / 2.0;
	float S = c.z + sum + (Sw - (Lw + Mw));
	return vec3(
		2.9448129066067628 * L - 3.5009779919364874 * m + 13.172182147147465 * S,
		1.000040001600064 * L + 1.000040001600064 * m,
		62.189054726368155 * S);
}`,
}
