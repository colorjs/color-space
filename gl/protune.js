// GLSL chunk: Protune 0-1 <-> CIE XYZ D65 0-100, via Protune Native linear RGB.
// Single natural-log curve, then Protune Native -> XYZ matrix; mirrors protune.js
// enc/dec and M; MI is M's exact inverse (inv3).
export default {
	name: 'protune',
	edges: { xyz: ['xyz_protune', 'protune_xyz'] },
	code: `
float protune_enc_(float x) {
	return log(x * 112.0 + 1.0) / 4.727387818712341;
}
float protune_dec_(float y) {
	return (pow(113.0, y) - 1.0) / 112.0;
}
vec3 protune_xyz(vec3 c) {
	float r = protune_dec_(c.x); float g = protune_dec_(c.y); float b = protune_dec_(c.z);
	return vec3(
		100.0 * (0.5022571888838522 * r + 0.2929667107237154 * g + 0.1552320274441038 * b),
		100.0 * (0.1387997591578935 * r + 0.9108414623976787 * g + -0.0496412215555725 * b),
		100.0 * (0.0780142594902075 * r + -0.3148325109509678 * g + 1.3258760022206386 * b));
}
vec3 xyz_protune(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.266896503223739 * x - 0.8316335863167417 * y - 0.2965422457712954 * z;
	float g = -0.35733783183789924 * x + 1.243373147787852 * y + 0.08838898798076417 * z;
	float b = -0.21823444908167994 * x + 0.3441751474545552 * y + 0.7926550061827873 * z;
	return vec3(protune_enc_(r), protune_enc_(g), protune_enc_(b));
}`,
}
