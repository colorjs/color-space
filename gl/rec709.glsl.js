// GLSL chunk: Rec. 709 0-1 <-> linear-light sRGB (lrgb), BT.709 OETF/EOTF.
// Shares sRGB's primaries/white (linear = lrgb directly); only the camera-oriented
// OETF differs. Mirrors transfers.js bt709Encode/bt709Decode used by rec709.js.
import lrgb from './lrgb.glsl.js'
export default {
	name: 'rec709',
	deps: [lrgb],
	edges: { lrgb: ['lrgb_rec709', 'rec709_lrgb'] },
	code: /* glsl */ `
float rec709_enc_(float u) {
	float a = abs(u);
	if (a < 0.018) { return sign(u) * (4.5 * a); }
	return sign(u) * (1.099 * pow(a, 0.45) - 0.099);
}
float rec709_dec_(float u) {
	float a = abs(u);
	if (a < 0.081) { return sign(u) * (a / 4.5); }
	return sign(u) * pow((a + 0.099) / 1.099, 1.0 / 0.45);
}
vec3 lrgb_rec709(vec3 c) {
	return vec3(rec709_enc_(c.x), rec709_enc_(c.y), rec709_enc_(c.z));
}
vec3 rec709_lrgb(vec3 c) {
	return vec3(rec709_dec_(c.x), rec709_dec_(c.y), rec709_dec_(c.z));
}`,
}
