// GLSL chunk: ProPhoto RGB (ROMM) 0-1 <-> linear-light ProPhoto (prophoto-linear).
// ROMM curve with a linear toe below Et/Et2, sign-extended; mirrors prophoto.js
// toLinear/fromLinear (Et = 1/512, Et2 = 16/512).
import prophoto_linear from './prophoto-linear.glsl.js'
export default {
	name: 'prophoto',
	deps: [prophoto_linear],
	edges: { 'prophoto-linear': ['prophotolinear_prophoto', 'prophoto_prophotolinear'] },
	code: /* glsl */ `
float prophoto_dec_(float u) {
	float a = abs(u);
	if (a < 16.0 / 512.0) { return u / 16.0; }
	return sign(u) * pow(a, 1.8);
}
float prophoto_enc_(float u) {
	float a = abs(u);
	if (a >= 1.0 / 512.0) { return sign(u) * pow(a, 1.0 / 1.8); }
	return 16.0 * u;
}
vec3 prophotolinear_prophoto(vec3 c) {
	return vec3(prophoto_enc_(c.x), prophoto_enc_(c.y), prophoto_enc_(c.z));
}
vec3 prophoto_prophotolinear(vec3 c) {
	return vec3(prophoto_dec_(c.x), prophoto_dec_(c.y), prophoto_dec_(c.z));
}`,
}
