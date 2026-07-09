// GLSL chunk: CIE XYZ 0-100 <-> Nayatani95 (L*P, C, h). Baked to nayatani95.js's
// conditions (D65 white, Yo=20, Eo=5000 lx, Eor=1000 lx, n=1): ξηζ, the β factors
// and the four (e_R, e_G)-regime inverse matrices are precomputed constants. The
// inverse solves the 3×3 log system per regime and keeps the self-consistent one —
// exact, no iteration, as nayatani95.js.
import xyz from './xyz.glsl.js'
export default {
	name: 'nayatani95',
	deps: [xyz],
	edges: { xyz: ['xyz_nayatani95', 'nayatani95_xyz'] },
	code: /* glsl */ `
float nayatani95_es_(float t) {
	return 0.9394 - 0.2478 * sin(t) - 0.0743 * sin(2.0 * t) + 0.0666 * sin(3.0 * t) - 0.0186 * sin(4.0 * t)
		- 0.0055 * cos(t) - 0.0521 * cos(2.0 * t) - 0.0573 * cos(3.0 * t) - 0.0061 * cos(4.0 * t);
}
vec3 xyz_nayatani95(vec3 c) {
	float R = 0.40024 * c.x + 0.7076 * c.y - 0.08081 * c.z;
	float G = -0.2263 * c.x + 1.16532 * c.y + 0.0457 * c.z;
	float B = 0.91822 * c.z;
	float lr = log((R + 1.0) / 21.00084384) / log(10.0);
	float lg = log((G + 1.0) / 20.9996002) / log(10.0);
	float lb = log((B + 1.0) / 20.995158720000006) / log(10.0);
	float eR = 1.0; if (R >= 20.00084384) { eR = 1.758; }
	float eG = 1.0; if (G >= 19.9996002) { eG = 1.758; }
	float Q = ((2.0 / 3.0) * 4.610622226467659 * eR * lr + (1.0 / 3.0) * 4.610589263466818 * eG * lg) * 41.69 / 3.6810214956040888;
	float t = 4.610622226467659 * lr - (12.0 / 11.0) * 4.610589263466818 * lg + (1.0 / 11.0) * 4.652069860953014 * lb;
	float p = (1.0 / 9.0) * 4.610622226467659 * lr + (1.0 / 9.0) * 4.610589263466818 * lg - (2.0 / 9.0) * 4.652069860953014 * lb;
	float L = Q + 50.0;
	float th = atan2_(p, t);
	float S = 488.93 / 3.6810214956040888 * nayatani95_es_(th) * sqrt(t * t + p * p);
	float h = th * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	return vec3(L, spow_(max(L, 0.0) / 50.0, 0.7) * S, h);
}
vec3 nayatani95_solve_(float a0, float a1, float a2, float a3, float a4, float a5, float a6, float a7, float a8, float Q, float t, float p) {
	float lr = a0 * Q + a1 * t + a2 * p;
	float lg = a3 * Q + a4 * t + a5 * p;
	float lb = a6 * Q + a7 * t + a8 * p;
	return vec3(
		21.00084384 * pow(10.0, lr) - 1.0,
		20.9996002 * pow(10.0, lg) - 1.0,
		20.995158720000006 * pow(10.0, lb) - 1.0);
}
float nayatani95_err_(vec3 rgb, float eR, float eG) {
	float e = 0.0;
	float isR = 0.0; if (rgb.x >= 20.00084384) { isR = 1.0; }
	float wantR = 0.0; if (eR > 1.5) { wantR = 1.0; }
	if (isR != wantR) { e = e + 1.0; }
	float isG = 0.0; if (rgb.y >= 19.9996002) { isG = 1.0; }
	float wantG = 0.0; if (eG > 1.5) { wantG = 1.0; }
	if (isG != wantG) { e = e + 1.0; }
	return e;
}
vec3 nayatani95_xyz(vec3 c) {
	float Q = (c.x - 50.0) * 3.6810214956040888 / 41.69;
	float th = c.z * 0.017453292519943295;
	float S = 0.0;
	if (c.x > 0.0) { S = c.y / spow_(c.x / 50.0, 0.7); }
	float mag = S * 3.6810214956040888 / (488.93 * nayatani95_es_(th));
	float t = mag * cos(th);
	float p = mag * sin(th);
	vec3 best = nayatani95_solve_(0.21689046529542522, 0.06915348168839644, 0.028290060690707643, 0.21689201593465623, -0.13830795219021555, -0.05658052589599728, 0.21495807885291343, -0.03426867923742098, -0.9813303599806918, Q, t, p);
	float bestErr = nayatani95_err_(best, 1.0, 1.0);
	vec3 r2 = nayatani95_solve_(0.17314300050193604, 0.09705041575960692, 0.03970244281074829, 0.17314423837253026, -0.11041081867233812, -0.04516806218413833, 0.17160038226682817, -0.006620293008612997, -0.9700196565234521, Q, t, p);
	float e2 = nayatani95_err_(r2, 1.0, 1.758);
	if (e2 < bestErr) { best = r2; bestErr = e2; }
	vec3 r3 = nayatani95_solve_(0.1440813542706545, 0.045938982521078246, 0.01879322012225929, 0.14408238436757503, -0.1615226173275458, -0.06607743436126876, 0.14279766088546067, -0.057276348734289995, -0.9907425884112292, Q, t, p);
	float e3 = nayatani95_err_(r3, 1.758, 1.0);
	if (e3 < bestErr) { best = r3; bestErr = e3; }
	vec3 r4 = nayatani95_solve_(0.12337341598147056, 0.06915348168839645, 0.028290060690707643, 0.12337429802881471, -0.13830795219021555, -0.05658052589599728, 0.1222742200528518, -0.03426867923742099, -0.9813303599806917, Q, t, p);
	float e4 = nayatani95_err_(r4, 1.758, 1.758);
	if (e4 < bestErr) { best = r4; bestErr = e4; }
	return vec3(
		1.8599363874558397 * best.x - 1.1293816185800916 * best.y + 0.21989740959619328 * best.z,
		0.3611914362417676 * best.x + 0.6388124632850422 * best.y - 0.000006370596838650885 * best.z,
		1.0890636230968613 * best.z);
}`,
}
