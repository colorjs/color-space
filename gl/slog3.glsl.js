// GLSL chunk: S-Log3 (Sony) <-> CIE XYZ D65 0-100. S-Gamut3 primaries.
// Mirrors slog3.js decode/encode + M/MI; same decomposition/constants as wasm/batch.js xyz_slog3.
import xyz from './xyz.glsl.js'
export default {
	name: 'slog3',
	deps: [xyz],
	edges: { xyz: ['xyz_slog3', 'slog3_xyz'] },
	code: /* glsl */ `
float slog3_log10_(float x) { return log(x) / log(10.0); }
float slog3_dec_(float v) {
	if (v >= 171.2102946929 / 1023.0) { return pow(10.0, (v * 1023.0 - 420.0) / 261.5) * 0.19 - 0.01; }
	return (v * 1023.0 - 95.0) * 0.01125 / (171.2102946929 - 95.0);
}
float slog3_enc_(float l) {
	if (l >= 0.01125) { return (420.0 + slog3_log10_((l + 0.01) / 0.19) * 261.5) / 1023.0; }
	return (l * (171.2102946929 - 95.0) / 0.01125 + 95.0) / 1023.0;
}
vec3 slog3_xyz(vec3 c) {
	float r = slog3_dec_(c.x); float g = slog3_dec_(c.y); float b = slog3_dec_(c.z);
	return vec3(
		100.0 * (0.7064827132 * r + 0.1288010498 * g + 0.1151721641 * b),
		100.0 * (0.2709796708 * r + 0.7866064112 * g - 0.0575860820 * b),
		100.0 * (-0.0096778454 * r + 0.0046000375 * g + 1.0941355587 * b));
}
vec3 xyz_slog3(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.5073998990431192 * x - 0.24582213740524175 * y - 0.17161168084331915 * z;
	float g = -0.5181517270645519 * x + 1.3553912409400366 * y + 0.12587866812835696 * z;
	float b = 0.01551169817958099 * x - 0.007872771439249991 * y + 0.9119163655330013 * z;
	return vec3(slog3_enc_(r), slog3_enc_(g), slog3_enc_(b));
}`,
}
