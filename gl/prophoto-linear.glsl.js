// GLSL chunk: linear-light ProPhoto RGB 0-1 (D50) <-> CIE XYZ D65 0-100.
// Mirrors prophoto-linear.js: ProPhoto-linear <-> XYZ D50 via M_PP_XYZ50/M_XYZ50_PP,
// then Bradford-adapted to/from D65 (xyz.js bradford.D50_D65/D65_D50) same as the JS lib.
import xyz from './xyz.glsl.js'
export default {
	name: 'prophoto-linear',
	deps: [xyz],
	edges: { xyz: ['xyz_prophotolinear', 'prophotolinear_xyz'] },
	code: /* glsl */ `
vec3 prophotolinear_xyz(vec3 c) {
	float x50 = 0.7977666449006423 * c.x + 0.13518129740053308 * c.y + 0.0313477341283922 * c.z;
	float y50 = 0.2880748288194013 * c.x + 0.711835234241873 * c.y + 0.00008993693872564 * c.z;
	float z50 = 0.8251046025104602 * c.z;
	return vec3(
		100.0 * (0.955473421488075 * x50 - 0.02309845494876471 * y50 + 0.06325924320057072 * z50),
		100.0 * (-0.0283697093338637 * x50 + 1.0099953980813041 * y50 + 0.021041441191917323 * z50),
		100.0 * (0.012314014864481998 * x50 - 0.020507649298898964 * y50 + 1.330365926242124 * z50));
}
vec3 xyz_prophotolinear(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float x50 = 1.0479297925449969 * x + 0.022946870601609652 * y - 0.05019226628920524 * z;
	float y50 = 0.02962780877005599 * x + 0.9904344267538799 * y - 0.017073799063418826 * z;
	float z50 = -0.009243040646204504 * x + 0.015055191490298152 * y + 0.7518742814281371 * z;
	return vec3(
		1.3457868816471583 * x50 - 0.25557208737979464 * y50 - 0.05110186497554526 * z50,
		-0.5446307051249019 * x50 + 1.5082477428451468 * y50 + 0.02052744743642139 * z50,
		1.2119675456389452 * z50);
}`,
}
