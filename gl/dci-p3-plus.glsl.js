// GLSL chunk: DCI-P3+ 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.6, sign-extended.
// Mirrors dci-p3-plus.js: M = bradfordAdaptation(DCI -> D65) x MDCI, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'dci-p3-plus',
	deps: [xyz],
	edges: { xyz: ['xyz_dcip3plus', 'dcip3plus_xyz'] },
	code: /* glsl */ `
vec3 dcip3plus_xyz(vec3 c) {
	float r = spow_(c.x, 2.6); float g = spow_(c.y, 2.6); float b = spow_(c.z, 2.6);
	return vec3(
		100.0 * (0.5757134345481385 * r + 0.26841727176614394 * g + 0.10632522073738918 * b),
		100.0 * (0.2126777468109425 * r + 0.864771806295159 * g - 0.07744955310610169 * b),
		100.0 * (-0.007606026565833696 * r - 0.009238436035375287 * g + 1.1059022133610876 * b));
}
vec3 xyz_dcip3plus(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.9595185084198612 * x - 0.6106861859072285 * y - 0.23116294283955452 * z;
	float g = -0.4810673117446972 * x + 1.3071654131072101 * y + 0.13779605768990996 * z;
	float b = 0.009458196318489254 * x + 0.006719643575594741 * y + 0.9038003328909787 * z;
	return vec3(spow_(r, 1.0 / 2.6), spow_(g, 1.0 / 2.6), spow_(b, 1.0 / 2.6));
}`,
}
