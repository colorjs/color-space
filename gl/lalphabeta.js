// GLSL chunk: sRGB 0-255 <-> lαβ (Ruderman/Reinhard, l ~[-6,0], alpha ~[-1,0.9], beta ~[-0.21,0.21]).
// Device RGB -> LMS cones (paper eq. 4, lalphabeta.js's M/inv3(M)), log10 compression
// (log10 = ln(x)/ln(10) — no GLSL log10 builtin), then the orthonormal l/alpha/beta
// rotation (eq. 6). LMS floored at 1e-6 before the log, exactly as lalphabeta.js.
export default {
	name: 'lalphabeta',
	edges: { rgb: ['rgb_lalphabeta', 'lalphabeta_rgb'] },
	code: `
float lalphabeta_log10_(float x) {
	float v = x; if (v < 1.0e-6) { v = 1.0e-6; }
	return log(v) / log(10.0);
}
vec3 rgb_lalphabeta(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float lc = lalphabeta_log10_(0.3811 * r + 0.5783 * g + 0.0402 * b);
	float mc = lalphabeta_log10_(0.1967 * r + 0.7244 * g + 0.0782 * b);
	float sc = lalphabeta_log10_(0.0241 * r + 0.1288 * g + 0.8444 * b);
	return vec3(
		(lc + mc + sc) / sqrt(3.0),
		(lc + mc - 2.0 * sc) / sqrt(6.0),
		(lc - mc) / sqrt(2.0));
}
vec3 lalphabeta_rgb(vec3 c) {
	float t1 = c.x * sqrt(3.0) / 3.0;
	float t2 = c.y * sqrt(6.0) / 6.0;
	float t3 = c.z * sqrt(2.0) / 2.0;
	float lc = t1 + t2 + t3;
	float mc = t1 + t2 - t3;
	float sc = t1 - 2.0 * t2;
	float l10 = pow(10.0, lc); float m10 = pow(10.0, mc); float s10 = pow(10.0, sc);
	return vec3(
		255.0 * (4.468669863496255 * l10 - 3.588675903472126 * m10 + 0.11960436657860118 * s10),
		255.0 * (-1.2197166276177631 * l10 + 2.3830879129554567 * m10 - 0.16263011175140052 * s10),
		255.0 * (0.05850847693854588 * l10 - 0.2610784390276936 * m10 + 1.205665908525623 * s10));
}`,
}
