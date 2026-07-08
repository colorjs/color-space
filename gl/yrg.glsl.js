// GLSL chunk: CIE XYZ D65 0-100 <-> Yrg (Kirk 2019). Mirrors yrg.js: CIE 2006
// cone matrix M, chromaticity ratios l = L/(L+m+S), mm = m/(L+m+S) guarded at
// a===0 (JS falsy check), affine map to r,g; the exact-inverse affine solve
// (JS comment: Kirk's published inverse uses rounded coefficients, this solves
// exactly) guarded at d===0 the same way.
export default {
	name: 'yrg',
	edges: { xyz: ['xyz_yrg', 'yrg_xyz'] },
	code: /* glsl */ `
vec3 xyz_yrg(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float L = 0.257085 * x + 0.859943 * y - 0.031061 * z;
	float m = -0.394427 * x + 1.175800 * y + 0.106423 * z;
	float S = 0.064856 * x - 0.076250 * y + 0.559067 * z;
	float a = L + m + S;
	float l = 0.0; float mm = 0.0;
	if (a != 0.0) { l = L / a; mm = m / a; }
	return vec3(
		0.68990272 * L + 0.34832189 * m,
		1.0671 * l - 0.6873 * mm + 0.02062,
		-0.0362 * l + 1.7182 * mm - 0.05155);
}
vec3 yrg_xyz(vec3 c) {
	float Y = c.x; float r = c.y; float g = c.z;
	float det = 1.0671 * 1.7182 - 0.6873 * 0.0362;
	float l = (1.7182 * (r - 0.02062) + 0.6873 * (g + 0.05155)) / det;
	float mm = (0.0362 * (r - 0.02062) + 1.0671 * (g + 0.05155)) / det;
	float d = 0.68990272 * l + 0.34832189 * mm;
	float a = 0.0;
	if (d != 0.0) { a = Y / d; }
	float L = l * a; float m = mm * a; float S = (1.0 - l - mm) * a;
	return vec3(
		100.0 * (1.8079465913797308 * L - 1.2997166040306944 * m + 0.3478587883484527 * S),
		100.0 * (0.6178396000801114 * L + 0.39595453018004934 * m - 0.04104687478828665 * S),
		100.0 * (-0.12546960315027594 * L + 0.2047803805219115 * m + 1.742741829190895 * S));
}`,
}
