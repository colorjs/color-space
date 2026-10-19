// GLSL chunk: sRGB 2.2 display 0-1 <-> linear-light sRGB (lrgb), the IEC 61966-2-1 reference
// display's pure 2.2 power, sign-extended, no linear toe. Mirrors rgb-display.js
// (transfers.js gammaEncode/gammaDecode(v, 2.2)).
import lrgb from './lrgb.glsl.js'
export default {
	name: 'rgb-display',
	deps: [lrgb],
	edges: { lrgb: ['lrgb_rgbdisplay', 'rgbdisplay_lrgb'] },
	code: /* glsl */ `
float rgbdisplay_dec_(float u) { return sign(u) * pow(abs(u), 2.2); }
float rgbdisplay_enc_(float u) { return sign(u) * pow(abs(u), 1.0 / 2.2); }
vec3 lrgb_rgbdisplay(vec3 c) {
	return vec3(rgbdisplay_enc_(c.x), rgbdisplay_enc_(c.y), rgbdisplay_enc_(c.z));
}
vec3 rgbdisplay_lrgb(vec3 c) {
	return vec3(rgbdisplay_dec_(c.x), rgbdisplay_dec_(c.y), rgbdisplay_dec_(c.z));
}`,
}
