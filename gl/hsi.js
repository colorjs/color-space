// GLSL chunk: sRGB 0-255 <-> HSI (H 0-360, S/I 0-100). Mirrors hsi.js.
export default {
	name: 'hsi',
	edges: { rgb: ['rgb_hsi', 'hsi_rgb'] },
	code: `
vec3 rgb_hsi(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float sum = r + g + b;
	if (r == g && g == b) { return vec3(0.0, 0.0, sum / 3.0 * 100.0); }
	float rn = r / sum; float gn = g / sum; float bn = b / sum;
	float h = acos((0.5 * ((rn - gn) + (rn - bn))) / sqrt((rn - gn) * (rn - gn) + (rn - bn) * (gn - bn)));
	if (bn > gn) { h = 2.0 * 3.141592653589793 - h; }
	float s = 1.0 - 3.0 * min(rn, min(gn, bn));
	float i = sum / 3.0;
	return vec3(h / (2.0 * 3.141592653589793) * 360.0, s * 100.0, i * 100.0);
}
vec3 hsi_rgb(vec3 c) {
	float h = (c.x / 360.0) * 2.0 * 3.141592653589793; float s = c.y / 100.0; float ii = c.z / 100.0;
	h = mod_(h, 2.0 * 3.141592653589793);
	float pi3 = 3.141592653589793 / 3.0;
	float r = 0.0; float g = 0.0; float b = 0.0;
	if (h < 2.0 * pi3) {
		b = ii * (1.0 - s);
		r = ii * (1.0 + (s * cos(h) / cos(pi3 - h)));
		g = ii * (1.0 + (s * (1.0 - cos(h) / cos(pi3 - h))));
	} else if (h < 4.0 * pi3) {
		h = h - 2.0 * pi3;
		r = ii * (1.0 - s);
		g = ii * (1.0 + (s * cos(h) / cos(pi3 - h)));
		b = ii * (1.0 + (s * (1.0 - cos(h) / cos(pi3 - h))));
	} else {
		h = h - 4.0 * pi3;
		g = ii * (1.0 - s);
		b = ii * (1.0 + (s * cos(h) / cos(pi3 - h)));
		r = ii * (1.0 + (s * (1.0 - cos(h) / cos(pi3 - h))));
	}
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
