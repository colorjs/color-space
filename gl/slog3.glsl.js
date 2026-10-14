// GLSL chunk: S-Log3 (Sony) <-> CIE XYZ D65 0-100, via S-Gamut3.
// Mirrors slog3.js decode/encode (same constants as wasm/batch.js xyz_slog3); the matrix
// comes from sgamut3.glsl.js (requires: ['sgamut3']).
import xyz from './xyz.glsl.js'
import sgamut3 from './sgamut3.glsl.js'
export default {
	name: 'slog3',
	deps: [xyz, sgamut3],
	edges: { xyz: ['xyz_slog3', 'slog3_xyz'] },
	requires: ['sgamut3'],
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
	return sgamut3_xyz(vec3(slog3_dec_(c.x), slog3_dec_(c.y), slog3_dec_(c.z)));
}
vec3 xyz_slog3(vec3 c) {
	vec3 l = xyz_sgamut3(c);
	return vec3(slog3_enc_(l.x), slog3_enc_(l.y), slog3_enc_(l.z));
}`,
}
