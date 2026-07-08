// GLSL chunk: linear-light DCI-P3 (Bradford-adapted to D65) 0-1 <-> CIE XYZ D65
// 0-100. Pure gamma 2.6, no linear toe — SMPTE RP 431-2.
// Mirrors dci-p3.js M / inv3(M) and spow(v, 2.6).
export default {
	name: 'dci-p3',
	edges: { xyz: ['xyz_dcip3', 'dcip3_xyz'] },
	code: `
vec3 dcip3_xyz(vec3 c) {
	float r = spow_(c.x, 2.6); float g = spow_(c.y, 2.6); float b = spow_(c.z, 2.6);
	return vec3(
		100.0 * (0.459251654991986669 * r + 0.295791787505722437 * g + 0.195412484553962068 * b),
		100.0 * (0.215150512464308469 * r + 0.709133636649875609 * g + 0.0757158508858156443 * b),
		100.0 * (0.000272005543731242562 * r + 0.0469395140885821294 * g + 1.04184623112756491 * b));
}
vec3 xyz_dcip3(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.6902259116255958 * x - 1.0940019373661398 * y - 0.42508234767475167 * z;
	float g = -0.8200821842734921 * x + 1.7504809082920598 * y + 0.02660195421220568 * z;
	float b = 0.036245754654004696 * x - 0.07858083680558875 * y + 0.9587469936609864 * z;
	return vec3(spow_(r, 1.0 / 2.6), spow_(g, 1.0 / 2.6), spow_(b, 1.0 / 2.6));
}`,
}
