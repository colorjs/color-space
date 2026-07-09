// GLSL chunk: LogC4 (ARRI, ALEXA 35) <-> CIE XYZ D65 0-100. ARRI Wide Gamut 4 primaries.
// Mirrors logc4.js decode/encode + M/MI; same decomposition/constants as wasm/batch.js xyz_logc4.
import xyz from './xyz.glsl.js'
export default {
	name: 'logc4',
	deps: [xyz],
	edges: { xyz: ['xyz_logc4', 'logc4_xyz'] },
	code: /* glsl */ `
float logc4_dec_(float v) {
	if (v >= 0.0) { return (pow(2.0, 14.0 * (v - 0.09286412512218964) / 0.9071358748778103 + 6.0) - 64.0) / 2231.8263090676883; }
	return v * 0.1135972086105891 - 0.01805699611991131;
}
float logc4_enc_(float v) {
	if (v >= -0.01805699611991131) { return (log2(2231.8263090676883 * v + 64.0) - 6.0) / 14.0 * 0.9071358748778103 + 0.09286412512218964; }
	return (v + 0.01805699611991131) / 0.1135972086105891;
}
vec3 logc4_xyz(vec3 c) {
	float r = logc4_dec_(c.x); float g = logc4_dec_(c.y); float b = logc4_dec_(c.z);
	return vec3(
		100.0 * (0.704858320407232064 * r + 0.129760295170463003 * g + 0.115837311473976537 * b),
		100.0 * (0.254524176404027025 * r + 0.781477732712002049 * g - 0.036001909116029039 * b),
		100.0 * (1.089057750759878429 * b));
}
vec3 xyz_logc4(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.509215472242109 * x - 0.25059734520438 * y - 0.1688114752940731 * z;
	float g = -0.4915454516606189 * x + 1.3612455459293507 * y + 0.09728294201372903 * z;
	float b = 0.9182249511582473 * z;
	return vec3(logc4_enc_(r), logc4_enc_(g), logc4_enc_(b));
}`,
}
