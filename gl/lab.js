// GLSL chunk: CIE XYZ D65 0-100 <-> CIELAB (D50-referred, Bradford-adapted). Mirrors
// lab.js (xyz.lab / lab.xyz) and wasm/batch.js xyz_lab/lab_xyz exactly.
export default {
	name: 'lab',
	edges: { xyz: ['xyz_lab', 'lab_xyz'] },
	code: `
float lab_labf_(float t) {
	if (t > 216.0 / 24389.0) { return cbrt_(t); }
	return (24389.0 / 27.0 * t + 16.0) / 116.0;
}
float lab_labfinv_(float ft) {
	if (ft > 24.0 / 116.0) { return ft * ft * ft; }
	return (116.0 * ft - 16.0) / (24389.0 / 27.0);
}
vec3 xyz_lab(vec3 c) {
	float x1 = c.x / 100.0; float y1 = c.y / 100.0; float z1 = c.z / 100.0;
	float x50 = 1.0479298208405488 * x1 + 0.022946793341019088 * y1 - 0.05019222954313557 * z1;
	float y50 = 0.029627815688159344 * x1 + 0.990434484573249 * y1 - 0.01707382502938514 * z1;
	float z50 = -0.009243058152591178 * x1 + 0.015055144896577895 * y1 + 0.7518742899580008 * z1;
	float fx = lab_labf_(x50 / 0.9642956764295677);
	float fy = lab_labf_(y50);
	float fz = lab_labf_(z50 / 0.8251046025104602);
	return vec3(116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz));
}
vec3 lab_xyz(vec3 c) {
	float fy = (c.x + 16.0) / 116.0;
	float fx = c.y / 500.0 + fy;
	float fz = fy - c.z / 200.0;
	float x50 = lab_labfinv_(fx) * 0.9642956764295677;
	float y50 = lab_labfinv_(fy);
	float z50 = lab_labfinv_(fz) * 0.8251046025104602;
	return vec3(
		(0.9554734527042182 * x50 - 0.023098536874261423 * y50 + 0.0632593086610217 * z50) * 100.0,
		(-0.028369706963208136 * x50 + 1.0099954580058226 * y50 + 0.021041398966943008 * z50) * 100.0,
		(0.012314001688319899 * x50 - 0.020507696433477912 * y50 + 1.3303659366080753 * z50) * 100.0);
}`,
}
