/**
 * OSA-UCS color space
 *
 * Uniform Color Scale by Optical Society of America (MacAdam 1974)
 * Perceptually uniform color space for industrial applications
 *
 * @channel {L} -10 10 Lightness
 * @channel {j} -10 10 Yellow-Blue axis
 * @channel {g} -10 10 Red-Green axis
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

var osaucs = {
	name: 'osaucs'
};

// XYZ -> RGB (MacAdam 1974, Table 1); single source of truth, inverse derived
const M_OSA = [
	0.7990, 0.4194, -0.1648,
	-0.4493, 1.3265, 0.0927,
	-0.1149, 0.3394, 0.7170
];
const M_OSA_INV = inv3(M_OSA);

// Augmented system [a; b; w] -> [∛R; ∛G; ∛B], with w = ∛R as the free Newton
// variable. The a,b equations are 2 constraints on 3 cube-roots; w closes the system.
const A_AUG_INV = inv3([
	-13.7, 17.7, -4,
	1.7, 8, -9.7,
	1, 0, 0
]);

// OSA modified-luminance factor K(x,y) (Y0 = K·Y)
const Kfactor = (x, y) =>
	4.4934 * x * x + 4.3034 * y * y - 4.276 * x * y - 1.3744 * x - 2.56439 * y + 1.8103;

/**
 * XYZ (0-100) -> OSA-UCS Ljg
 *
 * @return {Array<number>} L, j, g: roughly -10 to 10
 */
xyz.osaucs = function (X, Y, Z) {
	var sum = X + Y + Z;
	// black has no chromaticity -> use D65 neutral so K stays finite (yields j=g=0)
	var x = sum === 0 ? 0.31272 : X / sum;
	var y = sum === 0 ? 0.32903 : Y / sum;

	var Y0 = Kfactor(x, y) * Y;

	// signed cube root throughout (MacAdam 1974 / colour-science use spow)
	var L_ = 5.9 * (Math.cbrt(Y0) - 2 / 3 + 0.042 * Math.cbrt(Y0 - 30));
	var L = (L_ - 14.3993) / Math.SQRT2;

	var C = L_ / (5.9 * (Math.cbrt(Y0) - 2 / 3));

	var [R, G, B] = mat3(M_OSA, X, Y, Z);
	R = Math.cbrt(R); G = Math.cbrt(G); B = Math.cbrt(B);

	var a = -13.7 * R + 17.7 * G - 4 * B;
	var b = 1.7 * R + 8 * G - 9.7 * B;

	return [L, C * b, C * a]; // [L, j, g]
};

/**
 * OSA-UCS Ljg -> XYZ (0-100). No analytical inverse exists; this is the
 * colour-science 1D Newton-on-`w` method (Schlömer 2019 / Kobayasi & Yosiki 2002),
 * dependency-free. Recovers L' and Y0, then iterates the single free cube-root `w`
 * until the modified luminance K(x,y)·Y matches Y0.
 * @see {@link https://colour.readthedocs.io/en/develop/_modules/colour/models/osa_ucs.html}
 */
osaucs.xyz = function (L, j, g) {
	// recover L' and the lightness root t = ∛Y0 from L' = 5.9(t - 2/3 + 0.042·∛(t³-30))
	var L_ = L * Math.SQRT2 + 14.3993;
	var u = L_ / 5.9 + 2 / 3; // u = t + 0.042·∛(t³-30)
	var t = u; // seed: ignore the small toe term
	for (var i = 0; i < 64; i++) {
		var t3 = t * t * t - 30;
		var f = t + 0.042 * Math.cbrt(t3) - u;
		// d/dt[0.042·∛(t³-30)] = 0.042·t² / ∛((t³-30)²)
		var d = 1 + 0.042 * t * t / Math.cbrt(t3 * t3);
		var dt = f / d;
		t -= dt;
		if (Math.abs(dt) < 1e-12) break;
	}
	var Y0 = t * t * t;
	var C = L_ / (5.9 * (t - 2 / 3));
	var a = g / C, b = j / C; // g = C·a, j = C·b

	// Y0 as a function of the free variable w = ∛R
	var probe = function (w) {
		var [r3, g3, b3] = mat3(A_AUG_INV, a, b, w);
		var [X, Y, Z] = mat3(M_OSA_INV, r3 * r3 * r3, g3 * g3 * g3, b3 * b3 * b3);
		var s = X + Y + Z;
		var Y0w = s === 0 ? 0 : Kfactor(X / s, Y / s) * Y;
		return [Y0w, X, Y, Z];
	};

	// Newton on w until K(x,y)·Y == Y0
	var w = 2, out = probe(w);
	for (var k = 0; k < 64; k++) {
		var err = out[0] - Y0;
		if (Math.abs(err) < 1e-10) break;
		var deriv = (probe(w + 1e-7)[0] - out[0]) / 1e-7;
		if (deriv === 0) break;
		w -= err / deriv;
		out = probe(w);
	}
	return [out[1], out[2], out[3]];
};

export default (osaucs);
