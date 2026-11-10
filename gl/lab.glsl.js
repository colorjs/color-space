// GLSL chunk: CIE XYZ D65 0-100 <-> CIELAB (D50-referred, Bradford-adapted). Mirrors
// lab.js (xyz.lab / lab.xyz) and wasm/batch.js xyz_lab/lab_xyz exactly — including the
// composed-in-source display route (lab.rgb / rgb.lab), whose Bradford∘XYZ→lRGB matrix
// pre-multiplies at module scope in lab.js; the constants here are that product.
import xyz from './xyz.glsl.js'
export default {
	name: 'lab',
	deps: [xyz],
	edges: { xyz: ['xyz_lab', 'lab_xyz'], rgb: ['rgb_lab', 'lab_rgb'] },
	code: /* glsl */ `
float lab_dec_(float u) {
	float a = abs(u);
	if (a > 0.04045) { return sign(u) * pow((a + 0.055) / 1.055, 2.4); }
	return u / 12.92;
}
float lab_enc_(float u) {
	float a = abs(u);
	if (a > 0.0031308) { return sign(u) * (1.055 * pow(a, 1.0 / 2.4) - 0.055); }
	return 12.92 * u;
}
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
	float x50 = 1.0479297925449969 * x1 + 0.022946870601609652 * y1 - 0.05019226628920524 * z1;
	float y50 = 0.02962780877005599 * x1 + 0.9904344267538799 * y1 - 0.017073799063418826 * z1;
	float z50 = -0.009243040646204504 * x1 + 0.015055191490298152 * y1 + 0.7518742814281371 * z1;
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
		(0.955473421488075 * x50 - 0.02309845494876471 * y50 + 0.06325924320057072 * z50) * 100.0,
		(-0.0283697093338637 * x50 + 1.0099953980813041 * y50 + 0.021041441191917323 * z50) * 100.0,
		(0.012314014864481998 * x50 - 0.020507649298898964 * y50 + 1.330365926242124 * z50) * 100.0);
}
vec3 lab_rgb(vec3 c) {
	float fy = (c.x + 16.0) / 116.0;
	float fx = c.y / 500.0 + fy;
	float fz = fy - c.z / 200.0;
	float x50 = lab_labfinv_(fx) * 0.9642956764295677;
	float y50 = lab_labfinv_(fy);
	float z50 = lab_labfinv_(fz) * 0.8251046025104602;
	float r = 3.1341358529001986 * x50 - 1.6173859980180678 * y50 - 0.490662217911094 * z50;
	float g = -0.9787954765558085 * x50 + 1.9162543773960103 * y50 + 0.03344287339036723 * z50;
	float b = 0.07195539255794621 * x50 - 0.22897675981517376 * y50 + 1.4053860351131187 * z50;
	return vec3(255.0 * lab_enc_(r), 255.0 * lab_enc_(g), 255.0 * lab_enc_(b));
}
vec3 rgb_lab(vec3 c) {
	float r = lab_dec_(c.x / 255.0);
	float g = lab_dec_(c.y / 255.0);
	float b = lab_dec_(c.z / 255.0);
	float x50 = 0.4360657468742596 * r + 0.38515150959015165 * g + 0.14307841996513423 * b;
	float y50 = 0.22249317711056463 * r + 0.7168870130944764 * g + 0.060619809794951574 * b;
	float z50 = 0.013923921463168846 * r + 0.09708132423140564 * g + 0.7140993568158802 * b;
	float fx = lab_labf_(x50 / 0.9642956764295677);
	float fy = lab_labf_(y50);
	float fz = lab_labf_(z50 / 0.8251046025104602);
	return vec3(116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz));
}`,
}
