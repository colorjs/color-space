// GLSL chunk: Canon Log <-> CIE XYZ D65 0-100. Cinema Gamut primaries (shared w/ CLog2/CLog3).
// Mirrors clog.js enc/dec (÷0.9 reflection convention) + M/MI exactly.
export default {
	name: 'clog',
	edges: { xyz: ['xyz_clog', 'clog_xyz'] },
	code: `
float clog_log10_(float x) { return log(x) / log(10.0); }
float clog_dec_(float v) {
	if (v >= 0.12512248) { return (pow(10.0, (v - 0.12512248) / 0.45310179) - 1.0) / 10.1596 * 0.9; }
	return -(pow(10.0, (0.12512248 - v) / 0.45310179) - 1.0) / 10.1596 * 0.9;
}
float clog_enc_(float x) {
	float xn = x / 0.9;
	if (xn >= 0.0) { return 0.45310179 * clog_log10_(10.1596 * xn + 1.0) + 0.12512248; }
	return -(0.45310179 * clog_log10_(1.0 - 10.1596 * xn) - 0.12512248);
}
vec3 clog_xyz(vec3 c) {
	float r = clog_dec_(c.x); float g = clog_dec_(c.y); float b = clog_dec_(c.z);
	return vec3(
		100.0 * (0.716049646551520 * r + 0.129683477875740 * g + 0.104722802624412 * b),
		100.0 * (0.261261357525555 * r + 0.869642145754960 * g - 0.130903503280514 * b),
		100.0 * (-0.009676346575021 * r - 0.236481636126349 * g + 1.335215733461248 * b));
}
vec3 xyz_clog(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.4898182749321844 * x - 0.2608959021837425 * y - 0.1424265217774013 * z;
	float g = -0.45816657446927334 * x + 1.2616277830502276 * y + 0.15962363162996496 * z;
	float b = -0.07034966772250137 * x + 0.22155766722563822 * y + 0.7761816036271035 * z;
	return vec3(clog_enc_(r), clog_enc_(g), clog_enc_(b));
}`,
}
