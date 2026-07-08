// GLSL chunk: sRGB 0-255 <-> HCY (H 0-360, C/Y 0-100). Mirrors hcy.js (Kuzma Shapran / Chilliant).
// Rec.601 luma weights 0.299/0.587/0.114, as in hcy.js.
export default {
	name: 'hcy',
	edges: { rgb: ['rgb_hcy', 'hcy_rgb'] },
	code: /* glsl */ `
float hcy_hr_(float H) { return min(1.0, max(0.0, abs(H * 6.0 - 3.0) - 1.0)); }
float hcy_hg_(float H) { return min(1.0, max(0.0, 2.0 - abs(H * 6.0 - 2.0))); }
float hcy_hb_(float H) { return min(1.0, max(0.0, 2.0 - abs(H * 6.0 - 4.0))); }
float hcy_luma_(float r, float g, float b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
vec3 rgb_hcy(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float mx = max(r, max(g, b)); float mn = min(r, min(g, b));
	float C = mx - mn;
	float H = 0.0;
	if (C != 0.0) {
		if (mx == r) { H = mod_((g - b) / C, 6.0); }
		else if (mx == g) { H = (b - r) / C + 2.0; }
		else { H = (r - g) / C + 4.0; }
		H = H / 6.0;
	}
	float Y = hcy_luma_(r, g, b);
	float hr = hcy_hr_(H); float hg = hcy_hg_(H); float hb = hcy_hb_(H);
	float Z = hcy_luma_(hr, hg, hb);
	if (C != 0.0) {
		if (Y < Z) { C = C * (Z / Y); }
		else { C = C * (1.0 - Z) / (1.0 - Y); }
	}
	return vec3(H * 360.0, C * 100.0, Y * 100.0);
}
vec3 hcy_rgb(vec3 c) {
	float H = c.x / 360.0; float C = c.y / 100.0; float Y = c.z / 100.0;
	float hr = hcy_hr_(H); float hg = hcy_hg_(H); float hb = hcy_hb_(H);
	float Z = hcy_luma_(hr, hg, hb);
	if (Y < Z) {
		if (Z != 0.0) { C = C * (Y / Z); }
	} else if (Z < 1.0) {
		C = C * (1.0 - Y) / (1.0 - Z);
	}
	return vec3(((hr - Z) * C + Y) * 255.0, ((hg - Z) * C + Y) * 255.0, ((hb - Z) * C + Y) * 255.0);
}`,
}
