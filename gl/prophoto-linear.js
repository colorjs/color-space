// GLSL chunk: linear-light ProPhoto RGB 0-1 (D50) <-> CIE XYZ D65 0-100.
// Mirrors prophoto-linear.js: ProPhoto-linear <-> XYZ D50 via M_PP_XYZ50/M_XYZ50_PP,
// then Bradford-adapted to/from D65 (xyz.js bradford.D50_D65/D65_D50) same as the JS lib.
export default {
	name: 'prophoto-linear',
	edges: { xyz: ['xyz_prophotolinear', 'prophotolinear_xyz'] },
	code: `
vec3 prophotolinear_xyz(vec3 c) {
	float x50 = 0.7977666449006423 * c.x + 0.13518129740053308 * c.y + 0.0313477341283922 * c.z;
	float y50 = 0.2880748288194013 * c.x + 0.711835234241873 * c.y + 0.00008993693872564 * c.z;
	float z50 = 0.8251046025104602 * c.z;
	return vec3(
		100.0 * (0.9554734527042182 * x50 - 0.023098536874261423 * y50 + 0.0632593086610217 * z50),
		100.0 * (-0.028369706963208136 * x50 + 1.0099954580058226 * y50 + 0.021041398966943008 * z50),
		100.0 * (0.012314001688319899 * x50 - 0.020507696433477912 * y50 + 1.3303659366080753 * z50));
}
vec3 xyz_prophotolinear(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float x50 = 1.0479298208405488 * x + 0.022946793341019088 * y - 0.05019222954313557 * z;
	float y50 = 0.029627815688159344 * x + 0.990434484573249 * y - 0.01707382502938514 * z;
	float z50 = -0.009243058152591178 * x + 0.015055144896577895 * y + 0.7518742899580008 * z;
	return vec3(
		1.3457868816471583 * x50 - 0.25557208737979464 * y50 - 0.05110186497554526 * z50,
		-0.5446307051249019 * x50 + 1.5082477428451468 * y50 + 0.02052744743642139 * z50,
		1.2119675456389452 * z50);
}`,
}
