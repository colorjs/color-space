// GLSL chunk: CIE XYZ D65 0-100 <-> DIN99c (Cui, Luo, Rigg, Roesler & Witt 2002).
// Mirrors din99c.js exactly (X' = 1.1X - 0.1Z with the corrected white; no rotation;
// log1p/expm1 written as log(1 + x)/exp(x) - 1).
import xyz from './xyz.glsl.js'
export default {
	name: 'din99c',
	deps: [xyz],
	edges: { xyz: ['xyz_din99c', 'din99c_xyz'] },
	code: /* glsl */ `
float din99c_labf_(float t) {
	if (t > 216.0 / 24389.0) { return cbrt_(t); }
	return (24389.0 / 27.0 * t + 16.0) / 116.0;
}
float din99c_labfinv_(float ft) {
	if (ft > 24.0 / 116.0) { return ft * ft * ft; }
	return (116.0 * ft - 16.0) / (24389.0 / 27.0);
}
float din99c_xcw_() { return 1.1 * 95.04559270516716 - 0.1 * 108.90577507598784; }
vec3 xyz_din99c(vec3 c) {
	float Xcw = din99c_xcw_();
	float fx = din99c_labf_((1.1 * c.x - 0.1 * c.z) / Xcw);
	float fy = din99c_labf_(c.y / 100.0);
	float fz = din99c_labf_(c.z / 108.90577507598784);
	float L = 116.0 * fy - 16.0;
	float e = 500.0 * (fx - fy);
	float f = 0.94 * 200.0 * (fy - fz);
	float G = sqrt(e * e + f * f);
	float L99 = 317.65 * log(1.0 + 0.0037 * L);
	if (G == 0.0) { return vec3(L99, 0.0, 0.0); }
	float k = 23.0 * log(1.0 + 0.066 * G) / G;
	return vec3(L99, k * e, k * f);
}
vec3 din99c_xyz(vec3 c) {
	float Xcw = din99c_xcw_();
	float L = (exp(c.x / 317.65) - 1.0) / 0.0037;
	float C99 = sqrt(c.y * c.y + c.z * c.z);
	float k = 0.0;
	if (C99 != 0.0) { k = (exp(C99 / 23.0) - 1.0) / (0.066 * C99); }
	float fy = (L + 16.0) / 116.0;
	float fx = k * c.y / 500.0 + fy;
	float fz = fy - k * c.z / 0.94 / 200.0;
	float Z = din99c_labfinv_(fz) * 108.90577507598784;
	return vec3((din99c_labfinv_(fx) * Xcw + 0.1 * Z) / 1.1, din99c_labfinv_(fy) * 100.0, Z);
}`,
}
