// GLSL chunk: CIE XYZ 0-100 <-> log-compressed OSA-UCS (Oleari, Melgosa & Huertas 2009,
// the ΔE_E space). Mirrors osaucs-ee.js: Oleari's log-ratio G, J on OSA-UCS lightness, then
// ln(1 + x) compressions of lightness and chroma. The modified-luminance factor, the
// lightness and its bisected root come from osaucs.glsl.js (requires: ['osaucs']); the
// inverse is otherwise closed form – the log ratios fix A:B:C, Y0 = K·Y fixes the scale.
import xyz from './xyz.glsl.js'
import osaucs from './osaucs.glsl.js'
export default {
	name: 'osaucs-ee',
	deps: [xyz, osaucs],
	edges: { xyz: ['xyz_osaucsee', 'osaucsee_xyz'] },
	requires: ['osaucs'],
	code: /* glsl */ `
float osaucsee_sj_(float L) { return 2.0 * (0.5735 * L + 7.0892); }
float osaucsee_sg_(float L) { return -2.0 * (0.764 * L + 9.2521); }
vec3 xyz_osaucsee(vec3 c) {
	float X = c.x; float Y = c.y; float Z = c.z;
	float sum = X + Y + Z;
	float Y0 = 0.0;
	float u = 0.0;
	float v = 0.0;
	if (sum != 0.0) {
		Y0 = osaucs_k_(X / sum, Y / sum) * Y;
		float A = 0.6597 * X + 0.4492 * Y - 0.1089 * Z;
		float B = -0.3053 * X + 1.2126 * Y + 0.0927 * Z;
		float C = -0.0374 * X + 0.4795 * Y + 0.5579 * Z;
		u = log(A / B / 0.9366);
		v = log(B / C / 0.9807);
	}
	float L = (osaucs_light_(Y0) - 14.4) / 1.4142135623730951;
	float J = osaucsee_sj_(L) * (0.1792 * u + 0.9837 * v);
	float G = osaucsee_sg_(L) * (0.9482 * u - 0.3175 * v);
	float LE = log(1.0 + 0.015 / 2.89 * 10.0 * L) / 0.015;
	float Co = sqrt(G * G + J * J);
	if (Co == 0.0) { return vec3(LE, 0.0, 0.0); }
	float k = log(1.0 + 0.05 / 1.256 * 10.0 * Co) / (0.05 * Co);
	return vec3(LE, k * G, k * J);
}
vec3 osaucsee_xyz(vec3 c) {
	float L = (exp(0.015 * c.x) - 1.0) * 2.89 / 0.15;
	float CE = sqrt(c.y * c.y + c.z * c.z);
	float k = 0.0;
	if (CE != 0.0) { k = (exp(0.05 * CE) - 1.0) * 1.256 / (0.5 * CE); }
	float p = 0.0;
	float q = 0.0;
	if (c.z != 0.0) { p = k * c.z / osaucsee_sj_(L); }
	if (c.y != 0.0) { q = k * c.y / osaucsee_sg_(L); }
	float u = (-0.3175 * p - 0.9837 * q) / -0.98964034;
	float v = (0.1792 * q - 0.9482 * p) / -0.98964034;
	float A = 0.9366 * exp(u);
	float C = 1.0 / (0.9807 * exp(v));
	float X = 1.2567635908091883 * A - 0.6021280360093871 + 0.34536444520019866 * C;
	float Y = 0.3317777916874716 * A + 0.7237114542192475 - 0.05548924590671913 * C;
	float Z = -0.20090427104835812 * A - 0.6623753913692065 + 1.8632796624175647 * C;
	float t = osaucs_root_(L * 1.4142135623730951 + 14.4);
	float s = t * t * t / (osaucs_k_(X / (X + Y + Z), Y / (X + Y + Z)) * Y);
	return vec3(s * X, s * Y, s * Z);
}`,
}
