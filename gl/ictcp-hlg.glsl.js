// GLSL chunk: Rec. 2020 Linear 0-1 <-> ICtCp with the HLG transfer (ITU-R BT.2100
// Table 7, HLG column). Mirrors ictcp-hlg.js: BT.2100 RGB -> LMS /4096 matrix, sign-
// extended HLG OETF of rec2100-hlg's chunk (relative 1.0 -> signal 0.75), then the
// HLG Ct/Cp matrix /4096. Inverses printed from ictcp-hlg.js (inv3).
import rec2020_linear from './rec2020-linear.glsl.js'
import rec2100_hlg from './rec2100-hlg.glsl.js'
export default {
	name: 'ictcp-hlg',
	deps: [rec2020_linear, rec2100_hlg],
	requires: ['rec2100-hlg'],
	edges: { 'rec2020-linear': ['rec2020linear_ictcphlg', 'ictcphlg_rec2020linear'] },
	code: /* glsl */ `
vec3 rec2020linear_ictcphlg(vec3 c) {
	float l = rec2100hlg_from_linear_((1688.0 * c.x + 2146.0 * c.y + 262.0 * c.z) / 4096.0);
	float m = rec2100hlg_from_linear_((683.0 * c.x + 2951.0 * c.y + 462.0 * c.z) / 4096.0);
	float s = rec2100hlg_from_linear_((99.0 * c.x + 309.0 * c.y + 3688.0 * c.z) / 4096.0);
	return vec3(
		(2048.0 * l + 2048.0 * m) / 4096.0,
		(3625.0 * l - 7465.0 * m + 3840.0 * s) / 4096.0,
		(9500.0 * l - 9212.0 * m - 288.0 * s) / 4096.0);
}
vec3 ictcphlg_rec2020linear(vec3 c) {
	float l = rec2100hlg_to_linear_(c.x + 0.015718580108730413 * c.y + 0.2095810681164055 * c.z);
	float m = rec2100hlg_to_linear_(c.x - 0.015718580108730413 * c.y - 0.2095810681164055 * c.z);
	float s = rec2100hlg_to_linear_(c.x + 1.0212710798422342 * c.y - 0.6052744909924315 * c.z);
	return vec3(
		3.4366066943330784 * l - 2.50645211865627 * m + 0.06984542432319148 * s,
		-0.7913295555989287 * l + 1.9836004517922907 * m - 0.192270896193362 * s,
		-0.025949899690592672 * l - 0.09891371471172644 * m + 1.1248636144023192 * s);
}`,
}
