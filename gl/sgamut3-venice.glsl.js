// GLSL chunk: Venice S-Gamut3 (Sony) <-> CIE XYZ D65 0-100. The S-Log3 curve (reuses slog3's
// helpers, requires: ['slog3']) over the Venice S-Gamut3 primaries; mirrors sgamut3-venice.js M,
// MI = inv3(M) printed from math.js inv3.
import xyz from './xyz.glsl.js'
import slog3 from './slog3.glsl.js'
export default {
	name: 'sgamut3-venice',
	deps: [xyz, slog3],
	edges: { xyz: ['xyz_sgamut3venice', 'sgamut3venice_xyz'] },
	requires: ['slog3'],
	code: /* glsl */ `
vec3 sgamut3venice_xyz(vec3 c) {
	float r = slog3_dec_(c.x); float g = slog3_dec_(c.y); float b = slog3_dec_(c.z);
	return vec3(
		100.0 * (0.7442229872874919 * r + 0.07790652183263243 * g + 0.12832641793154728 * b),
		100.0 * (0.28078247599697626 * r + 0.7802857216190829 * g - 0.06106819761605925 * b),
		100.0 * (-0.019929292611017217 * r + 0.014796572000041662 * g + 1.094190471370854 * b));
}
vec3 xyz_sgamut3venice(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.3902639751401862 * x - 0.13557353430238894 * y - 0.17061638917345856 * z;
	float g = -0.49777193134118136 * x + 1.3287678224767097 * y + 0.13253884827114143 * z;
	float b = 0.03205319065233138 * x - 0.02043802608152834 * y + 0.909017800345629 * z;
	return vec3(slog3_enc_(r), slog3_enc_(g), slog3_enc_(b));
}`,
}
