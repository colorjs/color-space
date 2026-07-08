// GLSL chunk: Canon Log 3 <-> CIE XYZ D65 0-100. Cinema Gamut primaries (shared w/ CLog/CLog2).
// Mirrors clog3.js 3-piece enc/dec (÷0.9 reflection convention) + M/MI exactly.
export default {
	name: 'clog3',
	edges: { xyz: ['xyz_clog3', 'clog3_xyz'] },
	code: `
float clog3_log10_(float x) { return log(x) / log(10.0); }
float clog3_enc_(float x) {
	float xn = x / 0.9;
	if (xn < -0.014) { return -0.36726845 * clog3_log10_(1.0 - 14.98325 * xn) + 0.12783901; }
	if (xn <= 0.014) { return 1.9754798 * xn + 0.12512219; }
	return 0.36726845 * clog3_log10_(14.98325 * xn + 1.0) + 0.12240537;
}
float clog3_dec_(float y) {
	if (y < 0.097465473) { return -(pow(10.0, (0.12783901 - y) / 0.36726845) - 1.0) / 14.98325 * 0.9; }
	if (y <= 0.15277891) { return (y - 0.12512219) / 1.9754798 * 0.9; }
	return (pow(10.0, (y - 0.12240537) / 0.36726845) - 1.0) / 14.98325 * 0.9;
}
vec3 clog3_xyz(vec3 c) {
	float r = clog3_dec_(c.x); float g = clog3_dec_(c.y); float b = clog3_dec_(c.z);
	return vec3(
		100.0 * (0.716049646551520 * r + 0.129683477875740 * g + 0.104722802624412 * b),
		100.0 * (0.261261357525555 * r + 0.869642145754960 * g - 0.130903503280514 * b),
		100.0 * (-0.009676346575021 * r - 0.236481636126349 * g + 1.335215733461248 * b));
}
vec3 xyz_clog3(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.4898182749321844 * x - 0.2608959021837425 * y - 0.1424265217774013 * z;
	float g = -0.45816657446927334 * x + 1.2616277830502276 * y + 0.15962363162996496 * z;
	float b = -0.07034966772250137 * x + 0.22155766722563822 * y + 0.7761816036271035 * z;
	return vec3(clog3_enc_(r), clog3_enc_(g), clog3_enc_(b));
}`,
}
