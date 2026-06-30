/**
 * Coloroid color space (Nemcsics, MSZ 7300)
 *
 * Aesthetic color system: hue (A), saturation (T), luminosity (V = 10·√Y).
 *
 * Geometry (per Neumann & Nemcsics 2004/2005): V = 10·√Y; hue A is one of 48
 * grades found by chromaticity angle from white; T is the position along the
 * white→limit-color line (T=0 at white, T=100 at the spectral/purple limit).
 * The hue lookup uses each row's angle computed from its own (xλ,yλ) — the
 * stored angle column is inconsistent with it (a known table defect).
 *
 * EXPERIMENTAL: the ATV↔xyY transform now round-trips exactly and T has the
 * correct excitation-purity semantics, but (a) A is quantized to 48 discrete
 * grades, so rgb→coloroid→rgb loses the between-grade hue (no interpolation yet);
 * (b) the bundled xλ,yλ table (Illuminant-C spectral data) and the white point
 * (D65 here, per MSZ 7300) carry the documented C-vs-D65 split; (c) no reference
 * implementation exists to cross-validate A/T. Treat A/T as provisional.
 * Sources: Neumann & Neumann (2004) "Gamut Clipping and Mapping Based on the
 * Coloroid System"; Neumann, Nemcsics & Neumann (2005).
 *
 * @channel {A} 10 76 Hue grade
 * @channel {T} 0 100 Saturation
 * @channel {V} 0 100 Luminosity
 */
import xyy from './xyy.js';
import xyz from './xyz.js';

const whitepoint = xyz.whitepoint;

const coloroid = {
	name: 'coloroid',
	// min: [1, 0, 0],
	// max: [48, 100, 100],

	// Coloroid table
	// Regression of values is almost impossible, as hues don't correlate
	// Even angle values are picked very inconsistently, based on aesthetical evaluation.
	// - tgф, ctgф are removed, ф is searched instead
	// - eλ = xλ + yλ + zλ
	// - λ is removed as not used
	table: [
		//A    angle  eλ        xλ       yλ
		[10, 59.0, 1.724349, 0.44987, 0.53641],
		[11, 55.3, 1.740844, 0.46248, 0.52444],
		[12, 51.7, 1.754985, 0.47451, 0.51298],
		[13, 48.2, 1.767087, 0.48601, 0.50325],
		[14, 44.8, 1.775953, 0.49578, 0.49052],
		[15, 41.5, 1.785073, 0.50790, 0.43035],
		[16, 38.2, 1.791104, 0.51874, 0.46934],
		[20, 34.9, 1.794831, 0.52980, 0.45783],
		[21, 31.5, 1.798664, 0.54137, 0.44559],
		[22, 28.0, 1.794819, 0.55367, 0.43253],
		[23, 24.4, 1.789610, 0.56680, 0.41811],
		[24, 20.6, 1.809483, 0.58128, 0.40176],
		[25, 16.6, 1.760983, 0.59766, 0.38300],
		[26, 12.3, 1.723443, 0.61653, 0.36061],
		[30, 7.7, 1.652891, 0.63896, 0.33358],
		[31, 2.8, 1.502607, 0.66619, 0.29930],
		[32, -2.5, 1.072500, 0.70061, 0.26753],
		[33, -8.4, 1.136637, 0.63925, 0.22631],
		[34, -19.8, 1.232286, 0.53962, 0.19721],
		[35, -31.6, 1.310120, 0.50340, 0.17495],
		[40, -43.2, 1.376610, 0.46041, 0.15603],
		[41, -54.6, 1.438692, 0.42386, 0.13846],
		[42, -65.8, 1.501582, 0.38991, 0.12083],
		[43, -76.8, 1.570447, 0.35586, 0.10328],
		[44, -86.8, 1.645583, 0.32195, 0.08496],
		[45, -95.8, 1.732083, 0.28657, 0.05155],
		[46, -108.4, 1.915753, 0.22202, 0.01771],
		[50, -117.2, 2.146310, 0.15664, 0.05227],
		[51, -124.7, 1.649939, 0.12736, 0.09020],
		[52, -131.8, 1.273415, 0.10813, 0.12506],
		[53, -138.5, 1.080809, 0.09414, 0.15741],
		[54, -145.1, 0.957076, 0.03249, 0.18958],
		[55, -152.0, 0.868976, 0.07206, 0.24109],
		[56, -163.4, 0.771731, 0.05787, 0.30378],
		[60, -177.2, 0.697108, 0.04353, 0.35696],
		[61, 171.6, 0.655803, 0.03291, 0.41971],
		[62, 152.4, 0.623958, 0.02240, 0.49954],
		[63, 148.4, 0.596037, 0.01196, 0.60321],
		[64, 136.8, 0.607413, 0.00425, 0.73542],
		[65, 125.4, 0.659923, 0.01099, 0.83391],
		[66, 114.2, 0.859517, 0.08050, 0.77474],
		[70, 103.2, 1.195683, 0.20259, 0.70460],
		[71, 93.2, 1.407534, 0.28807, 0.65230],
		[72, 84.2, 1.532829, 0.34422, 0.61930],
		[73, 77.3, 1.603792, 0.37838, 0.59533],
		[74, 71.6, 1.649448, 0.40290, 0.57716],
		[75, 66.9, 1.681080, 0.42141, 0.56222],
		[76, 62.8, 1.704979, 0.43647, 0.54895]
	],

	/**
	 * Backwise - from coloroid to xyY
	 *
	 * @param {number} A
	 * @param {number} T
	 * @param {number} V
	 *
	 * @return {Array<number>} xyY values
	 */
	xyy: function (A, T, V) {
		// row for hue grade A (nearest grade)
		var row = this.table.reduce((best, r) => Math.abs(r[0] - A) < Math.abs(best[0] - A) ? r : best);
		var xl = row[3], yl = row[4];
		var Y = (V / 10) * (V / 10);
		// T/100 is the position along the white -> limit-color line in the xy plane
		var t = T / 100;
		return [x0 + t * (xl - x0), y0 + t * (yl - y0), Y];
	}
};


