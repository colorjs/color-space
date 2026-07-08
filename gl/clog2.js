// GLSL chunk: Canon Log 2 <-> CIE XYZ D65 0-100. Cinema Gamut primaries (shared w/ CLog/CLog3).
// Mirrors clog2.js decode/encode; same decomposition/constants as wasm/batch.js xyz_clog2.
export default {
	name: 'clog2',
	edges: { xyz: ['xyz_clog2', 'clog2_xyz'] },
	code: `
float clog2_log10_(float x) { return log(x) / log(10.0); }
float clog2_dec_(float v) {
	if (v >= 0.092864125) { return (pow(10.0, (v - 0.092864125) / 0.24136077) - 1.0) / 87.09937546 * 0.9; }
	return -(pow(10.0, (0.092864125 - v) / 0.24136077) - 1.0) / 87.09937546 * 0.9;
}
float clog2_enc_(float l) {
	float s = l / 0.9;
	if (s >= 0.0) { return 0.24136077 * clog2_log10_(s * 87.09937546 + 1.0) + 0.092864125; }
	return 0.092864125 - 0.24136077 * clog2_log10_(-s * 87.09937546 + 1.0);
}
vec3 clog2_xyz(vec3 c) {
	float r = clog2_dec_(c.x); float g = clog2_dec_(c.y); float b = clog2_dec_(c.z);
	return vec3(
		100.0 * (0.716049646551520 * r + 0.129683477875740 * g + 0.104722802624412 * b),
		100.0 * (0.261261357525555 * r + 0.869642145754960 * g - 0.130903503280514 * b),
		100.0 * (-0.009676346575021 * r - 0.236481636126349 * g + 1.335215733461248 * b));
}
vec3 xyz_clog2(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.4898182749321844 * x - 0.2608959021837425 * y - 0.1424265217774013 * z;
	float g = -0.45816657446927334 * x + 1.2616277830502276 * y + 0.15962363162996496 * z;
	float b = -0.07034966772250137 * x + 0.22155766722563822 * y + 0.7761816036271035 * z;
	return vec3(clog2_enc_(r), clog2_enc_(g), clog2_enc_(b));
}`,
}
