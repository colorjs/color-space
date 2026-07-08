// GLSL chunk: CIE XYZ D65 0-100 <-> IgPgTg (Hensley & Fairchild 2020). Mirrors
// igpgtg.js: XYZ -> M1 -> per-channel scale [18.36, 21.46, 19435] -> signed
// power 0.427 -> M2. spow_ matches igpgtg.js's local spow exactly.
export default {
	name: 'igpgtg',
	edges: { xyz: ['xyz_igpgtg', 'igpgtg_xyz'] },
	code: /* glsl */ `
vec3 xyz_igpgtg(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float l = 2.968 * x + 2.741 * y - 0.649 * z;
	float m = 1.237 * x + 5.969 * y - 0.173 * z;
	float s = -0.318 * x + 0.387 * y + 2.311 * z;
	float lp = spow_(l / 18.36, 0.427);
	float mp = spow_(m / 21.46, 0.427);
	float sp = spow_(s / 19435.0, 0.427);
	return vec3(
		0.117 * lp + 1.464 * mp + 0.130 * sp,
		8.285 * lp - 8.361 * mp + 21.400 * sp,
		-1.208 * lp + 2.412 * mp - 36.530 * sp);
}
vec3 igpgtg_xyz(vec3 c) {
	float ig = c.x; float pg = c.y; float tg = c.z;
	float a = 0.581846461899246 * ig + 0.12331854793907823 * pg + 0.07431308420320765 * tg;
	float b = 0.634548193791416 * ig - 0.009437923746683556 * pg - 0.0032707446752297835 * tg;
	float d = 0.022656986516578322 * ig - 0.004701151874826368 * pg - 0.030048158824914566 * tg;
	float l = spow_(a, 1.0 / 0.427) * 18.36;
	float m = spow_(b, 1.0 / 0.427) * 21.46;
	float s = spow_(d, 1.0 / 0.427) * 19435.0;
	return vec3(
		100.0 * (0.4343486855574634 * l - 0.20636237011428424 * m + 0.10653033617352775 * s),
		100.0 * (-0.08785463778363384 * l + 0.20846346647992348 * m - 0.00906684561685487 * s),
		100.0 * (0.07447971736457797 * l - 0.06330532030466152 * m + 0.44889031421761344 * s));
}`,
}