/**
Coloroid table source
Some negative angle typos are fixed.
Angle typo on the A=62 is fixed.
xλ typo on A=73 is fixed.


Beware, tg/ctg values don’t agree with angle.
Also don’t trust the calculated eλ = xλ + yλ + zλ.
Also, unfortunately, some values might be wrong, as coloroid range looks uneven.

A   λ       ф     tg ф    ctg ф   xλ       yλ       zλ       xλ      yλ      eλ

10  570.83   59.0          0.6009 0.775745 0.946572 0.002032 0.44987 0.54895 1.724349
11  572.64   55.3          0.6924 0.805130 0.933804 0.001910 0.46248 0.53641 1.740845
12  574.38   51.7          0.7898 0.832782 0.920395 0.001808 0.47451 0.52444 1.754986
13  576.06   48.2  1.1180  0.8941 0.858841 0.906482 0.001764 0.48601 0.51298 1.767088
14  577.50   44.8  0.9330  1.0070 0.880488 0.893741 0.001724 0.49578 0.50325 1.775953
15  579.31   41.5  0.8847         0.906652 0.876749 0.001672 0.50790 0.49052 1.785074
16  580.95   38.2  0.7869         0.929124 0.860368 0.001612 0.51874 0.43035 1.791104
20  582.65   34.9  0.6976         0.950909 0.842391 0.001531 0.52980 0.46934 1.794831
21  584.46   31.5  0.6128         0.972454 0.824779 0.001431 0.54137 0.45783 1.798665
22  586.43   28.0  0.5317         0.993753 0.799758 0.001308 0.55367 0.44559 1.794822
23  588.59   24.4  0.4536         1.014350 0.774090 0.001170 0.56680 0.43253 1.789610
24  591.06   20.6  0.3759         1.034402 0.774014 0.001067 0.58128 0.41811 1.779484
25  594.00   16.6  0.2974         1.052466 0.707496 0.001021 0.59766 0.40176 1.760984
26  597.74   12.3  0.2180         1.062544 0.660001 0.000898 0.61653 0.38300 1.723444
30  602.72    7.7  0.1352         1.056125 0.596070 0.000696 0.63896 0.36061 1.652892
31  610.14    2.8  0.0489         1.001027 0.501245 0.000335 0.66619 0.33358 1.502608
32  625.00   -2.5 -0.0435         0.751400 0.321000 0.000100 0.70061 0.29930 1.072500
33 -492.79   -8.4 -0.1477         0.726603 0.304093 0.105941 0.63925 0.26753 1.136638
34 -495.28  -19.8 -0.3600         0.689620 0.278886 0.263780 0.53962 0.22631 1.232286
35 -498.45  -31.6 -0.6152         0.659523 0.258373 0.392224 0.50340 0.19721 1.310122
40 -502.69  -43.2 -0.9391         0.633815 0.240851 0.501944 0.46041 0.17495 1.376610
41 -509.12  -54.6         -0.7107 0.609810 0.224490 0.604392 0.42386 0.15603 1.438692
42 -520.40  -65.8         -0.4494 0.585492 0.207915 0.708175 0.38991 0.13846 1.501583
43 -536.31  -76.8         -0.2345 0.558865 0.189767 0.821815 0.35586 0.12083 1.570447
44 -548.11  -86.8         -0.0559 0.529811 0.169965 0.945807 0.32195 0.10328 1.645584
45 -555.96  -95.8         -0.1016 0.496364 0.147168 1.088551 0.28657 0.08496 1.732085
46 -564.18 -108.4          0.3327 0.425346 0.098764 1.391643 0.22202 0.05155 1.915754
50  450.00 -117.2          0.5141 0.336200 0.038000 1.772110 0.15664 0.01771 2.146310
51  468.71 -124.7          0.6924 0.210174 0.086198 1.353567 0.12736 0.05227 1.649940
52  475.44 -131.8          0.8941 0.137734 0.114770 1.020911 0.10813 0.09020 1.273415
53  479.00 -138.5  0.8847         0.101787 0.135067 0.843955 0.09414 0.12506 1.080809
54  482.04 -145.1  0.6976         0.079004 0.150709 0.727363 0.03249 0.15741 0.957577
55  484.29 -152.0  0.5317         0.062658 0.164626 0.641692 0.07206 0.18958 0.868977
56  487.31 -163.4  0.2981         0.044691 0.185949 0.541091 0.05787 0.24109 0.771732
60  490.40 -177.2  0.0489         0.030372 0.211659 0.455077 0.04353 0.30378 0.697110
61  492.72  171.6 -0.1477         0.021655 0.234022 0.400126 0.03291 0.35696 0.655804
62  495.28  125.4 -0.3600         0.013989 0.261843 0.348126 0.02240 0.41971 0.623969
63  498.45  148.4 -0.6152         0.007215 0.301137 0.287685 0.01196 0.49954 0.596037
64  502.69  136.8 -0.9391 -1.0650 0.002586 0.366425 0.238402 0.00425 0.60321 0.607414
65  509.12  125.4 -1.4070 -0.7107 0.007260 0.485346 0.167317 0.01099 0.73542 0.659924
66  520.40  114.2         -0.4494 0.066010 0.717274 0.076233 0.08050 0.83391 0.859523
70  536.31  103.2         -0.2345 0.242272 0.926325 0.027086 0.20259 0.77474 1.195684
71  548.11   93.2         -0.0559 0.406663 0.990587 0.010284 0.28807 0.70460 1.410097
72  555.96   84.2          0.1016 0.527646 0.999862 0.005321 0.34422 0.65230 1.532830
73  560.74   77.3          0.2254 0.606873 0.993224 0.003695 0.37838 0.61930 1.603793
74  564.18   71.6          0.3327 0.664599 0.981981 0.002868 0.40290 0.59533 1.649449
75  566.78   66.9          0.4265 0.708358 0.970252 0.002470 0.42141 0.57716 1.681081
76  568.92   62.8          0.5140 0.744182 0.958592 0.002205 0.43647 0.56222 1.704981
*/


