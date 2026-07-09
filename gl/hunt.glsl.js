// GLSL chunk: CIE XYZ 0-100 <-> Hunt (J, C94, h). Baked to hunt.js's conditions
// (D65 white+background, LA=318.31, Normal Scenes Nc=1 Nb=75, CCT 6504, discounted
// illuminant, S=Y): FL, the rod constants, the adapted white signals, HPE⁻¹ and the
// brightness normalisers are precomputed. The inverse mirrors hunt.js exactly: a
// Levenberg-Marquardt solve in ADAPTED-CONE space (where black is the regular point
// (1,1,1), not the f_n singularity at the origin — a plain Newton in XYZ diverges for
// saturated colours), seeded from the white-adapted cone, then XYZ recovered
// analytically (per-channel f_n inverse + HPE⁻¹). Machine-exact for J ≥ 1; below J = 1
// (essentially black) f32 and f64 take different LM paths in a razor-thin basin, hence
// the loose `tol`.
import xyz from './xyz.glsl.js'
export default {
	name: 'hunt',
	deps: [xyz],
	tol: 2e-2,
	edges: { xyz: ['xyz_hunt', 'hunt_xyz'] },
	code: /* glsl */ `
float hunt_fn_(float x) {
	float q = spow_(x, 0.73);
	return 40.0 * q / (q + 2.0);
}
float hunt_fninv_(float y) {
	float a = min(abs(y), 39.9999);
	float p = 2.0 * a / (40.0 - a);
	return sign(y) * spow_(p, 1.0 / 0.73);
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
// (J, C94, h) from adapted cone signals rgbA and sample luminance Y
vec3 hunt_corr_(vec3 rgbA, float Y) {
	float Aa = 2.0 * rgbA.x + rgbA.y + rgbA.z / 20.0 - 3.05 + 1.0;
	float C1 = rgbA.x - rgbA.y; float C2 = rgbA.y - rgbA.z; float C3 = rgbA.z - rgbA.x;
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
	float s = 50.0 * M / (rgbA.x + rgbA.y + rgbA.z);
	float A = 0.725 * (Aa - 1.0 + hunt_rod_(Y / 100.0) - 0.3 + 1.0440306508910550);
	float Q = spow_(7.0 * (A + M / 100.0), 0.6) * 1.6924388501569114 - 5.966759047889217;
	float Qw = spow_(7.0 * (35.718916676317086 + Mw / 100.0), 0.6) * 1.6924388501569114 - 5.966759047889217;
	float qr = Q / Qw;
	return vec3(100.0 * qr * qr, 2.44 * spow_(s, 0.69) * qr * 1.35, h);
}
vec3 xyz_hunt(vec3 c) {
	float ra = 1.0 + 0.9998450496060081 * hunt_fn_(1.16754446414718 * (0.38971 * c.x + 0.68898 * c.y - 0.07868 * c.z) / 97.37325710000002);
	float ga = 1.0 + 0.9998384047235723 * hunt_fn_(1.16754446414718 * (-0.22981 * c.x + 1.1834 * c.y + 0.04641 * c.z) / 101.5496803);
	float ba = 1.0 + 0.9998267420595157 * hunt_fn_(1.16754446414718 * c.z / 108.88);
	return hunt_corr_(vec3(ra, ga, ba), c.y);
}
// residual: rgbA -> (J, C·cos h, C·sin h). Recovers cone signals + Y analytically.
vec3 hunt_g_(vec3 rgbA) {
	float cr = 97.37325710000002 / 1.16754446414718 * hunt_fninv_((rgbA.x - 1.0) / 0.9998450496060081);
	float cg = 101.5496803 / 1.16754446414718 * hunt_fninv_((rgbA.y - 1.0) / 0.9998384047235723);
	float cb = 108.88 / 1.16754446414718 * hunt_fninv_((rgbA.z - 1.0) / 0.9998267420595157);
	float Y = 0.37095008824868858 * cr + 0.62905425739261323 * cg - 0.0000080551421843591486 * cb;
	vec3 f = hunt_corr_(rgbA, Y);
	float a = f.z * 0.017453292519943295;
	return vec3(f.x, f.y * cos(a), f.y * sin(a));
}
vec3 hunt_xyz(vec3 c) {
	float hr = c.z * 0.017453292519943295;
	float T0 = c.x; float T1 = c.y * cos(hr); float T2 = c.y * sin(hr);
	vec3 p = vec3(15.354452015861998, 15.3543566174339, 15.354189180337878); // rgbAw seed
	vec3 f = hunt_g_(p);
	float e0 = f.x - T0; float e1 = f.y - T1; float e2 = f.z - T2;
	float cost = e0 * e0 + e1 * e1 + e2 * e2;
	float lam = 1.0e-3;
	for (int it = 0; it < 40; it++) {
		if (cost < 1.0e-24) { break; }
		float hs = 1.0e-5;
		vec3 fx = hunt_g_(vec3(p.x + hs, p.y, p.z));
		vec3 fy = hunt_g_(vec3(p.x, p.y + hs, p.z));
		vec3 fz = hunt_g_(vec3(p.x, p.y, p.z + hs));
		float j00 = (fx.x - f.x) / hs; float j01 = (fy.x - f.x) / hs; float j02 = (fz.x - f.x) / hs;
		float j10 = (fx.y - f.y) / hs; float j11 = (fy.y - f.y) / hs; float j12 = (fz.y - f.y) / hs;
		float j20 = (fx.z - f.z) / hs; float j21 = (fy.z - f.z) / hs; float j22 = (fz.z - f.z) / hs;
		float h00 = j00 * j00 + j10 * j10 + j20 * j20;
		float h01 = j00 * j01 + j10 * j11 + j20 * j21;
		float h02 = j00 * j02 + j10 * j12 + j20 * j22;
		float h11 = j01 * j01 + j11 * j11 + j21 * j21;
		float h12 = j01 * j02 + j11 * j12 + j21 * j22;
		float h22 = j02 * j02 + j12 * j12 + j22 * j22;
		float g0 = j00 * e0 + j10 * e1 + j20 * e2;
		float g1 = j01 * e0 + j11 * e1 + j21 * e2;
		float g2 = j02 * e0 + j12 * e1 + j22 * e2;
		float stepped = 0.0;
		for (int tr = 0; tr < 15; tr++) {
			float d00 = h00 * (1.0 + lam); float d11 = h11 * (1.0 + lam); float d22 = h22 * (1.0 + lam);
			float A0 = d11 * d22 - h12 * h12;
			float A1 = h12 * h02 - h01 * d22;
			float A2 = h01 * h12 - d11 * h02;
			float det = d00 * A0 + h01 * A1 + h02 * A2;
			if (abs(det) < 1.0e-30) { lam = lam * 3.0; continue; }
			float B1 = d00 * d22 - h02 * h02;
			float B2 = h01 * h02 - d00 * h12;
			float C2b = d00 * d11 - h01 * h01;
			float dp0 = -(A0 * g0 + A1 * g1 + A2 * g2) / det;
			float dp1 = -(A1 * g0 + B1 * g1 + B2 * g2) / det;
			float dp2 = -(A2 * g0 + B2 * g1 + C2b * g2) / det;
			vec3 np = vec3(p.x + dp0, p.y + dp1, p.z + dp2);
			vec3 nf = hunt_g_(np);
			float ne0 = nf.x - T0; float ne1 = nf.y - T1; float ne2 = nf.z - T2;
			float nc = ne0 * ne0 + ne1 * ne1 + ne2 * ne2;
			if (nc < cost) { p = np; f = nf; e0 = ne0; e1 = ne1; e2 = ne2; cost = nc; lam = max(lam * 0.3, 1.0e-10); stepped = 1.0; break; }
			lam = lam * 3.0;
		}
		if (stepped < 0.5) { break; }
	}
	float cr = 97.37325710000002 / 1.16754446414718 * hunt_fninv_((p.x - 1.0) / 0.9998450496060081);
	float cg = 101.5496803 / 1.16754446414718 * hunt_fninv_((p.y - 1.0) / 0.9998384047235723);
	float cb = 108.88 / 1.16754446414718 * hunt_fninv_((p.z - 1.0) / 0.9998267420595157);
	return vec3(
		1.9101968340520348 * cr - 1.1121238927878747 * cg + 0.20190795676749937 * cb,
		0.37095008824868858 * cr + 0.62905425739261323 * cg - 0.0000080551421843591486 * cb,
		cb);
}`,
}
