// GLSL chunk: F-Log2 0-1 <-> linear-light Rec. 2020 (F-Gamut primaries match BT.2020).
// Same shape as F-Log with a shallower curve; mirrors flog2.js enc/dec exactly.
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'flog2',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_flog2', 'flog2_rec2020linear'] },
	code: /* glsl */ `
float flog2_enc_(float x) {
	if (x < 0.000889) { return 8.799461 * x + 0.092864; }
	return 0.245281 * (log(5.555556 * x + 0.064829) / 2.302585092994046) + 0.384316;
}
float flog2_dec_(float y) {
	if (y < 0.100686685370811) { return (y - 0.092864) / 8.799461; }
	return (pow(10.0, (y - 0.384316) / 0.245281) - 0.064829) / 5.555556;
}
vec3 rec2020linear_flog2(vec3 c) {
	return vec3(flog2_enc_(c.x), flog2_enc_(c.y), flog2_enc_(c.z));
}
vec3 flog2_rec2020linear(vec3 c) {
	return vec3(flog2_dec_(c.x), flog2_dec_(c.y), flog2_dec_(c.z));
}`,
}
