// GLSL chunk: correlated color temperature (CCT, 1000-25000 K) <-> CIE XYZ D65 0-100.
// Forward: Krystek (1985) rational approximation of the Planckian locus (CCT -> uv ->
// xy). Inverse: McCamy (1992) cubic (xy -> nearest CCT); lossy off the locus, exact on
// it. Mirrors kelvin.js kelvin.xyz / xyz.kelvin.
export default {
	name: 'kelvin',
	dim: 1,
	edges: { xyz: ['xyz_kelvin', 'kelvin_xyz'] },
	code: `
vec3 kelvin_xyz(float c) {
	float t = c;
	if (t < 1000.0) { t = 1000.0; }
	if (t > 25000.0) { t = 25000.0; }
	float u = (0.860117757 + 1.54118254e-4 * t + 1.28641212e-7 * t * t) / (1.0 + 8.42420235e-4 * t + 7.08145163e-7 * t * t);
	float v = (0.317398726 + 4.22806245e-5 * t + 4.20481691e-8 * t * t) / (1.0 - 2.89741816e-5 * t + 1.61456053e-7 * t * t);
	float d = 2.0 * u - 8.0 * v + 4.0;
	float x = 3.0 * u / d;
	float y = 2.0 * v / d;
	return vec3(x * 100.0 / y, 100.0, (1.0 - x - y) * 100.0 / y);
}
float xyz_kelvin(vec3 c) {
	float s = c.x + c.y + c.z;
	if (s == 0.0) { return 6504.0; }
	float n = (c.x / s - 0.3320) / (0.1858 - c.y / s);
	float T = 437.0 * n * n * n + 3601.0 * n * n + 6861.0 * n + 5517.8;
	if (T < 1000.0) { T = 1000.0; }
	if (T > 25000.0) { T = 25000.0; }
	return T;
}`,
}
