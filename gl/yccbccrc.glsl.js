// GLSL chunk: linear Rec.2020 RGB 0-1 <-> YcCbcCrc (Yc 0-1, Cbc/Crc ±0.5),
// BT.2020 constant-luminance. Mirrors yccbccrc.js: BT.2020-2 Table 4 luma weights
// (Kr/Kg/Kb), the BT.2020 OETF/EOTF (transfers.js bt2020Encode/bt2020Decode)
// applied post-luma-mix, and the piecewise Cbc/Crc normalisation (NBC/PBC/NRC/PRC).
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'yccbccrc',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_yccbccrc', 'yccbccrc_rec2020linear'] },
	code: /* glsl */ `
float yccbccrc_oetf_(float v) {
	float a = abs(v);
	if (a < 0.018053968510807) { return sign(v) * 4.5 * a; }
	return sign(v) * (1.09929682680944 * pow(a, 0.45) - (1.09929682680944 - 1.0));
}
float yccbccrc_eotf_(float v) {
	float a = abs(v);
	if (a < 0.018053968510807 * 4.5) { return sign(v) * a / 4.5; }
	return sign(v) * pow((a + (1.09929682680944 - 1.0)) / 1.09929682680944, 1.0 / 0.45);
}
vec3 rec2020linear_yccbccrc(vec3 c) {
	float R = c.x; float G = c.y; float B = c.z;
	float ycp = yccbccrc_oetf_(0.2627 * R + 0.6780 * G + 0.0593 * B);
	float rp = yccbccrc_oetf_(R);
	float bp = yccbccrc_oetf_(B);
	float db = bp - ycp;
	float dr = rp - ycp;
	float cbc = 0.0;
	if (db < 0.0) { cbc = db / 1.9404; } else { cbc = db / 1.5816; }
	float crc = 0.0;
	if (dr < 0.0) { crc = dr / 1.7184; } else { crc = dr / 0.9936; }
	return vec3(ycp, cbc, crc);
}
vec3 yccbccrc_rec2020linear(vec3 c) {
	float ycp = c.x; float cbc = c.y; float crc = c.z;
	float bp = 0.0;
	if (cbc < 0.0) { bp = ycp + cbc * 1.9404; } else { bp = ycp + cbc * 1.5816; }
	float rp = 0.0;
	if (crc < 0.0) { rp = ycp + crc * 1.7184; } else { rp = ycp + crc * 0.9936; }
	float yc = yccbccrc_eotf_(ycp);
	float r = yccbccrc_eotf_(rp);
	float b = yccbccrc_eotf_(bp);
	return vec3(r, (yc - 0.2627 * r - 0.0593 * b) / 0.6780, b);
}`,
}
