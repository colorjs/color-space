// GLSL chunk: LogC3 (ARRI, EI 800) <-> CIE XYZ D65 0-100. ALEXA Wide Gamut 3 primaries.
// Mirrors logc3.js enc/dec + M/MI exactly.
export default {
	name: 'logc3',
	edges: { xyz: ['xyz_logc3', 'logc3_xyz'] },
	code: /* glsl */ `
float logc3_log10_(float x) { return log(x) / log(10.0); }
float logc3_dec_(float v) {
	if (v > 5.367655 * 0.010591 + 0.092809) { return (pow(10.0, (v - 0.385537) / 0.247190) - 0.052272) / 5.555556; }
	return (v - 0.092809) / 5.367655;
}
float logc3_enc_(float x) {
	if (x > 0.010591) { return 0.247190 * logc3_log10_(5.555556 * x + 0.052272) + 0.385537; }
	return 5.367655 * x + 0.092809;
}
vec3 logc3_xyz(vec3 c) {
	float r = logc3_dec_(c.x); float g = logc3_dec_(c.y); float b = logc3_dec_(c.z);
	return vec3(
		100.0 * (0.6380076193 * r + 0.2147038563 * g + 0.0977444514 * b),
		100.0 * (0.2919537790 * r + 0.8238410415 * g - 0.1157948205 * b),
		100.0 * (0.0027982790 * r - 0.0670342357 * g + 1.1532937074 * b));
}
vec3 xyz_logc3(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.789065550870615 * x - 0.4825338636668761 * y - 0.20007579286733604 * z;
	float g = -0.6398486598670743 * x + 1.3963999568410177 * y + 0.19443229174628007 * z;
	float b = -0.04153154580758554 * x + 0.08233537355363747 * y + 0.8788684803000081 * z;
	return vec3(logc3_enc_(r), logc3_enc_(g), logc3_enc_(b));
}`,
}
