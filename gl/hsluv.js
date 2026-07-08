// GLSL chunk: LCHuv <-> HSLuv (H 0-360, S/L 0-100) — rescales chroma so S=100 lands
// exactly on the sRGB gamut boundary at each (L,H). Mirrors hsluv.js getBounds()/
// maxChromaForLH(); the sRGB->XYZ inverse matrix and the unrolled 6-line bound scan
// are the same literals as wasm/batch.js's lchuv_hsluv/hsluv_lchuv.
export default {
	name: 'hsluv',
	edges: { lchuv: ['lchuv_hsluv', 'hsluv_lchuv'] },
	code: `
float hsluv_row_(float m1, float m2, float m3, float sub2, float l, float sh, float ch) {
	float top1 = (284517.0 * m1 - 94839.0 * m3) * sub2;
	float base2 = (838422.0 * m3 + 769860.0 * m2 + 731718.0 * m1) * l * sub2;
	float baseB = (632260.0 * m3 - 126452.0 * m2) * sub2;
	float best = 1.0e30;
	float len0 = base2 / baseB / (sh - (top1 / baseB) * ch);
	if (len0 >= 0.0) { best = len0; }
	float len1 = (base2 - 769860.0 * l) / (baseB + 126452.0) / (sh - (top1 / (baseB + 126452.0)) * ch);
	if (len1 >= 0.0 && len1 < best) { best = len1; }
	return best;
}
float hsluv_maxchroma_(float l, float h) {
	float sub1 = (l + 16.0) * (l + 16.0) * (l + 16.0) / 1560896.0;
	float sub2 = sub1;
	if (sub1 <= 216.0 / 24389.0) { sub2 = l / (24389.0 / 27.0); }
	float hrad = h / 360.0 * 2.0 * 3.141592653589793;
	float sh = sin(hrad); float ch = cos(hrad);
	float b0 = hsluv_row_(3.2409699419046056, -1.537383177570116, -0.4986107602930043, sub2, l, sh, ch);
	float b1 = hsluv_row_(-0.969243636280911, 1.875967501507741, 0.04155505740717699, sub2, l, sh, ch);
	float b2 = hsluv_row_(0.055630079696992636, -0.20397695888896836, 1.0569715142428788, sub2, l, sh, ch);
	float m = b0;
	if (b1 < m) { m = b1; }
	if (b2 < m) { m = b2; }
	return m;
}
vec3 lchuv_hsluv(vec3 c) {
	float l = c.x; float ch = c.y; float h = c.z;
	if (l > 99.9999999) { return vec3(h, 0.0, 100.0); }
	if (l < 1.0e-8) { return vec3(h, 0.0, 0.0); }
	return vec3(h, ch / hsluv_maxchroma_(l, h) * 100.0, l);
}
vec3 hsluv_lchuv(vec3 c) {
	float h = c.x; float s = c.y; float l = c.z;
	if (l > 99.9999999) { return vec3(100.0, 0.0, h); }
	if (l < 1.0e-8) { return vec3(0.0, 0.0, h); }
	return vec3(l, hsluv_maxchroma_(l, h) / 100.0 * s, h);
}`,
}