// Create angle-sorted table
var TABLE = coloroid.table.slice(-13).concat(coloroid.table.slice(0, -13));


// 2° D65 whitepoint is used (already in 0-100 scale)
var [Xn, Yn, Zn] = whitepoint[2].D65;

var x0 = Xn / (Xn + Yn + Zn); // D65 white chromaticity
var y0 = Yn / (Xn + Yn + Zn);

/**
 * From xyY to coloroid
 *
 * @param {Array<number>} arg xyY tuple
 *
 * @return {Array<number>} ATV coloroid channels
 */
xyy.coloroid = function (x, y, Y) {
	// Input: x/y chromaticity, Y luminance (0-100)
	// coloroid luminosity is the same as hunter-lab lightness
	// V = 10*sqrt(Y) where Y is in 0-100 range
	var V = 10 * Math.sqrt(Y);

	// hue angle of the color relative to white
	var angle = Math.atan2(y - y0, x - x0);

	// nearest hue row by angular distance, using each row's angle COMPUTED from its
	// own limit chromaticity (xλ,yλ) — the stored angle column is inconsistent with
	// it by up to ~14°, so deriving the angle keeps forward & inverse consistent.
	var angDist = (a, b) => { var d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
	var row = TABLE[0], best = Infinity;
	for (var i = 0; i < TABLE.length; i++) {
		var d = angDist(Math.atan2(TABLE[i][4] - y0, TABLE[i][3] - x0), angle);
		if (d < best) { best = d; row = TABLE[i]; }
	}

	var A = row[0], xl = row[3], yl = row[4];

	// T = position along the white -> limit-color line (0 at white, 100 at the limit),
	// as the projection of (x,y) onto that line (excitation-purity parameter).
	var dx = xl - x0, dy = yl - y0;
	var T = 100 * ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy);

	return [A, T, V];
};

/**
 * Proper transformation to a XYZ (via xyY)
 **/
xyz.coloroid = function (x, y, z) {
	return xyy.coloroid(...xyz.xyy(x, y, z));
};
coloroid.xyz = function (a, t, v) {
	return xyy.xyz(...coloroid.xyy(a, t, v));
};



export default coloroid;
