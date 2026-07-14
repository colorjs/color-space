// GLSL chunk: D-Log 0-1 <-> CIE XYZ D65 0-100, via D-Gamut linear RGB.
// Linear toe + log10 highlight, then D-Gamut -> XYZ matrix; mirrors dlog.js enc/dec
// and M (colour-science MATRIX_DJI_D_GAMUT_TO_XYZ); MI is M's exact inverse (inv3).
import xyz from './xyz.glsl.js'
export default {
	name: 'dlog',
	deps: [xyz],
	edges: { xyz: ['xyz_dlog', 'dlog_xyz'] },
	code: /* glsl */ `
float dlog_enc_(float x) {
	if (x <= 0.0078) { return 6.025 * x + 0.0929; }
	return (log(x * 0.9892 + 0.0108) / 2.302585092994046) * 0.256663 + 0.584555;
}
float dlog_dec_(float y) {
	if (y <= 0.14) { return (y - 0.0929) / 6.025; }
	return (pow(10.0, (y - 0.584555) / 0.256663) - 0.0108) / 0.9892;
}
vec3 dlog_xyz(vec3 c) {
	float r = dlog_dec_(c.x); float g = dlog_dec_(c.y); float b = dlog_dec_(c.z);
	return vec3(
		100.0 * (0.6482 * r + 0.1940 * g + 0.1082 * b),
		100.0 * (0.2830 * r + 0.8132 * g + -0.0962 * b),
		100.0 * (-0.0183 * r + -0.0832 * g + 1.1903 * b));
}
vec3 xyz_dlog(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.7256172712954423 * x - 0.43128461463188433 * y - 0.19171752388620864 * z;
	float g = -0.6023708376855555 * x + 1.390513766953038 * y + 0.167137653548231 * z;
	float b = -0.015574609452013466 * x + 0.09056392250922396 * y + 0.8488594657549318 * z;
	return vec3(dlog_enc_(r), dlog_enc_(g), dlog_enc_(b));
}`,
}
