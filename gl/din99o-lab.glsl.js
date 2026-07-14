// GLSL chunk: Lab-D65 <-> DIN99o Lab (DIN 6176). Mirrors din99o-lab.js and
// wasm/batch.js labd65_din99olab/din99olab_labd65 exactly (kE=kCH=1 folded away).
import lab_d65 from './lab-d65.glsl.js'
export default {
	name: 'din99o-lab',
	deps: [lab_d65],
	edges: { 'lab-d65': ['labd65_din99olab', 'din99olab_labd65'] },
	code: /* glsl */ `
float din99olab_theta_() { return (26.0 / 180.0) * 3.141592653589793; }
float din99olab_factor_() { return 100.0 / log(139.0 / 100.0); }
vec3 din99olab_labd65(vec3 c) {
	float theta = din99olab_theta_();
	float costheta = cos(theta);
	float sintheta = sin(theta);
	float factor = din99olab_factor_();
	float L = (exp(c.x / factor) - 1.0) / 0.0039;
	float cc = sqrt(c.y * c.y + c.z * c.z);
	if (cc == 0.0) { return vec3(L, 0.0, 0.0); }
	float h = atan2_(c.z, c.y);
	float G = (exp(0.0435 * cc) - 1.0) / 0.075;
	float e = G * cos(h - theta);
	float f = G * sin(h - theta);
	return vec3(L, e * costheta - (f / 0.83) * sintheta, e * sintheta + (f / 0.83) * costheta);
}
vec3 labd65_din99olab(vec3 c) {
	float theta = din99olab_theta_();
	float costheta = cos(theta);
	float sintheta = sin(theta);
	float factor = din99olab_factor_();
	float e = c.y * costheta + c.z * sintheta;
	float f = 0.83 * (c.z * costheta - c.y * sintheta);
	float G = sqrt(e * e + f * f);
	float L = factor * log(1.0 + 0.0039 * c.x);
	float cc = log(1.0 + 0.075 * G) / 0.0435;
	if (cc == 0.0) { return vec3(L, 0.0, 0.0); }
	float h = atan2_(f, e) + theta;
	return vec3(L, cc * cos(h), cc * sin(h));
}`,
}
