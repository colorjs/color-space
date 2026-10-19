// GLSL chunk: Hellwig 2022 (J, M, h) <-> Hellwig 2022 with the Helmholtz–Kohlrausch extension
// (J_HK, M, h), Hellwig, Stolitzka & Fairchild 2022. Mirrors hellwig2022-hk.js exactly:
// J_HK = J + f(h)·C^0.587 with C = 35·M/A_w, A_w = 46.17419979967692 under hellwig2022.js's
// conditions (the constant below is 35/A_w, printed from there); M and h pass through.
import hellwig2022 from './hellwig2022.glsl.js'
export default {
	name: 'hellwig2022-hk',
	deps: [hellwig2022],
	edges: { hellwig2022: ['hellwig2022_hellwig2022hk', 'hellwig2022hk_hellwig2022'] },
	code: /* glsl */ `
const float HELLWIG2022HK_C_PER_M_ = 0.7579990590382661;

float hellwig2022hk_dj_(float M, float h) {
	float hr = h * 0.017453292519943295;
	float f = -0.160 * cos(hr) + 0.132 * cos(2.0 * hr) - 0.405 * sin(hr) + 0.080 * sin(2.0 * hr) + 0.792;
	return f * spow_(HELLWIG2022HK_C_PER_M_ * M, 0.587);
}
vec3 hellwig2022_hellwig2022hk(vec3 c) {
	return vec3(c.x + hellwig2022hk_dj_(c.y, c.z), c.y, c.z);
}
vec3 hellwig2022hk_hellwig2022(vec3 c) {
	return vec3(c.x - hellwig2022hk_dj_(c.y, c.z), c.y, c.z);
}`,
}
