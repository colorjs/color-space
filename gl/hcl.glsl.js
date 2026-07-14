// GLSL chunk: sRGB 0-255 <-> HCL (H 0-360, C/L 0-100). Mirrors hcl.js — the Chilliant
// rgb2hsv variant (unrelated to CIE LCh, despite the shared abbreviation).
export default {
	name: 'hcl',
	edges: { rgb: ['rgb_hcl', 'hcl_rgb'] },
	code: /* glsl */ `
float hcl_frac_(float x) { return x - floor(x); }
vec3 rgb_hcl(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float H = 0.0;
	float U = min(r, min(g, b));
	float V = max(r, max(g, b));
	float Q = 3.0 / 100.0;
	float C = V - U;
	if (C != 0.0) {
		H = atan2_(g - b, r - g) / 3.141592653589793;
		Q = Q * (U / V);
	}
	Q = exp(Q);
	H = hcl_frac_(H / 2.0 - min(hcl_frac_(H), hcl_frac_(-H)) / 6.0);
	float Cadj = C * Q;
	float L = ((V + U) * Q - U) / (0.530454533953517 * 2.0);
	return vec3(H * 360.0, Cadj * 100.0, L * 100.0);
}
vec3 hcl_rgb(vec3 c) {
	float h = c.x / 360.0; float ch = c.y / 100.0; float l = c.z / 100.0;
	if (l == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float L = l * 0.530454533953517;
	float Q = exp((1.0 - ch / (2.0 * L)) * (3.0 / 100.0));
	float U = (2.0 * L - ch) / (2.0 * Q - 1.0);
	float V = ch / Q;
	float A = (h + min(hcl_frac_(2.0 * h) / 4.0, hcl_frac_(-2.0 * h) / 8.0)) * 3.141592653589793 * 2.0;
	float H6 = h * 6.0;
	float r = 0.0; float g = 0.0; float b = 0.0;
	float T = 0.0;
	if (H6 <= 0.999) { T = tan(A); r = 1.0; g = T / (1.0 + T); }
	else if (H6 <= 1.001) { r = 1.0; g = 1.0; }
	else if (H6 <= 2.0) { T = tan(A); r = (1.0 + T) / T; g = 1.0; }
	else if (H6 <= 3.0) { T = tan(A); g = 1.0; b = 1.0 + T; }
	else if (H6 <= 3.999) { T = tan(A); g = 1.0 / (1.0 + T); b = 1.0; }
	else if (H6 <= 4.001) { g = 0.0; b = 1.0; }
	else if (H6 <= 5.0) { T = tan(A); r = -1.0 / T; b = 1.0; }
	else { T = tan(A); r = 1.0; b = -T; }
	return vec3((r * V + U) * 255.0, (g * V + U) * 255.0, (b * V + U) * 255.0);
}`,
}
