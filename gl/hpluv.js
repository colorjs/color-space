// GLSL chunk: LCHuv <-> HPLuv (H 0-360, S/L 0-100) — pastel counterpart to HSLuv:
// rescales chroma by the single largest circle that fits inside the sRGB gamut at
// L (hue-independent). Mirrors hsluv.js getBounds()/maxSafeChromaForL(); same
// literals as wasm/batch.js's lchuv_hpluv/hpluv_lchuv.
export default {
	name: 'hpluv',
	edges: { lchuv: ['lchuv_hpluv', 'hpluv_lchuv'] },
	code: `
float hpluv_row_(float m1, float m2, float m3, float sub2, float l) {
	float top1 = (284517.0 * m1 - 94839.0 * m3) * sub2;
	float base2 = (838422.0 * m3 + 769860.0 * m2 + 731718.0 * m1) * l * sub2;
	float baseB = (632260.0 * m3 - 126452.0 * m2) * sub2;
	float slope0 = top1 / baseB; float intercept0 = base2 / baseB;
	float dist0 = abs(intercept0) / sqrt(slope0 * slope0 + 1.0);
	float slope1 = top1 / (baseB + 126452.0); float intercept1 = (base2 - 769860.0 * l) / (baseB + 126452.0);
	float dist1 = abs(intercept1) / sqrt(slope1 * slope1 + 1.0);
	if (dist1 < dist0) { return dist1; }
	return dist0;
}
float hpluv_maxsafechroma_(float l) {
	float sub1 = (l + 16.0) * (l + 16.0) * (l + 16.0) / 1560896.0;
	float sub2 = sub1;
	if (sub1 <= 216.0 / 24389.0) { sub2 = l / (24389.0 / 27.0); }
	float d0 = hpluv_row_(3.2409699419046056, -1.537383177570116, -0.4986107602930043, sub2, l);
	float d1 = hpluv_row_(-0.969243636280911, 1.875967501507741, 0.04155505740717699, sub2, l);
	float d2 = hpluv_row_(0.055630079696992636, -0.20397695888896836, 1.0569715142428788, sub2, l);
	float m = d0;
	if (d1 < m) { m = d1; }
	if (d2 < m) { m = d2; }
	return m;
}
vec3 lchuv_hpluv(vec3 c) {
	float l = c.x; float ch = c.y; float h = c.z;
	if (l > 99.9999999) { return vec3(h, 0.0, 100.0); }
	if (l < 1.0e-8) { return vec3(h, 0.0, 0.0); }
	return vec3(h, ch / hpluv_maxsafechroma_(l) * 100.0, l);
}
vec3 hpluv_lchuv(vec3 c) {
	float h = c.x; float s = c.y; float l = c.z;
	if (l > 99.9999999) { return vec3(100.0, 0.0, h); }
	if (l < 1.0e-8) { return vec3(0.0, 0.0, h); }
	return vec3(l, hpluv_maxsafechroma_(l) / 100.0 * s, h);
}`,
}
