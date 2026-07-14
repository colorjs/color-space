// GLSL chunk: CIE XYZ 0-100 <-> Hunt (J, C94, h). Baked to hunt.js's conditions
// (D65 white+background, LA=318.31, Normal Scenes Nc=1 Nb=75, CCT 6504, discounted
// illuminant, S=Y): FL, the rod constants, the adapted white signals, HPE⁻¹ and the
// brightness normalisers are precomputed. The inverse mirrors hunt.js exactly: the
// near-closed-form solve — J,C,h give Q/Qw, the saturation s and the opponent
// direction directly (Y_b=Y_w=100), leaving only the rod's Y-coupling to a short 1-D
// fixed point. Cone signals come back via f_n⁻¹, then HPE⁻¹ gives XYZ. Machine-exact
// for J ≥ 1; below J = 1 (essentially black) the fixed point returns a bounded
// near-black value. Unlike the former LM solve, the chunk now matches the scalar
// library to machine precision (no divergent iteration paths), so the loose tol is gone.
import xyz from './xyz.glsl.js'
export default {
	name: 'hunt',
	deps: [xyz],
	tol: 1e-6,
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
	float bs = 0.5 / (1.0 + 0.3 * spow_(max(1703.4018333056201 * ssw, 0.0), 0.3)) + 0.5 / (1.0 + 5.0 * 1703.4018333056201);
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
// white brightness Q_w at eccentricity e_s (per-sample e_s, as the model specifies)
float hunt_qw_(float es) {
	float fac = es * (10.0 / 13.0) * 0.725;
	float MybW = 100.0 * (0.5 * (0.00016743709602273782 + 0.0002628355241203195) / 4.5) * (fac * 0.99968593951195);
	float MrgW = 100.0 * (0.0000953984280975817 - 0.00016743709602273782 / 11.0) * fac;
	return spow_(7.0 * (35.718916676317086 + sqrt(MybW * MybW + MrgW * MrgW) / 100.0), 0.6) * 1.6924388501569114 - 5.966759047889217;
}
// sample luminance Y from adapted cone signals (per-channel f_n⁻¹ then HPE⁻¹ row Y)
float hunt_coneY_(vec3 rgbA) {
	float cr = 97.37325710000002 / 1.16754446414718 * hunt_fninv_((rgbA.x - 1.0) / 0.9998450496060081);
	float cg = 101.5496803 / 1.16754446414718 * hunt_fninv_((rgbA.y - 1.0) / 0.9998384047235723);
	float cb = 108.88 / 1.16754446414718 * hunt_fninv_((rgbA.z - 1.0) / 0.9998267420595157);
	return 0.37095008824868858 * cr + 0.62905425739261323 * cg - 0.0000080551421843591486 * cb;
}
// (J, C94, h) -> XYZ: near-closed-form (see hunt.js). Q/Qw, s and the opponent direction
// come straight from J, C, h; only the rod's Y-coupling needs a short 1-D fixed point.
vec3 hunt_xyz(vec3 c) {
	float J = c.x; float C = c.y; float h = c.z;
	float es = hunt_ecc_(h);
	float qr = sqrt(max(J, 0.0) / 100.0);
	float K = spow_(max(qr * hunt_qw_(es) + 5.966759047889217, 0.0) / 1.6924388501569114, 1.0 / 0.6) / 7.0;
	float hr = h * 0.017453292519943295;
	float ch = cos(hr); float sh = sin(hr);
	float fac = es * (10.0 / 13.0) * 0.725;
	float d1 = (22.0 * ch + 9.0 * sh) / 23.0;
	float d2 = 11.0 * (9.0 * sh - ch) / 23.0;
	float Km = 100.0 * fac * sqrt(0.99968593951195 * 0.99968593951195 * sh * sh + ch * ch);
	vec3 rgbA = vec3(0.0);
	if (C < 1.0e-9) {
		float a = 15.354452015861998;
		for (int i = 0; i < 30; i++) {
			float na = (K / 0.725 + 1.0 - hunt_rod_(hunt_coneY_(vec3(a, a, a)) / 100.0) + 0.3 - 1.0440306508910550 + 2.05) / 3.05;
			if (abs(na - a) < 1.0e-13) { a = na; break; }
			a = na;
		}
		rgbA = vec3(a, a, a);
	} else {
		float s = spow_(C / (2.44 * 1.35 * qr), 1.0 / 0.69);
		float Ka = 3.05 / 3.0 * (50.0 * Km / s - (d1 - d2)) + 2.0 * d1 - d2 / 20.0;
		float Y = 50.0; float rho = 0.0; float r1 = 0.0;
		for (int i = 0; i < 30; i++) {
			rho = (K - 0.725 * (1.0440306508910550 - 3.35 + hunt_rod_(Y / 100.0))) / (0.725 * Ka + Km / 100.0);
			r1 = (50.0 * Km * rho / s - rho * (d1 - d2)) / 3.0;
			float nY = hunt_coneY_(vec3(r1 + rho * d1, r1, r1 - rho * d2));
			if (abs(nY - Y) < 1.0e-11) { Y = nY; break; }
			Y = nY;
		}
		rgbA = vec3(r1 + rho * d1, r1, r1 - rho * d2);
	}
	float cr = 97.37325710000002 / 1.16754446414718 * hunt_fninv_((rgbA.x - 1.0) / 0.9998450496060081);
	float cg = 101.5496803 / 1.16754446414718 * hunt_fninv_((rgbA.y - 1.0) / 0.9998384047235723);
	float cb = 108.88 / 1.16754446414718 * hunt_fninv_((rgbA.z - 1.0) / 0.9998267420595157);
	return vec3(
		1.9101968340520348 * cr - 1.1121238927878747 * cg + 0.20190795676749937 * cb,
		0.37095008824868858 * cr + 0.62905425739261323 * cg - 0.0000080551421843591486 * cb,
		cb);
}`,
}
