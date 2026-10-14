// GLSL chunk: Lab-D65 <-> DIN99 (DIN 6176:2001). Mirrors din99.js exactly
// (log1p/expm1 written as log(1 + x)/exp(x) - 1; a99/b99 stay in the 16°-rotated frame).
import lab_d65 from './lab-d65.glsl.js'
export default {
	name: 'din99',
	deps: [lab_d65],
	edges: { 'lab-d65': ['labd65_din99', 'din99_labd65'] },
	code: /* glsl */ `
float din99_theta_() { return 16.0 * 3.141592653589793 / 180.0; }
vec3 labd65_din99(vec3 c) {
	float theta = din99_theta_();
	float costheta = cos(theta);
	float sintheta = sin(theta);
	float e = c.y * costheta + c.z * sintheta;
	float f = 0.7 * (c.z * costheta - c.y * sintheta);
	float G = sqrt(e * e + f * f);
	float L99 = 105.509 * log(1.0 + 0.0158 * c.x);
	if (G == 0.0) { return vec3(L99, 0.0, 0.0); }
	float k = log(1.0 + 0.045 * G) / (0.045 * G);
	return vec3(L99, k * e, k * f);
}
vec3 din99_labd65(vec3 c) {
	float theta = din99_theta_();
	float costheta = cos(theta);
	float sintheta = sin(theta);
	float L = (exp(c.x / 105.509) - 1.0) / 0.0158;
	float C99 = sqrt(c.y * c.y + c.z * c.z);
	if (C99 == 0.0) { return vec3(L, 0.0, 0.0); }
	float k = (exp(0.045 * C99) - 1.0) / (0.045 * C99);
	float e = k * c.y;
	float f = k * c.z / 0.7;
	return vec3(L, e * costheta - f * sintheta, e * sintheta + f * costheta);
}`,
}
