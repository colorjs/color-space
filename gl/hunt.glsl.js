// GLSL chunk: CIE XYZ 0-100 <-> Hunt (J, C94, h). Baked to hunt.js's conditions
// (D65 white+background, LA=318.31, Normal Scenes Nc=1 Nb=75, CCT 6504, discounted
// illuminant, S=Y): FL, the rod constants, the adapted white signals and the
// brightness normalisers are precomputed. The inverse mirrors hunt.js's damped
// Newton in (J, C·cos h, C·sin h) scalar-for-scalar; two guards differ in form only
// — spow_ replaces JS pow on possibly-negative probe luminances (JS yields NaN and
// rejects the candidate; spow_ yields a worse finite error, same rejection), and a
// tiny-determinant break replaces the non-finite-step break.
export default {
	name: 'hunt',
	edges: { xyz: ['xyz_hunt', 'hunt_xyz'] },
	code: /* glsl */ `
float hunt_fn_(float x) {
	float q = spow_(x, 0.73);
	return 40.0 * q / (q + 2.0);
}
float hunt_ecc_(float h) {
	if (h < 20.14) { return 0.856 - h / 20.14 * 0.056; }
	if (h > 237.53) { return 0.856 + 0.344 * (360.0 - h) / 122.47; }
	if (h <= 90.0) { return 0.8 + (0.7 - 0.8) * (h - 20.14) / (90.0 - 20.14); }
	if (h <= 164.25) { return 0.7 + (1.0 - 0.7) * (h - 90.0) / (164.25 - 90.0); }
	return 1.0 + (1.2 - 1.0) * (h - 164.25) / (237.53 - 164.25);
}
float hunt_rod_(float ssw) {
	float bs = 0.5 / (1.0 + 0.3 * spow_(1703.4018333056201 * ssw, 0.3)) + 0.5 / (1.0 + 5.0 * 1703.4018333056201);
	return hunt_fn_(0.6911667662043256 * ssw) * 3.05 * bs + 0.3;
}
vec3 xyz_hunt(vec3 c) {
	float ra = 1.0 + 0.9998450496060081 * hunt_fn_(1.16754446414718 * (0.38971 * c.x + 0.68898 * c.y - 0.07868 * c.z) / 97.37325710000002);
	float ga = 1.0 + 0.9998384047235723 * hunt_fn_(1.16754446414718 * (-0.22981 * c.x + 1.1834 * c.y + 0.04641 * c.z) / 101.5496803);
	float ba = 1.0 + 0.9998267420595157 * hunt_fn_(1.16754446414718 * c.z / 108.88);
	float Aa = 2.0 * ra + ga + ba / 20.0 - 3.05 + 1.0;
	float C1 = ra - ga; float C2 = ga - ba; float C3 = ba - ra;
	float h = atan2_(0.5 * (C2 - C3) / 4.5, C1 - C2 / 11.0) * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	float es = hunt_ecc_(h);
	float fac = es * (10.0 / 13.0) * 0.725;
	float Myb = 100.0 * (0.5 * (C2 - C3) / 4.5) * (fac * 0.99968593951195);
	float Mrg = 100.0 * (C1 - C2 / 11.0) * fac;
	float M = sqrt(Myb * Myb + Mrg * Mrg);
	float MybW = 100.0 * (0.5 * (0.00016743709602273782 + 0.0002628355241203195) / 4.5) * (fac * 0.99968593951195);
	float MrgW = 100.0 * (0.0000953984280975817 - 0.00016743709602273782 / 11.0) * fac;
	float Mw = sqrt(MybW * MybW + MrgW * MrgW);
	float s = 50.0 * M / (ra + ga + ba);
	float A = 0.725 * (Aa - 1.0 + hunt_rod_(c.y / 100.0) - 0.3 + 1.0440306508910550);
	float Q = spow_(7.0 * (A + M / 100.0), 0.6) * 1.6924388501569114 - 5.966759047889217;
	float Qw = spow_(7.0 * (35.718916676317086 + Mw / 100.0), 0.6) * 1.6924388501569114 - 5.966759047889217;
	float qr = Q / Qw;
	float J = 100.0 * qr * qr;
	float C94 = 2.44 * spow_(s, 0.69) * qr * 1.35;
	return vec3(J, C94, h);
}
vec3 hunt_g_(vec3 p) {
	vec3 f = xyz_hunt(p);
	float a = f.z * 0.017453292519943295;
	return vec3(f.x, f.y * cos(a), f.y * sin(a));
}
vec3 hunt_xyz(vec3 c) {
	float hr = c.z * 0.017453292519943295;
	float T0 = c.x; float T1 = c.y * cos(hr); float T2 = c.y * sin(hr);
	float p0 = 95.05 * c.x / 100.0; float p1 = 100.0 * c.x / 100.0; float p2 = 108.88 * c.x / 100.0;
	float b0 = p0; float b1 = p1; float b2 = p2;
	float bestE = 1.0e20;
	for (int i = 0; i < 60; i++) {
		vec3 f = hunt_g_(vec3(p0, p1, p2));
		float e0 = f.x - T0; float e1 = f.y - T1; float e2 = f.z - T2;
		float err = sqrt(e0 * e0 + e1 * e1 + e2 * e2);
		if (err < bestE) { bestE = err; b0 = p0; b1 = p1; b2 = p2; }
		if (err < 1.0e-10) { break; }
		vec3 fx = hunt_g_(vec3(p0 + 1.0e-4, p1, p2));
		vec3 fy = hunt_g_(vec3(p0, p1 + 1.0e-4, p2));
		vec3 fz = hunt_g_(vec3(p0, p1, p2 + 1.0e-4));
		float j00 = (fx.x - f.x) * 1.0e4; float j01 = (fy.x - f.x) * 1.0e4; float j02 = (fz.x - f.x) * 1.0e4;
		float j10 = (fx.y - f.y) * 1.0e4; float j11 = (fy.y - f.y) * 1.0e4; float j12 = (fz.y - f.y) * 1.0e4;
		float j20 = (fx.z - f.z) * 1.0e4; float j21 = (fy.z - f.z) * 1.0e4; float j22 = (fz.z - f.z) * 1.0e4;
		float A0 = j11 * j22 - j12 * j21; float B0 = j12 * j20 - j10 * j22; float C0 = j10 * j21 - j11 * j20;
		float det = j00 * A0 + j01 * B0 + j02 * C0;
		if (abs(det) < 1.0e-30) { break; }
		float d0 = -(A0 * e0 + (j02 * j21 - j01 * j22) * e1 + (j01 * j12 - j02 * j11) * e2) / det;
		float d1 = -(B0 * e0 + (j00 * j22 - j02 * j20) * e1 + (j02 * j10 - j00 * j12) * e2) / det;
		float d2 = -(C0 * e0 + (j01 * j20 - j00 * j21) * e1 + (j00 * j11 - j01 * j10) * e2) / det;
		float lam = 1.0;
		float n0 = p0; float n1 = p1; float n2 = p2;
		float ok = 0.0;
		for (int s2 = 0; s2 < 10; s2++) {
			float c0 = clamp(p0 + lam * d0, -20.0, 250.0);
			float c1 = clamp(p1 + lam * d1, -20.0, 250.0);
			float c2 = clamp(p2 + lam * d2, -20.0, 250.0);
			vec3 fc = hunt_g_(vec3(c0, c1, c2));
			float ec0 = fc.x - T0; float ec1 = fc.y - T1; float ec2 = fc.z - T2;
			if (sqrt(ec0 * ec0 + ec1 * ec1 + ec2 * ec2) < err) { n0 = c0; n1 = c1; n2 = c2; ok = 1.0; break; }
			lam = lam / 2.0;
		}
		if (ok < 0.5) { break; }
		p0 = n0; p1 = n1; p2 = n2;
	}
	return vec3(b0, b1, b2);
}`,
}
