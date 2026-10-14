// GLSL chunk: ECI RGB v2 0-1 <-> CIE XYZ D65 0-100. CIE L* transfer
// (cie.js labF/labFInv: exact ε = 216/24389, κ = 24389/27), linear through 0.
// Mirrors ecirgb.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'ecirgb',
	deps: [xyz],
	edges: { xyz: ['xyz_ecirgb', 'ecirgb_xyz'] },
	code: /* glsl */ `
float ecirgb_f_(float t) {
	if (t > 216.0 / 24389.0) { return cbrt_(t); }
	return (24389.0 / 27.0 * t + 16.0) / 116.0;
}
float ecirgb_finv_(float ft) {
	if (ft > 24.0 / 116.0) { return ft * ft * ft; }
	return (116.0 * ft - 16.0) / (24389.0 / 27.0);
}
float ecirgb_dec_(float u) { return ecirgb_finv_((100.0 * u + 16.0) / 116.0); }
float ecirgb_enc_(float u) { return (116.0 * ecirgb_f_(u) - 16.0) / 100.0; }
vec3 ecirgb_xyz(vec3 c) {
	float r = ecirgb_dec_(c.x); float g = ecirgb_dec_(c.y); float b = ecirgb_dec_(c.z);
	return vec3(
		100.0 * (0.6139558250911575 * r + 0.16052148615110753 * g + 0.17597861799722095 * b),
		100.0 * (0.3050545946551835 * r + 0.6044223376842316 * g + 0.09052309503109568 * b),
		100.0 * (0.0014392643940592878 * r + 0.0800908576914581 * g + 1.0075275773870602 * b));
}
vec3 xyz_ecirgb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.8556680490166684 * x - 0.4552974941463714 * y - 0.28321106717250794 * z;
	float g = -0.9474465138937898 * x + 1.9068675688559427 * y - 0.005841255503109718 * z;
	float b = 0.07266402290869213 * x - 0.1509312191890994 * y + 0.9933975696862929 * z;
	return vec3(ecirgb_enc_(r), ecirgb_enc_(g), ecirgb_enc_(b));
}`,
}
