// GLSL chunk: sRGB 0-255 <-> HSM (H 0-360, S/M 0-100). Mirrors hsm.js
// (Bianconi et al. 2009 skin-color model, M = (4R+2G+B)/7).
export default {
	name: 'hsm',
	edges: { rgb: ['rgb_hsm', 'hsm_rgb'] },
	code: `
float hsm_D_(float m) {
	if (m <= 0.0 || m >= 1.0) { return 0.0; }
	float best = 0.0; float d = 0.0; float t = 0.0;
	if (m <= 4.0 / 7.0) { t = 7.0 * m / 4.0; d = sqrt((t - m) * (t - m) + m * m + m * m); if (d > best) { best = d; } }
	if (m >= 1.0 / 7.0 && m <= 5.0 / 7.0) { t = (7.0 * m - 1.0) / 4.0; d = sqrt((t - m) * (t - m) + m * m + (1.0 - m) * (1.0 - m)); if (d > best) { best = d; } }
	if (m >= 2.0 / 7.0 && m <= 6.0 / 7.0) { t = (7.0 * m - 2.0) / 4.0; d = sqrt((t - m) * (t - m) + (1.0 - m) * (1.0 - m) + m * m); if (d > best) { best = d; } }
	if (m >= 3.0 / 7.0) { t = (7.0 * m - 3.0) / 4.0; d = sqrt((t - m) * (t - m) + (1.0 - m) * (1.0 - m) + (1.0 - m) * (1.0 - m)); if (d > best) { best = d; } }
	if (m <= 2.0 / 7.0) { t = 7.0 * m / 2.0; d = sqrt(m * m + (t - m) * (t - m) + m * m); if (d > best) { best = d; } }
	if (m >= 1.0 / 7.0 && m <= 3.0 / 7.0) { t = (7.0 * m - 1.0) / 2.0; d = sqrt(m * m + (t - m) * (t - m) + (1.0 - m) * (1.0 - m)); if (d > best) { best = d; } }
	if (m >= 4.0 / 7.0 && m <= 6.0 / 7.0) { t = (7.0 * m - 4.0) / 2.0; d = sqrt((1.0 - m) * (1.0 - m) + (t - m) * (t - m) + m * m); if (d > best) { best = d; } }
	if (m >= 5.0 / 7.0) { t = (7.0 * m - 5.0) / 2.0; d = sqrt((1.0 - m) * (1.0 - m) + (t - m) * (t - m) + (1.0 - m) * (1.0 - m)); if (d > best) { best = d; } }
	if (m <= 1.0 / 7.0) { t = 7.0 * m; d = sqrt(m * m + m * m + (t - m) * (t - m)); if (d > best) { best = d; } }
	if (m >= 2.0 / 7.0 && m <= 3.0 / 7.0) { t = 7.0 * m - 2.0; d = sqrt(m * m + (1.0 - m) * (1.0 - m) + (t - m) * (t - m)); if (d > best) { best = d; } }
	if (m >= 4.0 / 7.0 && m <= 5.0 / 7.0) { t = 7.0 * m - 4.0; d = sqrt((1.0 - m) * (1.0 - m) + m * m + (t - m) * (t - m)); if (d > best) { best = d; } }
	if (m >= 6.0 / 7.0) { t = 7.0 * m - 6.0; d = sqrt((1.0 - m) * (1.0 - m) + (1.0 - m) * (1.0 - m) + (t - m) * (t - m)); if (d > best) { best = d; } }
	return best;
}
vec3 rgb_hsm(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float m = (4.0 * r + 2.0 * g + b) / 7.0;
	float dr = r - m; float dg = g - m; float db = b - m;
	float d = sqrt(dr * dr + dg * dg + db * db);
	float theta = 0.0;
	if (d >= 1e-12) {
		float arg = (3.0 * dr - 4.0 * dg - 4.0 * db) / (sqrt(41.0) * d);
		theta = acos(clamp(arg, -1.0, 1.0));
	}
	float h = 0.0;
	if (b <= g) { h = theta / (2.0 * 3.141592653589793); }
	else { h = 1.0 - theta / (2.0 * 3.141592653589793); }
	float Dm = hsm_D_(m);
	float s = 0.0;
	if (Dm >= 1e-12) { s = d / Dm; }
	return vec3(h * 360.0, s * 100.0, m * 100.0);
}
vec3 hsm_rgb(vec3 c) {
	float h = c.x / 360.0; float s = c.y / 100.0; float m = c.z / 100.0;
	float sqrt41 = sqrt(41.0); float sqrt861 = sqrt(861.0);
	float u0 = 3.0 / sqrt41; float u1 = -4.0 / sqrt41; float u2 = -4.0 / sqrt41;
	float v0 = -4.0 / sqrt861; float v1 = 19.0 / sqrt861; float v2 = -22.0 / sqrt861;
	float R = s * hsm_D_(m);
	float cosT = cos(2.0 * 3.141592653589793 * h);
	float sinT = sin(2.0 * 3.141592653589793 * h);
	float r = clamp(m + R * (u0 * cosT + v0 * sinT), 0.0, 1.0);
	float g = clamp(m + R * (u1 * cosT + v1 * sinT), 0.0, 1.0);
	float b = clamp(m + R * (u2 * cosT + v2 * sinT), 0.0, 1.0);
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
