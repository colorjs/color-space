/**
 * OSA-UCS (Uniform Color Scale) is a color space developed by an Optical Society of
 * America committee and published in 1974, closely associated with David MacAdam's
 * work on the project. It set out to solve a problem CIELAB and CIELUV don't fully
 * address: making equal numerical distances correspond to equal perceived
 * differences not just for small steps, but across large jumps anywhere in the
 * space. Rather than a simple rectangular grid, its coordinates sit on a cubic
 * close-packed lattice, matching how the committee's extensive visual-scaling
 * experiments found colors to actually cluster perceptually. It has found its main
 * use in industrial and scientific color-difference work that values this
 * large-scale uniformity over the convenience of more common spaces.
 *
 * @see {@link https://doi.org/10.1364/JOSA.64.001691}
 * @wiki {@link https://en.wikipedia.org/wiki/OSA-UCS}
 * @year 1974
 * @by OSA committee (David MacAdam)
 * @use Large-step perceptual uniformity for industrial/scientific color-difference work; legacy, niche next to CIELAB/CIELUV.
 * @channel {L} -10 10 Lightness
 * @channel {j} -20 20 Yellow-Blue axis
 * @channel {g} -20 20 Red-Green axis
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

// OSA-UCS defines no fixed coordinate range — MacAdam's 1974 transform is unbounded, and the
// conventional [-10,10] held barely a third of sRGB in chroma (which reaches ~±19 in j/g), so
// those axes are widened to ±20 to contain it. L keeps the conventional [-10,10]: white
// (Y=100) lands at L ≈ 7.1, inside it, and the floor sits just above the transform's pole —
// the modified-luminance factor C = L'/(5.9·(∛Y₀−2/3)) diverges at Y₀=8/27, a constant
// L ≈ -10.7, below which chroma blows up and the coordinates sign-flip; that region (black
// itself maps to L ≈ -13.5) is not meaningful. Wider gamuts still exceed ±20 in chroma.
var osaucs = {
	name: 'osaucs',
	range: [[-10, 10], [-20, 20], [-20, 20]]
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
	// recover L' and the lightness root t = ∛Y0 from L' = 5.9(t - 2/3 + 0.042·∛(t³-30)).
	// φ(t) = t + 0.042·∛(t³-30) is strictly increasing but has a VERTICAL tangent at
	// t³ = 30 (Y0 = 30, i.e. L ≈ 0), where Newton stalls — so bisect instead.
	var L_ = L * Math.SQRT2 + 14.3993;
	var u = L_ / 5.9 + 2 / 3; // u = φ(t)
	var tLo = 0, tHi = Math.max(u + 1, 2), t;
	for (var i = 0; i < 80; i++) {
		t = (tLo + tHi) / 2;
		if (t + 0.042 * Math.cbrt(t * t * t - 30) < u) tLo = t; else tHi = t;
	}
	t = (tLo + tHi) / 2;
	var Y0 = t * t * t;
	var C = L_ / (5.9 * (t - 2 / 3));
	var a = g / C, b = j / C; // g = C·a, j = C·b

	// Y0 as a function of the free variable w = ∛R. The cube roots are AFFINE in w
	// ([r3,g3,b3] = A_AUG_INV·[a,b,w]), so Y0(w) is a low-degree curve with possibly
	// several roots — a free Newton can land on a non-physical one (Y in the thousands
	// where black was asked). Instead: seed w at the lightness root t (≈ ∛Y0, exact
	// for neutrals) and take the sign-change bracket NEAREST the seed, then bisect.
	var probe = function (w) {
		var [r3, g3, b3] = mat3(A_AUG_INV, a, b, w);
		var [X, Y, Z] = mat3(M_OSA_INV, r3 * r3 * r3, g3 * g3 * g3, b3 * b3 * b3);
		var s = X + Y + Z;
		var Y0w = s === 0 ? 0 : Kfactor(X / s, Y / s) * Y;
		return [Y0w, X, Y, Z];
	};
	var f = function (w) { return probe(w)[0] - Y0; };

	// scan a window around the seed; collect every sign-change interval
	var seed = t, N = 96, span = 12, lo = seed - span, step = 2 * span / N;
	var brackets = [], best = lo, bestF = Infinity, prevW = lo, prevF = f(lo);
	if (Math.abs(prevF) < bestF) { bestF = Math.abs(prevF); best = lo; }
	for (var k = 1; k <= N; k++) {
		var wk = lo + k * step, fk = f(wk);
		if (Math.abs(fk) < bestF) { bestF = Math.abs(fk); best = wk; }
		if (prevF <= 0 !== fk <= 0) brackets.push([prevW, wk]);
		prevW = wk; prevF = fk;
	}

	// bisect each bracket; a sign change can also be a POLE of f (X+Y+Z crossing 0
	// blows up K), so only accept genuine roots (|f| ~ 0). Prefer physical solutions
	// (XYZ non-negative), then the one nearest the seed.
	var w = best, bestScore = Infinity;
	for (var bi = 0; bi < brackets.length; bi++) {
		var bLo = brackets[bi][0], bHi = brackets[bi][1], fLo = f(bLo), wm = 0, fm = 0;
		for (var i2 = 0; i2 < 64; i2++) {
			wm = (bLo + bHi) / 2;
			fm = f(wm);
			if (fm === 0) break;
			if (fLo <= 0 === fm <= 0) { bLo = wm; fLo = fm; } else bHi = wm;
		}
		if (Math.abs(fm) > 1e-6 * Math.max(1, Math.abs(Y0))) continue; // pole, not a root
		var [, X, Yc, Zc] = probe(wm);
		var score = Math.abs(wm - seed) + (X < -1e-6 || Yc < -1e-6 || Zc < -1e-6 ? 1e3 : 0);
		if (score < bestScore) { bestScore = score; w = wm; }
	}

	var out = probe(w);
	return [out[1], out[2], out[3]];
};

export default (osaucs);
