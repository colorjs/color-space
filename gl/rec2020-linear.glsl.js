// GLSL chunk: linear-light Rec. 2020 0-1 <-> CIE XYZ D65 0-100.
// Matrix mirrors rec2020-linear.js M (BT.2020 primaries, D65 white); inverse derived via inv3.
export default {
	name: 'rec2020-linear',
	edges: { xyz: ['xyz_rec2020linear', 'rec2020linear_xyz'] },
	code: /* glsl */ `
vec3 rec2020linear_xyz(vec3 c) {
	return vec3(
		100.0 * (0.6369580483012914 * c.x + 0.14461690358620832 * c.y + 0.1688809751641721 * c.z),
		100.0 * (0.2627002120112671 * c.x + 0.6779980715188708 * c.y + 0.05930171646986196 * c.z),
		100.0 * (0.0 * c.x + 0.028072693049087428 * c.y + 1.060985057710791 * c.z));
}
vec3 xyz_rec2020linear(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.7166511879712671 * x - 0.3556707837763923 * y - 0.2533662813736597 * z,
		-0.6666843518324891 * x + 1.6164812366349393 * y + 0.015768545813911145 * z,
		0.017639857445310863 * x - 0.04277061325780853 * y + 0.9421031212354736 * z);
}`,
}
