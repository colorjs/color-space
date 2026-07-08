// GLSL chunk: sRGB 0-255 <-> TSL (T 0-360, S 0-1, L 0-255). Mirrors tsl.js
// (Terrillon & Akamatsu 2000). L stays in 0-255, matching tsl.js's native range.
export default {
	name: 'tsl',
	edges: { rgb: ['rgb_tsl', 'tsl_rgb'] },
	code: `
vec3 rgb_tsl(vec3 c) {
	float r = c.x; float g = c.y; float b = c.z;
	float sum = r + g + b;
	if (sum == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float rp = r / sum - 1.0 / 3.0;
	float gp = g / sum - 1.0 / 3.0;
	float T = 0.0;
	if (rp == 0.0 && gp == 0.0) { T = 0.0; }
	else { T = 0.5 - atan2_(gp, rp) / (2.0 * 3.141592653589793); }
	float S = sqrt(9.0 / 5.0 * (rp * rp + gp * gp));
	float L = r * 0.299 + g * 0.587 + b * 0.114;
	return vec3(T * 360.0, S, L);
}
vec3 tsl_rgb(vec3 c) {
	float T = c.x; float S = c.y; float L = c.z;
	float theta = 3.141592653589793 * (1.0 - T / 180.0);
	float m = S * sqrt(5.0) / 3.0;
	float nr = m * cos(theta) + 1.0 / 3.0;
	float ng = m * sin(theta) + 1.0 / 3.0;
	float k = L / (0.185 * nr + 0.473 * ng + 0.114);
	return vec3(k * nr, k * ng, k * (1.0 - nr - ng));
}`,
}
