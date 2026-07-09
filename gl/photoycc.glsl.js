// GLSL chunk: linear scene RGB 0-1 (BT.709 primaries) <-> PhotoYCC 8-bit storage
// (Yc/C1/C2 0-255), Kodak Photo CD. Mirrors photoycc.js lrgb.photoycc /
// photoycc.lrgb — the odd-extended Rec.709 OETF (same sign*pow(abs) form as
// bt709Encode/Decode in transfers.js) feeding BT.601 luma weights and the
// asymmetric C1/C2 storage offsets (156/137).
import lrgb from './lrgb.glsl.js'
export default {
	name: 'photoycc',
	deps: [lrgb],
	edges: { lrgb: ['lrgb_photoycc', 'photoycc_lrgb'] },
	code: /* glsl */ `
float photoycc_oetf_(float v) {
	float a = abs(v);
	if (a < 0.018) { return 4.5 * v; }
	return sign(v) * (1.099 * pow(a, 0.45) - 0.099);
}
float photoycc_oetfinv_(float v) {
	float a = abs(v);
	if (a < 0.081) { return v / 4.5; }
	return sign(v) * pow((a + 0.099) / 1.099, 1.0 / 0.45);
}
vec3 lrgb_photoycc(vec3 c) {
	float r = photoycc_oetf_(c.x);
	float g = photoycc_oetf_(c.y);
	float b = photoycc_oetf_(c.z);
	float y = 0.299 * r + 0.587 * g + 0.114 * b;
	return vec3((255.0 / 1.402) * y, 111.40 * (b - y) + 156.0, 135.64 * (r - y) + 137.0);
}
vec3 photoycc_lrgb(vec3 c) {
	float y = c.x * (1.402 / 255.0);
	float b = y + (c.y - 156.0) / 111.40;
	float r = y + (c.z - 137.0) / 135.64;
	float g = (y - 0.299 * r - 0.114 * b) / 0.587;
	return vec3(photoycc_oetfinv_(r), photoycc_oetfinv_(g), photoycc_oetfinv_(b));
}`,
}
