// GLSL chunk: ACEScg (AP1, linear scene-referred, ACES D60 white) <-> CIE XYZ D65 0-100.
// Mirrors acescg.js: AP1 -> XYZ(ACES) -> Bradford ACES white -> D65 -> XYZ(D65)*100, and its
// exact inverse. The adaptation digits are printed from acescg.js's derived matrices
// (xyz.js bradfordAdaptation) — chunks carry literal digits, so re-print if the whites change.
import xyz from './xyz.glsl.js'
export default {
	name: 'acescg',
	deps: [xyz],
	edges: { xyz: ['xyz_acescg', 'acescg_xyz'] },
	code: /* glsl */ `
vec3 acescg_xyz(vec3 c) {
	float xa = 0.6624541811085053 * c.x + 0.13400420645643313 * c.y + 0.1561876870049078 * c.z;
	float ya = 0.27222871678091454 * c.x + 0.6740817658111484 * c.y + 0.05368951740793705 * c.z;
	float za = -0.005574649490394108 * c.x + 0.004060733528982826 * c.y + 1.0103391003129971 * c.z;
	float x65 = 0.9872240087030176 * xa - 0.006113228606856944 * ya + 0.015953288335912686 * za;
	float y65 = -0.007598371811662375 * xa + 1.001861484739654 * ya + 0.005330035791388962 * za;
	float z65 = 0.003072577058531532 * xa - 0.005095961511130591 * ya + 1.0816806030657953 * za;
	return vec3(100.0 * x65, 100.0 * y65, 100.0 * z65);
}
vec3 xyz_acescg(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float xa = 1.013034914649986 * x + 0.006105257823207226 * y - 0.014970943626587574 * z;
	float ya = 0.007698230125415045 * x + 0.9981633521182773 * y - 0.005032038535111895 * z;
	float za = -0.0028413174324390736 * x + 0.00468515672253722 * y + 0.9245061374576632 * z;
	return vec3(
		1.6410233796943261 * xa - 0.3248032941847900 * ya - 0.2364246952376123 * za,
		-0.6636628587229831 * xa + 1.6153315916573381 * ya + 0.0167563476855301 * za,
		0.0117218943283754 * xa - 0.0082844419962374 * ya + 0.9883948585390218 * za);
}`,
}
