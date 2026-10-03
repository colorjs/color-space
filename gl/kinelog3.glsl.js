// GLSL chunk: KineLOG3 0-1 <-> CIE XYZ D65 0-100, via Kinefinity Wide Gamut linear RGB.
// log10 curve with a linear segment below the negative cut, then the KWG -> XYZ matrix;
// mirrors kinelog3.js enc/dec and M; MI is M's exact inverse (inv3).
import xyz from './xyz.glsl.js'
export default {
	name: 'kinelog3',
	deps: [xyz],
	edges: { xyz: ['xyz_kinelog3', 'kinelog3_xyz'] },
	code: /* glsl */ `
float kinelog3_enc_(float x) {
	if (x >= -0.008239) { return (log(66.64 * x + 1.0) / 2.302585092994046) * 0.296 * 0.907136 + 0.092864; }
	return (x + 0.008239) / 0.017178;
}
float kinelog3_dec_(float y) {
	if (y >= 0.0) { return (pow(10.0, (y - 0.092864) / 0.296 / 0.907136) - 1.0) / 66.64; }
	return y * 0.017178 - 0.008239;
}
vec3 kinelog3_xyz(vec3 c) {
	float r = kinelog3_dec_(c.x); float g = kinelog3_dec_(c.y); float b = kinelog3_dec_(c.z);
	return vec3(
		100.0 * (0.6879169670679012 * r + 0.19791836478086558 * g + 0.06462059520290471 * b),
		100.0 * (0.20734731460163125 * r + 1.0622266609089932 * g + -0.2695739755106249 * b),
		100.0 * (0.013356728854706327 * r + -0.3348604778597252 * g + 1.4105614997648976 * b));
}
vec3 xyz_kinelog3(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.556510592475002 * x - 0.3325280716498344 * y - 0.13485661929706244 * z;
	float g = -0.32729041352304183 * x + 1.0716933354710427 * y + 0.21980632134714545 * z;
	float b = -0.09243589466757149 * x + 0.257563551667244 * y + 0.7623954668267549 * z;
	return vec3(kinelog3_enc_(r), kinelog3_enc_(g), kinelog3_enc_(b));
}`,
}
