// GLSL chunk: Venice S-Gamut3.Cine (Sony) <-> CIE XYZ D65 0-100. The S-Log3 curve (reuses slog3's
// helpers, requires: ['slog3']) over the Venice S-Gamut3.Cine primaries; mirrors
// sgamut3cine-venice.js M, MI = inv3(M) printed from math.js inv3.
import xyz from './xyz.glsl.js'
import slog3 from './slog3.glsl.js'
export default {
	name: 'sgamut3cine-venice',
	deps: [xyz, slog3],
	edges: { xyz: ['xyz_sgamut3cinevenice', 'sgamut3cinevenice_xyz'] },
	requires: ['slog3'],
	code: /* glsl */ `
vec3 sgamut3cinevenice_xyz(vec3 c) {
	float r = slog3_dec_(c.x); float g = slog3_dec_(c.y); float b = slog3_dec_(c.z);
	return vec3(
		100.0 * (0.6322608372499656 * r + 0.20037000819568965 * g + 0.11782508160601625 * b),
		100.0 * (0.22368435892918212 * r + 0.8800140615912109 * g - 0.10369842052039296 * b),
		100.0 * (-0.04107303203192153 * r - 0.018443611745648313 * g + 1.1485743945374483 * b));
}
vec3 xyz_sgamut3cinevenice(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.7070112862504887 * x - 0.39308247599906876 * y - 0.2106008780542397 * z;
	float g = -0.4275085830769509 * x + 1.2369444116061683 * y + 0.15553229838050006 * z;
	float b = 0.05417788104171906 * x + 0.005806009068661475 * y + 0.8656109394771556 * z;
	return vec3(slog3_enc_(r), slog3_enc_(g), slog3_enc_(b));
}`,
}
