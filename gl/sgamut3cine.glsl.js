// GLSL chunk: S-Gamut3.Cine (Sony) <-> CIE XYZ D65 0-100. S-Log3 curve over S-Gamut3.Cine primaries.
// Mirrors sgamut3cine.js decode/encode + M/MI.
import xyz from './xyz.glsl.js'
export default {
	name: 'sgamut3cine',
	deps: [xyz],
	edges: { xyz: ['xyz_sgamut3cine', 'sgamut3cine_xyz'] },
	code: /* glsl */ `
float sgamut3cine_log10_(float x) { return log(x) / log(10.0); }
float sgamut3cine_dec_(float v) {
	if (v >= 171.2102946929 / 1023.0) { return pow(10.0, (v * 1023.0 - 420.0) / 261.5) * 0.19 - 0.01; }
	return (v * 1023.0 - 95.0) * 0.01125 / (171.2102946929 - 95.0);
}
float sgamut3cine_enc_(float l) {
	if (l >= 0.01125) { return (420.0 + sgamut3cine_log10_((l + 0.01) / 0.19) * 261.5) / 1023.0; }
	return (l * (171.2102946929 - 95.0) / 0.01125 + 95.0) / 1023.0;
}
vec3 sgamut3cine_xyz(vec3 c) {
	float r = sgamut3cine_dec_(c.x); float g = sgamut3cine_dec_(c.y); float b = sgamut3cine_dec_(c.z);
	return vec3(
		100.0 * (0.5990839208 * r + 0.2489255161 * g + 0.1024464902 * b),
		100.0 * (0.2150758201 * r + 0.8850685017 * g - 0.1001443219 * b),
		100.0 * (-0.0320658495 * r - 0.0276583907 * g + 1.1487819910 * b));
}
vec3 xyz_sgamut3cine(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.846778969147029 * x - 0.5259861229282461 * y - 0.21054521142275331 * z;
	float g = -0.444153262865373 * x + 1.259442902857083 * y + 0.1493999729404059 * z;
	float b = 0.04085542111307653 * x + 0.015640889355356992 * y + 0.8682072486978321 * z;
	return vec3(sgamut3cine_enc_(r), sgamut3cine_enc_(g), sgamut3cine_enc_(b));
}`,
}
