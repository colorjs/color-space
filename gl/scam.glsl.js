// GLSL chunk: sUCS Iab <-> sCAM (J, M, h), Li & Luo 2024. Mirrors scam.js: under
// cam16.js's viewing conditions (D65, La = 64/π·0.2, Yb = 20, average) sCAM's
// chromatic adaptation is the identity, so the edge sits on sUCS. Constants are
// c·z (SCAM_CZ_), its reciprocal, and FL^0.1·F (SCAM_KM_), printed from scam.js.
import sucs from './sucs.glsl.js'
export default {
	name: 'scam',
	deps: [sucs],
	edges: { sucs: ['sucs_scam', 'scam_sucs'] },
	code: /* glsl */ `
const float SCAM_CZ_ = 1.002151069659978;
const float SCAM_ICZ_ = 0.9978535475088522;
const float SCAM_KM_ = 0.8790444604301005;
vec3 sucs_scam(vec3 c) {
	vec3 p = polar_fwd(c);
	float C = log(1.0 + 0.0447 * p.y) / 0.0252;
	float J = 100.0 * spow_(c.x / 100.0, SCAM_CZ_);
	float et = 1.0 + 0.06 * cos((110.0 + p.z) * 0.017453292519943295);
	float M = 0.0;
	if (J != 0.0) { M = C * SCAM_KM_ * et / spow_(J, 0.27); }
	return vec3(J, M, p.z);
}
vec3 scam_sucs(vec3 c) {
	float et = 1.0 + 0.06 * cos((110.0 + c.z) * 0.017453292519943295);
	float C = c.y * spow_(c.x, 0.27) / (SCAM_KM_ * et);
	float I = 100.0 * spow_(c.x / 100.0, SCAM_ICZ_);
	return polar_inv(vec3(I, (exp(0.0252 * C) - 1.0) / 0.0447, c.z));
}`,
}
