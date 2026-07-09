// GLSL chunk: SMPTE-C 0-1 <-> CIE XYZ D65 0-100 (SMPTE 170M primaries, BT.601/709
// OETF). Mirrors smpte-c.js M / inv3(M) and transfers.js bt709Encode/Decode.
import xyz from './xyz.glsl.js'
export default {
	name: 'smpte-c',
	deps: [xyz],
	edges: { xyz: ['xyz_smptec', 'smptec_xyz'] },
	code: /* glsl */ `
float smptec_dec_(float u) {
	float a = abs(u);
	if (a < 0.081) { return sign(u) * a / 4.5; }
	return sign(u) * pow((a + 0.099) / 1.099, 1.0 / 0.45);
}
float smptec_enc_(float u) {
	float a = abs(u);
	if (a < 0.018) { return sign(u) * 4.5 * a; }
	return sign(u) * (1.099 * pow(a, 0.45) - 0.099);
}
vec3 smptec_xyz(vec3 c) {
	float r = smptec_dec_(c.x); float g = smptec_dec_(c.y); float b = smptec_dec_(c.z);
	return vec3(
		100.0 * (0.39352090365939 * r + 0.365258076717604 * g + 0.191676946674678 * b),
		100.0 * (0.212376360705067 * r + 0.701059856925723 * g + 0.086563782369210 * b),
		100.0 * (0.018739090650447 * r + 0.111933926736040 * g + 0.958384733373392 * b));
}
vec3 xyz_smptec(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 3.5060032827246586 * x - 1.7397907263028323 * y - 0.5440582683627382 * z;
	float g = -1.069047559853811 * x + 1.9777788827287859 * y + 0.03517141933719316 * z;
	float b = 0.056306591734127956 * x - 0.19697565482077228 * y + 1.0499523282187333 * z;
	return vec3(smptec_enc_(r), smptec_enc_(g), smptec_enc_(b));
}`,
}
