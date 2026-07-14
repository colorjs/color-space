// GLSL chunk: sRGB 0-255 <-> HSP (H 0-360, S/P 0-100). Mirrors hsp.js (Darel Rex Finley).
// Rec.601-weighted perceived brightness: Pr=0.299 Pg=0.587 Pb=0.114 (inlined, as in hsp.js).
export default {
	name: 'hsp',
	edges: { rgb: ['rgb_hsp', 'hsp_rgb'] },
	code: /* glsl */ `
vec3 rgb_hsp(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float p = sqrt(r * r * 0.299 + g * g * 0.587 + b * b * 0.114);
	float h = 0.0; float s = 0.0;
	if (r == g && r == b) {
		h = 0.0; s = 0.0;
	} else {
		if (r >= g && r >= b) {
			if (b > g) { h = 6.0 / 6.0 - 1.0 / 6.0 * (b - g) / (r - g); s = 1.0 - g / r; }
			else { h = 0.0 / 6.0 + 1.0 / 6.0 * (g - b) / (r - b); s = 1.0 - b / r; }
		}
		if (g >= r && g >= b) {
			if (r >= b) { h = 2.0 / 6.0 - 1.0 / 6.0 * (r - b) / (g - b); s = 1.0 - b / g; }
			else { h = 2.0 / 6.0 + 1.0 / 6.0 * (b - r) / (g - r); s = 1.0 - r / g; }
		}
		if (b >= r && b >= g) {
			if (g >= r) { h = 4.0 / 6.0 - 1.0 / 6.0 * (g - r) / (b - r); s = 1.0 - r / b; }
			else { h = 4.0 / 6.0 + 1.0 / 6.0 * (r - g) / (b - g); s = 1.0 - g / b; }
		}
	}
	return vec3(h * 360.0, s * 100.0, p * 100.0);
}
vec3 hsp_rgb(vec3 c) {
	float h = c.x / 360.0; float s = c.y / 100.0; float p = c.z / 100.0;
	float mom = 1.0 - s;
	float r = 0.0; float g = 0.0; float b = 0.0; float part = 0.0;
	if (mom > 0.0) {
		if (h < 1.0 / 6.0) {
			h = 6.0 * (h - 0.0 / 6.0);
			part = 1.0 + h * (1.0 / mom - 1.0);
			b = p / sqrt(0.299 / mom / mom + 0.587 * part * part + 0.114);
			r = b / mom;
			g = b + h * (r - b);
		} else if (h < 2.0 / 6.0) {
			h = 6.0 * (-h + 2.0 / 6.0);
			part = 1.0 + h * (1.0 / mom - 1.0);
			b = p / sqrt(0.587 / mom / mom + 0.299 * part * part + 0.114);
			g = b / mom;
			r = b + h * (g - b);
		} else if (h < 3.0 / 6.0) {
			h = 6.0 * (h - 2.0 / 6.0);
			part = 1.0 + h * (1.0 / mom - 1.0);
			r = p / sqrt(0.587 / mom / mom + 0.114 * part * part + 0.299);
			g = r / mom;
			b = r + h * (g - r);
		} else if (h < 4.0 / 6.0) {
			h = 6.0 * (-h + 4.0 / 6.0);
			part = 1.0 + h * (1.0 / mom - 1.0);
			r = p / sqrt(0.114 / mom / mom + 0.587 * part * part + 0.299);
			b = r / mom;
			g = r + h * (b - r);
		} else if (h < 5.0 / 6.0) {
			h = 6.0 * (h - 4.0 / 6.0);
			part = 1.0 + h * (1.0 / mom - 1.0);
			g = p / sqrt(0.114 / mom / mom + 0.299 * part * part + 0.587);
			b = g / mom;
			r = g + h * (b - g);
		} else {
			h = 6.0 * (-h + 6.0 / 6.0);
			part = 1.0 + h * (1.0 / mom - 1.0);
			g = p / sqrt(0.299 / mom / mom + 0.114 * part * part + 0.587);
			r = g / mom;
			b = g + h * (r - g);
		}
	} else {
		if (h < 1.0 / 6.0) {
			h = 6.0 * (h - 0.0 / 6.0);
			r = sqrt(p * p / (0.299 + 0.587 * h * h));
			g = r * h;
			b = 0.0;
		} else if (h < 2.0 / 6.0) {
			h = 6.0 * (-h + 2.0 / 6.0);
			g = sqrt(p * p / (0.587 + 0.299 * h * h));
			r = g * h;
			b = 0.0;
		} else if (h < 3.0 / 6.0) {
			h = 6.0 * (h - 2.0 / 6.0);
			g = sqrt(p * p / (0.587 + 0.114 * h * h));
			b = g * h;
			r = 0.0;
		} else if (h < 4.0 / 6.0) {
			h = 6.0 * (-h + 4.0 / 6.0);
			b = sqrt(p * p / (0.114 + 0.587 * h * h));
			g = b * h;
			r = 0.0;
		} else if (h < 5.0 / 6.0) {
			h = 6.0 * (h - 4.0 / 6.0);
			b = sqrt(p * p / (0.114 + 0.299 * h * h));
			r = b * h;
			g = 0.0;
		} else {
			h = 6.0 * (-h + 6.0 / 6.0);
			r = sqrt(p * p / (0.299 + 0.114 * h * h));
			b = r * h;
			g = 0.0;
		}
	}
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
