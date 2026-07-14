// GLSL chunk: CIE XYZ D65 0-100 <-> LMS cone response. Mirrors lms.js defaults:
// xyz.lms with no matrix arg uses CAT02; lms.xyz with no matrix arg uses its own
// hardcoded literal (the exact CAT02 inverse, independently transcribed there).
import xyz from './xyz.glsl.js'
export default {
	name: 'lms',
	deps: [xyz],
	edges: { xyz: ['xyz_lms', 'lms_xyz'] },
	code: /* glsl */ `
vec3 xyz_lms(vec3 c) {
	return vec3(
		0.7328 * c.x + 0.4296 * c.y - 0.1624 * c.z,
		-0.7036 * c.x + 1.6975 * c.y + 0.0061 * c.z,
		0.0030 * c.x + 0.0136 * c.y + 0.9834 * c.z);
}
vec3 lms_xyz(vec3 c) {
	return vec3(
		1.096123820835514 * c.x - 0.278869000218287 * c.y + 0.182745179382773 * c.z,
		0.454369041975359 * c.x + 0.473533154307412 * c.y + 0.072097803717229 * c.z,
		-0.009627608738429 * c.x - 0.005698031216113 * c.y + 1.015325639954543 * c.z);
}`,
}
