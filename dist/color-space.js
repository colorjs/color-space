!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.colorSpace=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @module color-space/cmy
 */
var rgb = require('./rgb');

var cmy = module.exports = {
	name: 'cmy',
	min: [0,0,0],
	max: [100,100,100],
	channel: ['cyan', 'magenta', 'yellow'],
	alias: ['CMY']
};


/**
 * CMY to RGB
 *
 * @param {Array} cmy Channels
 *
 * @return {Array} RGB channels
 */
cmy.rgb = function(cmy) {
	var c = cmy[0] / 100,
		m = cmy[1] / 100,
		y = cmy[2] / 100;

	return [
		(1 - c) * 255,
		(1 - m) * 255,
		(1 - y) * 255
	];
};


/**
 * RGB to CMY
 *
 * @param {Array} rgb channels
 *
 * @return {Array} CMY channels
 */
rgb.cmy = function(rgb) {
	var r = rgb[0] / 255,
		g = rgb[1] / 255,
		b = rgb[2] / 255;

	return [
		(1-r) * 100 || 0,
		(1-g) * 100 || 0,
		(1-b) * 100 || 0
	];
};
},{"./rgb":24}],2:[function(require,module,exports){
/**
 * @module color-space/cmyk
 */

var rgb = require('./rgb');

module.exports = {
	name: 'cmyk',
	min: [0,0,0,0],
	max: [100,100,100,100],
	channel: ['cyan', 'magenta', 'yellow', 'black'],
	alias: ['CMYK'],

	rgb: function(cmyk) {
		var c = cmyk[0] / 100,
				m = cmyk[1] / 100,
				y = cmyk[2] / 100,
				k = cmyk[3] / 100,
				r, g, b;

		r = 1 - Math.min(1, c * (1 - k) + k);
		g = 1 - Math.min(1, m * (1 - k) + k);
		b = 1 - Math.min(1, y * (1 - k) + k);
		return [r * 255, g * 255, b * 255];
	}
};


//extend rgb
rgb.cmyk = function(rgb) {
	var r = rgb[0] / 255,
			g = rgb[1] / 255,
			b = rgb[2] / 255,
			c, m, y, k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;
	return [c * 100, m * 100, y * 100, k * 100];
};
},{"./rgb":24}],3:[function(require,module,exports){

/**
 * Architects and visual constructors hungarian color space.
 *
 * http://hej.sze.hu/ARC/ARC-030520-A/arc030520a.pdf
 *
 * @module  color-space/coloroid
 */

var xyy = require('./xyy');
var xyz = require('./xyz');


/**
 * Main color space object
 */
var coloroid = {
	name: 'coloroid',
	alias: ['ATV'],

	//hue, saturation, luminosity
	//note that hue values are ids, not the numbers - not every value is possible
	//e.g. 38 will be rounded to 36
	channel: ['A','T','V'],
	min: [10, 0, 0],
	max: [76, 100, 100]
};


/**
 * Coloroid table
 * Regression of values is almost impossible, as hues don’t correlate
 * Even angle values are picked very inconsistently, based on aesthetical evaluation.
 *
 * - tgф, ctgф are removed, ф is searched instead
 * - eλ = xλ + yλ + zλ
 * - λ is removed as not used
 */
coloroid.table = [
	//A    angle  eλ        xλ       yλ
	[ 10,   59.0, 1.724349, 0.44987, 0.53641 ],
	[ 11,   55.3, 1.740844, 0.46248, 0.52444 ],
	[ 12,   51.7, 1.754985, 0.47451, 0.51298 ],
	[ 13,   48.2, 1.767087, 0.48601, 0.50325 ],
	[ 14,   44.8, 1.775953, 0.49578, 0.49052 ],
	[ 15,   41.5, 1.785073, 0.50790, 0.43035 ],
	[ 16,   38.2, 1.791104, 0.51874, 0.46934 ],
	[ 20,   34.9, 1.794831, 0.52980, 0.45783 ],
	[ 21,   31.5, 1.798664, 0.54137, 0.44559 ],
	[ 22,   28.0, 1.794819, 0.55367, 0.43253 ],
	[ 23,   24.4, 1.789610, 0.56680, 0.41811 ],
	[ 24,   20.6, 1.809483, 0.58128, 0.40176 ],
	[ 25,   16.6, 1.760983, 0.59766, 0.38300 ],
	[ 26,   12.3, 1.723443, 0.61653, 0.36061 ],
	[ 30,    7.7, 1.652891, 0.63896, 0.33358 ],
	[ 31,    2.8, 1.502607, 0.66619, 0.29930 ],
	[ 32,   -2.5, 1.072500, 0.70061, 0.26753 ],
	[ 33,   -8.4, 1.136637, 0.63925, 0.22631 ],
	[ 34,  -19.8, 1.232286, 0.53962, 0.19721 ],
	[ 35,  -31.6, 1.310120, 0.50340, 0.17495 ],
	[ 40,  -43.2, 1.376610, 0.46041, 0.15603 ],
	[ 41,  -54.6, 1.438692, 0.42386, 0.13846 ],
	[ 42,  -65.8, 1.501582, 0.38991, 0.12083 ],
	[ 43,  -76.8, 1.570447, 0.35586, 0.10328 ],
	[ 44,  -86.8, 1.645583, 0.32195, 0.08496 ],
	[ 45,  -95.8, 1.732083, 0.28657, 0.05155 ],
	[ 46, -108.4, 1.915753, 0.22202, 0.01771 ],
	[ 50, -117.2, 2.146310, 0.15664, 0.05227 ],
	[ 51, -124.7, 1.649939, 0.12736, 0.09020 ],
	[ 52, -131.8, 1.273415, 0.10813, 0.12506 ],
	[ 53, -138.5, 1.080809, 0.09414, 0.15741 ],
	[ 54, -145.1, 0.957076, 0.03249, 0.18958 ],
	[ 55, -152.0, 0.868976, 0.07206, 0.24109 ],
	[ 56, -163.4, 0.771731, 0.05787, 0.30378 ],
	[ 60, -177.2, 0.697108, 0.04353, 0.35696 ],
	[ 61,  171.6, 0.655803, 0.03291, 0.41971 ],
	[ 62,  152.4, 0.623958, 0.02240, 0.49954 ],
	[ 63,  148.4, 0.596037, 0.01196, 0.60321 ],
	[ 64,  136.8, 0.607413, 0.00425, 0.73542 ],
	[ 65,  125.4, 0.659923, 0.01099, 0.83391 ],
	[ 66,  114.2, 0.859517, 0.08050, 0.77474 ],
	[ 70,  103.2, 1.195683, 0.20259, 0.70460 ],
	[ 71,   93.2, 1.407534, 0.28807, 0.65230 ],
	[ 72,   84.2, 1.532829, 0.34422, 0.61930 ],
	[ 73,   77.3, 1.603792, 0.37838, 0.59533 ],
	[ 74,   71.6, 1.649448, 0.40290, 0.57716 ],
	[ 75,   66.9, 1.681080, 0.42141, 0.56222 ],
	[ 76,   62.8, 1.704979, 0.43647, 0.54895 ]
];


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




/** Create angle-sorted table */
var table = coloroid.table;
var angleTable = [].concat(table.slice(-13),table.slice(0, -13));


/**
 * Some precalculations
 * 2° D65 whitepoint is used
 */
var i = 'D65';
var o = 2;

var Xn = xyz.whitepoint[o][i][0];
var Yn = xyz.whitepoint[o][i][1];
var Zn = xyz.whitepoint[o][i][2];

var y0 = Xn / (Xn + Yn + Zn);
var x0 = Yn / (Xn + Yn + Zn);
var ew = (Xn + Yn + Zn) / 100;



/**
 * From xyY to coloroid
 *
 * @param {Array} arg xyY tuple
 *
 * @return {Array} ATV coloroid channels
 */
xyy.coloroid = function (arg) {
	var x = arg[0], y = arg[1], Y = arg[2];

	//coloroid luminocity is the same as hunter-lab lightness (the easier part)
	var V = 10 * Math.sqrt(Y);

	//get the hue angle, -π ... +π
	var angle = Math.atan2(y - y0, x - x0) * 180 / Math.PI;
	var row;

	//find the closest row in the table
	var prev = angleTable.length - 1;
	for (var i = 0; i < angleTable.length; i++) {
		if (angle > angleTable[i][1]) {
			break;
		}
		prev = i;
	}
	//round instead of ceil
	row = Math.abs(angleTable[i+1][1] - angle) > Math.abs(angleTable[prev][1] - angle) ? angleTable[i+1] : angleTable[prev];

	//get hue id
	var A = row[0];

	//calc saturation
	var yl = row[4], el = row[2], xl = row[3];

	//yl should be scaled to 0..100;
	var Yl = yl * el * 100;

	var T = 100 * Y*(x0*ew - x*ew) / (100*(x*el - xl*el) + Yl*(x0*ew - x*ew));
	// var T = 100 * Y*(1 - y*ew) / (100*(y*el - yl*el) + Yl*(1 - y*ew));

	return [A, T, V];
};





/**
 * Backwise - from coloroid to xyY
 *
 * @param {Array} arg Coloroid values
 *
 * @return {Array} xyY values
 */
coloroid.xyy = function (arg) {
	var A = arg[0], T = arg[1], V = arg[2];

	//find the closest row in the table
	var row;
	for (var i = 0; i < table.length; i++) {
		if (A <= table[i][0]) {
			row = table[i];
			break;
		}
	}

	var yl = row[4], el = row[2], xl = row[3];

	var Y = V*V / 100;

	var Yl = yl * el * 100;

	var x = (100*Y*x0*ew + 100*xl*el*T - Yl*T*x0*ew) / (100*T*el - Yl*T*ew + 100*Y*ew);
	var y = (100*Y + 100*T*yl*el - Yl*T) / (Y*ew*100 + T*100*el - T*Yl*ew);

	// var x = (100*Y*ew*x0 + 100*T*el*xl - T*Yl*ew*x0) / (100*T*el - T*Yl*ew + 100*Y*ew);
	// var y = 100*Y / (100*T*el + 100*T*ew*Yl + 100*ew*Y);

	// var x = (ew*x0*(V*V - 100*T*row[6]) + 100*T*el*xl) / (ew*(V*V - 100*T*row[6]) + 100*T*el);
	// var y = V*V/(ew*(V*V + 100*T*row[6]) + 100*T*el);

	return [x,y,Y];
};



/** Proper transformation to a XYZ (via xyY) */
xyz.coloroid = function (arg) {
	return xyy.coloroid(xyz.xyy(arg));
};
coloroid.xyz = function (arg) {
	return xyy.xyz(coloroid.xyy(arg));
};



module.exports = coloroid;





},{"./xyy":28,"./xyz":29}],4:[function(require,module,exports){
/**
 * Cubehelix http://astron-soc.in/bulletin/11June/289392011.pdf
 *
 * @module color-space/cubehelix
 */
var rgb = require('./rgb');
var clamp = require('mumath/between');


var cubehelix = module.exports = {
	name: 'cubehelix',
	channel: ['fraction'],
	min: [0],
	max: [1]
};


/** Default options for space */
var defaults = cubehelix.defaults = {
	//0..3
	start: 0,
	//-10..10
	rotation: 0.5,
	//0..1+
	hue: 1,
	//0..2
	gamma: 1
};


/**
 * Transform cubehelix level to RGB
 *
 * @param {Number} fraction 0..1 cubehelix level
 * @param {Object} options Mapping options, overrides defaults
 *
 * @return {Array} rgb tuple
 */
cubehelix.rgb = function(fraction, options) {
	options = options || {};

	if (fraction.length) fraction = fraction[0];

	var start = options.start !== undefined ? options.start : defaults.start;
	var rotation = options.rotation !== undefined ? options.rotation : defaults.rotation;
	var gamma = options.gamma !== undefined ? options.gamma : defaults.gamma;
	var hue = options.hue !== undefined ? options.hue : defaults.hue;

	var angle = 2 * Math.PI * (start/3 + 1.0 + rotation * fraction);

	fraction = Math.pow(fraction, gamma);

	var amp = hue * fraction * (1-fraction)/2.0;

	var r = fraction + amp*(-0.14861*Math.cos(angle)+1.78277*Math.sin(angle));
	var g = fraction + amp*(-0.29227*Math.cos(angle)-0.90649*Math.sin(angle));
	var b = fraction + amp*(+1.97294*Math.cos(angle));

	r = clamp(r, 0, 1);
	g = clamp(g, 0, 1);
	b = clamp(b, 0, 1);

	return [r * 255, g * 255, b * 255];
};


/**
 * RGB to cubehelix
 *
 * @param {Array} rgb RGB values
 *
 * @return {Array} cubehelix fraction(s)
 */
rgb.cubehelix = function(rgb) {
	//TODO - there is no backwise conversion yet
};
},{"./rgb":24,"mumath/between":21}],5:[function(require,module,exports){
/**
 * @module color-space/hsv
 */

var rgb = require('./rgb');
var hsl = require('./hsl');
var hsv = require('./hsv');

module.exports = {
	name: 'HCG',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'chroma', 'gray'],
	alias: ['HCG', 'HST'],

	rgb: function(hcg) {
		var h = hcg[0] / 360;
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;
		
		if(c == 0.0) return [g * 255, g * 255, g * 255];
		var hi = h.mod(1) * 6;
		var v = hi.mod(1);
		var pure = [0, 0, 0];
		var w = 1 - v;
		switch(Math.floor(hi)) {
			case 0 : pure[0] = 1; pure[1] = v; pure[2] = 0; break;
			case 1 : pure[0] = w; pure[1] = 1; pure[2] = 0; break;
			case 2 : pure[0] = 0; pure[1] = 1; pure[2] = v; break;
			case 3 : pure[0] = 0; pure[1] = w; pure[2] = 1; break;
			case 4 : pure[0] = v; pure[1] = 0; pure[2] = 1; break;
			default: pure[0] = 1; pure[1] = 0; pure[2] = w;
		}
		var mg = (1.0 - c) * g;
		var rgb = [
			(c * pure[0] + mg) * 255, 
			(c * pure[1] + mg) * 255, 
			(c * pure[2] + mg) * 255 
		];
		return rgb;
	},

	hsl: function(hcg) {
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;
		var l = g * (1.0 - c) + 0.5 * c;
		var s = 0;
		if(l < 1.0 && l > 0.0){
			if(l < 0.5){
				s = c / (2 * l);
			} else {
				s = c / (2 * (1 - l));
			}
		}
		return [hcg[0], s * 100, l * 100];
	}, 
	
	hsv: function(hcg){
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;
		var v = c + g * (1.0 - c);
		if(v > 0.0){
			var f = c / v;
			return [hcg[0], f * 100, v * 100];
		} else {
			return [hcg[0], 0, v * 100];
		}
	}
};


//append rgb
rgb.hcg = function(rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	
	var max = Math.max(r, g, b);
	var min = Math.min(r, g, b);
	var chroma = (max - min);
	var grayscale, hue;
	if(chroma < 1){
		grayscale = min / (1 - chroma);
	} else grayscale = 0;
	if(chroma > 0){
		hue = (
			(max == r ? ((g - b) / chroma).mod(6) : 
			(max == g ? ((b - r) / chroma) + 2 : 
						((r - g) / chroma) + 4)
			) / 6).mod(1);
	} else hue = 0;
	return [hue * 360, chroma * 100, grayscale * 100];
};

//extend hsl
hsl.hcg = function(hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 0;
	if(l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}
	if(c < 1.0){
		var f = (l - 0.5 * c) / (1.0 - c);
		return [hsl[0], c * 100, f * 100];
	} else {
		return [hsl[0], c * 100, 0];
	}
};

//extend hsv
hsv.hcg = function(hsv){
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var c = s * v;
	if(c < 1.0){
		var f = (v - c) / (1 - c);
		return [hsv[0], c * 100, f * 100];
	} else {
		return [hsv[0], c * 100, 0];
	}
}
},{"./hsl":7,"./hsv":8,"./rgb":24}],6:[function(require,module,exports){
/**
 * http://www.cse.usf.edu/~mshreve/rgb-to-hsi
 * http://web.archive.org/web/20130124054245/http://web2.clarkson.edu/class/image_process/RGB_to_HSI.pdf
 *
 * @module color-space/hsl
 */

var rgb = require('./rgb');

var loop = require('mumath/loop');
var clamp = require('mumath/between');


var hsi = module.exports = {
	name: 'hsi',
	min: [0,0,0],
	max: [360,100,255],
	channel: ['hue', 'saturation', 'intensity'],
	alias: ['HSI']
};


/**
 * HSI to RGB
 *
 * @param {Array} hsi Channel values
 *
 * @return {Array} RGB channel values
 */
hsi.rgb = function (hsi) {
	var h = loop(hsi[0], 0, 360) * Math.PI / 180;
	var s = clamp(hsi[1], 0, 100) / 100;
	var i = clamp(hsi[2], 0, 255) / 255;

	var pi3 = Math.PI / 3;

	var r, g, b;
	if (h < (2 * pi3) ) {
		b = i * ( 1 - s );
		r = i * (1 + ( s * Math.cos(h) / Math.cos(pi3 - h) ));
		g = i * (1 + ( s * ( 1 - Math.cos(h) / Math.cos(pi3 - h) )));
	}
	else if (h < (4 * pi3) ) {
		h = h - 2 * pi3;
		r = i * ( 1 - s );
		g = i * (1 + ( s * Math.cos(h) / Math.cos(pi3 - h) ));
		b = i * (1 + ( s * ( 1 - Math.cos(h) / Math.cos(pi3 - h) )));
	}
	else {
		h = h - 4 * pi3;
		g = i * ( 1 - s );
		b = i * (1 + ( s * Math.cos(h) / Math.cos(pi3 - h) ));
		r = i * (1 + ( s * ( 1 - Math.cos(h) / Math.cos(pi3 - h) )));
	}

	return [r * 255, g * 255, b * 255];
};


/**
 * RGB to HSI
 *
 * @param {Array} rgb Channel values
 *
 * @return {Array} HSI channel values
 */
rgb.hsi = function (rgb) {
	var sum = rgb[0] + rgb[1] + rgb[2];

	var r = rgb[0] / sum;
	var g = rgb[1] / sum;
	var b = rgb[2] / sum;

	var h = Math.acos(
		( 0.5 * ((r - g) + (r - b)) ) /
		Math.sqrt( (r - g)*(r - g) + (r - b)*(g - b) )
	);
	if (b > g) {
		h = 2 * Math.PI - h;
	}

	var s = 1 - 3 * Math.min(r, g, b);

	var i = sum / 3;

	return [h * 180 / Math.PI, s * 100, i];
};
},{"./rgb":24,"mumath/between":21,"mumath/loop":22}],7:[function(require,module,exports){
/**
 * @module color-space/hsl
 */

var rgb = require('./rgb');

module.exports = {
	name: 'hsl',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'lightness'],
	alias: ['HSL'],

	rgb: function(hsl) {
		var h = hsl[0] / 360,
				s = hsl[1] / 100,
				l = hsl[2] / 100,
				t1, t2, t3, rgb, val;

		if (s === 0) {
			val = l * 255;
			return [val, val, val];
		}

		if (l < 0.5) {
			t2 = l * (1 + s);
		}
		else {
			t2 = l + s - l * s;
		}
		t1 = 2 * l - t2;

		rgb = [0, 0, 0];
		for (var i = 0; i < 3; i++) {
			t3 = h + 1 / 3 * - (i - 1);
			if (t3 < 0) {
				t3++;
			}
			else if (t3 > 1) {
				t3--;
			}

			if (6 * t3 < 1) {
				val = t1 + (t2 - t1) * 6 * t3;
			}
			else if (2 * t3 < 1) {
				val = t2;
			}
			else if (3 * t3 < 2) {
				val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
			}
			else {
				val = t1;
			}

			rgb[i] = val * 255;
		}

		return rgb;
	}
};


//extend rgb
rgb.hsl = function(rgb) {
	var r = rgb[0]/255,
			g = rgb[1]/255,
			b = rgb[2]/255,
			min = Math.min(r, g, b),
			max = Math.max(r, g, b),
			delta = max - min,
			h, s, l;

	if (max === min) {
		h = 0;
	}
	else if (r === max) {
		h = (g - b) / delta;
	}
	else if (g === max) {
		h = 2 + (b - r) / delta;
	}
	else if (b === max) {
		h = 4 + (r - g)/ delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	}
	else if (l <= 0.5) {
		s = delta / (max + min);
	}
	else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};
},{"./rgb":24}],8:[function(require,module,exports){
/**
 * @module color-space/hsv
 */

var rgb = require('./rgb');
var hsl = require('./hsl');

module.exports = {
	name: 'hsv',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'value'],
	alias: ['HSV', 'HSB'],

	rgb: function(hsv) {
		var h = hsv[0] / 60,
			s = hsv[1] / 100,
			v = hsv[2] / 100,
			hi = Math.floor(h) % 6;

		var f = h - Math.floor(h),
			p = 255 * v * (1 - s),
			q = 255 * v * (1 - (s * f)),
			t = 255 * v * (1 - (s * (1 - f)));
		v *= 255;

		switch(hi) {
			case 0:
				return [v, t, p];
			case 1:
				return [q, v, p];
			case 2:
				return [p, v, t];
			case 3:
				return [p, q, v];
			case 4:
				return [t, p, v];
			case 5:
				return [v, p, q];
		}
	},

	hsl: function(hsv) {
		var h = hsv[0],
			s = hsv[1] / 100,
			v = hsv[2] / 100,
			sl, l;

		l = (2 - s) * v;
		sl = s * v;
		sl /= (l <= 1) ? l : 2 - l;
		sl = sl || 0;
		l /= 2;

		return [h, sl * 100, l * 100];
	}
};


//append rgb
rgb.hsv = function(rgb) {
	var r = rgb[0],
		g = rgb[1],
		b = rgb[2],
		min = Math.min(r, g, b),
		max = Math.max(r, g, b),
		delta = max - min,
		h, s, v;

	if (max === 0) {
		s = 0;
	}
	else {
		s = (delta/max * 100);
	}

	if (max === min) {
		h = 0;
	}
	else if (r === max) {
		h = (g - b) / delta;
	}
	else if (g === max) {
		h = 2 + (b - r) / delta;
	}
	else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	v = ((max / 255) * 1000) / 10;

	return [h, s, v];
};



//extend hsl
hsl.hsv = function(hsl) {
	var h = hsl[0],
			s = hsl[1] / 100,
			l = hsl[2] / 100,
			sv, v;
	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	v = (l + s) / 2;
	sv = (2 * s) / (l + s) || 0;

	return [h, sv * 100, v * 100];
};
},{"./hsl":7,"./rgb":24}],9:[function(require,module,exports){
/**
 * A uniform wrapper for husl.
 * // http://www.boronine.com/husl/
 *
 * @module color-space/husl
 */

var xyz = require('./xyz');
var lchuv = require('./lchuv');
var _husl = require('husl');


module.exports = {
	name: 'husl',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'lightness'],
	alias: ['HuSL'],

	lchuv: _husl._conv.husl.lch,

	xyz: function(arg){
		return lchuv.xyz(_husl._conv.husl.lch(arg));
	},

	//a shorter way to convert to huslp
	huslp: function(arg){
		return _husl._conv.lch.huslp( _husl._conv.husl.lch(arg));
	}
};

//extend lchuv, xyz
lchuv.husl = _husl._conv.lch.husl;
xyz.husl = function(arg){
	return _husl._conv.lch.husl(xyz.lchuv(arg));
};
},{"./lchuv":17,"./xyz":29,"husl":20}],10:[function(require,module,exports){
/**
 * A uniform wrapper for huslp.
 * // http://www.boronine.com/husl/
 *
 * @module color-space/huslp
 */

var xyz = require('./xyz');
var lchuv = require('./lchuv');
var _husl = require('husl');

module.exports = {
	name: 'huslp',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'lightness'],
	alias: ['HuSLp'],

	lchuv: _husl._conv.huslp.lch,
	xyz: function(arg){return lchuv.xyz(_husl._conv.huslp.lch(arg));},

	//a shorter way to convert to husl
	husl: function(arg){
		return _husl._conv.lch.husl( _husl._conv.huslp.lch(arg));
	}
};

//extend lchuv, xyz
lchuv.huslp = _husl._conv.lch.huslp;
xyz.huslp = function(arg){return _husl._conv.lch.huslp(xyz.lchuv(arg));};
},{"./lchuv":17,"./xyz":29,"husl":20}],11:[function(require,module,exports){
/**
 * @module color-space/hwb
 */

var rgb = require('./rgb');
var hsv = require('./hsv');
var hsl = require('./hsl');


var hwb = module.exports = {
	name: 'hwb',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'whiteness', 'blackness'],
	alias: ['HWB'],

	// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
	rgb: function(hwb) {
		var h = hwb[0] / 360,
			wh = hwb[1] / 100,
			bl = hwb[2] / 100,
			ratio = wh + bl,
			i, v, f, n;

		var r, g, b;

		// wh + bl cant be > 1
		if (ratio > 1) {
			wh /= ratio;
			bl /= ratio;
		}

		i = Math.floor(6 * h);
		v = 1 - bl;
		f = 6 * h - i;

		//if it is even
		if ((i & 0x01) !== 0) {
			f = 1 - f;
		}

		n = wh + f * (v - wh);  // linear interpolation

		switch (i) {
			default:
			case 6:
			case 0: r = v; g = n; b = wh; break;
			case 1: r = n; g = v; b = wh; break;
			case 2: r = wh; g = v; b = n; break;
			case 3: r = wh; g = n; b = v; break;
			case 4: r = n; g = wh; b = v; break;
			case 5: r = v; g = wh; b = n; break;
		}

		return [r * 255, g * 255, b * 255];
	},


	// http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
	hsv: function(arg){
		var h = arg[0], w = arg[1], b = arg[2], s, v;

		//if w+b > 100% - take proportion (how many times )
		if (w + b >= 100){
			s = 0;
			v = 100 * w/(w+b);
		}

		//by default - take wiki formula
		else {
			s = 100-(w/(1-b/100));
			v = 100-b;
		}


		return [h, s, v];
	},

	hsl: function(arg){
		return hsv.hsl(hwb.hsv(arg));
	}
};


//extend rgb
rgb.hwb = function(val) {
	var r = val[0],
			g = val[1],
			b = val[2],
			h = rgb.hsl(val)[0],
			w = 1/255 * Math.min(r, Math.min(g, b));

			b = 1 - 1/255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};



//keep proper hue on 0 values (conversion to rgb loses hue on zero-lightness)
hsv.hwb = function(arg){
	var h = arg[0], s = arg[1], v = arg[2];
	return [h, v === 0 ? 0 : (v * (1-s/100)), 100 - v];
};


//extend hsl with proper conversions
hsl.hwb = function(arg){
	return hsv.hwb(hsl.hsv(arg));
};
},{"./hsl":7,"./hsv":8,"./rgb":24}],12:[function(require,module,exports){
/**
 * Color space data and conversions
 *
 * @module color-space
 *
 */


/** Exported spaces */
var spaces = {
	rgb: require('./rgb'),
	hsl: require('./hsl'),
	hsv: require('./hsv'),
	hsi: require('./hsi'),
	hwb: require('./hwb'),
	cmyk: require('./cmyk'),
	cmy: require('./cmy'),
	xyz: require('./xyz'),
	xyy: require('./xyy'),
	yiq: require('./yiq'),
	yuv: require('./yuv'),
	ydbdr: require('./ydbdr'),
	ycgco: require('./ycgco'),
	ypbpr: require('./ypbpr'),
	ycbcr: require('./ycbcr'),
	xvycc: require('./xvycc'),
	yccbccrc: require('./yccbccrc'),
	ucs: require('./ucs'),
	uvw: require('./uvw'),
	jpeg: require('./jpeg'),
	lab: require('./lab'),
	labh: require('./labh'),
	lms: require('./lms'),
	lchab: require('./lchab'),
	luv: require('./luv'),
	lchuv: require('./lchuv'),
	husl: require('./husl'),
	huslp: require('./huslp'),
	cubehelix: require('./cubehelix'),
	coloroid: require('./coloroid'),
	hcg: require('./hcg')
};



//build absent convertors from each to every space
var fromSpace, toSpace;
for (var fromSpaceName in spaces) {
	fromSpace = spaces[fromSpaceName];
	for (var toSpaceName in spaces) {
		toSpace = spaces[toSpaceName];
		if (!fromSpace[toSpaceName]) fromSpace[toSpaceName] = getConvertor(fromSpaceName, toSpaceName);
	}
}


/** return converter through xyz/rgb space */
function getConvertor(fromSpaceName, toSpaceName){
	var fromSpace = spaces[fromSpaceName];
	var toSpace = spaces[toSpaceName];

	//create straight converter
	if (fromSpaceName === toSpaceName) {
		return function (a) {
			return a;
		};
	}

	//create xyz converter, if available
	else if (fromSpace.xyz && spaces.xyz[toSpaceName]) {
		return function(arg){
			return spaces.xyz[toSpaceName](fromSpace.xyz(arg));
		};
	}
	//create rgb converter
	else if (fromSpace.rgb && spaces.rgb[toSpaceName]) {
		return function(arg){
			return spaces.rgb[toSpaceName](fromSpace.rgb(arg));
		};
	}
}


module.exports = spaces;
},{"./cmy":1,"./cmyk":2,"./coloroid":3,"./cubehelix":4,"./hcg":5,"./hsi":6,"./hsl":7,"./hsv":8,"./husl":9,"./huslp":10,"./hwb":11,"./jpeg":13,"./lab":14,"./labh":15,"./lchab":16,"./lchuv":17,"./lms":18,"./luv":19,"./rgb":24,"./ucs":25,"./uvw":26,"./xvycc":27,"./xyy":28,"./xyz":29,"./ycbcr":30,"./yccbccrc":31,"./ycgco":32,"./ydbdr":33,"./yiq":34,"./ypbpr":35,"./yuv":36}],13:[function(require,module,exports){
/**
 * https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
 *
 * JPEG conversion without head/footroom
 *
 * @module  color-space/jpeg
 */

var rgb = require('./rgb');

var jpeg = module.exports = {
	name: 'jpeg',
	min: [0, 0, 0],
	max: [255, 255, 255],
	channel: ['Y','Cb','Cr'],
	alias: ['JPEG']
};


/**
 * JPEG to RGB
 * transform through analog form
 *
 * @param {Array} jpeg RGB values
 *
 * @return {Array} JPEG values
 */
jpeg.rgb = function (arr) {
	var y = arr[0], cb = arr[1], cr = arr[2];

	return [
		y + 1.402 * (cr - 128),
		y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128),
		y + 1.772 * (cb - 128)
	]
};


/**
 * RGB to JPEG
 * transform through analog form
 *
 * @param {Array} jpeg JPEG values
 *
 * @return {Array} RGB values
 */
rgb.jpeg = function(arr) {
	var r = arr[0], g = arr[1], b = arr[2];

	return [
		0.299 * r + 0.587 * g + 0.114 * b,
		128 - 0.168736 * r  - 0.331264 * g + 0.5 * b,
		128 + 0.5 * r - 0.418688 * g - 0.081312 * b
	]
};
},{"./rgb":24}],14:[function(require,module,exports){
/**
 * CIE LAB space model
 *
 * @module color-space/lab
 */

var xyz = require('./xyz');

module.exports = {
	name: 'lab',
	min: [0,-100,-100],
	max: [100,100,100],
	channel: ['lightness', 'a', 'b'],
	alias: ['LAB', 'cielab'],

	xyz: function(lab) {
		var l = lab[0],
				a = lab[1],
				b = lab[2],
				x, y, z, y2;

		if (l <= 8) {
			y = (l * 100) / 903.3;
			y2 = (7.787 * (y / 100)) + (16 / 116);
		} else {
			y = 100 * Math.pow((l + 16) / 116, 3);
			y2 = Math.pow(y / 100, 1/3);
		}

		x = x / 95.047 <= 0.008856 ? x = (95.047 * ((a / 500) + y2 - (16 / 116))) / 7.787 : 95.047 * Math.pow((a / 500) + y2, 3);

		z = z / 108.883 <= 0.008859 ? z = (108.883 * (y2 - (b / 200) - (16 / 116))) / 7.787 : 108.883 * Math.pow(y2 - (b / 200), 3);

		return [x, y, z];
	}
};


//extend xyz
xyz.lab = function(xyz){
	var x = xyz[0],
			y = xyz[1],
			z = xyz[2],
			l, a, b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};
},{"./xyz":29}],15:[function(require,module,exports){
/**
 * Hunter-lab space.
 *
 * @module  color-space/labh
 */

var xyz = require('./xyz');

module.exports = {
	name: 'labh',

	//mins/maxes are taken from colormine
	//FIXME: check whether mins/maxes correct
	min: [0,-128,-128],
	max: [100,128,128],
	channel: ['lightness', 'a', 'b'],
	alias: ['LABh', 'hunter-lab', 'hlab'],

	//maths are taken from EasyRGB
	xyz: function(lab) {
		var l = lab[0], a = lab[1], b = lab[2];

		var _y = l / 10;
		var _x = a / 17.5 * l / 10;
		var _z = b / 7 * l / 10;

		var y = _y * _y;
		var x = ( _x + y ) / 1.02;
		var z = -( _z - y ) / 0.847;

		return [x,y,z];
	}
};

//extend xyz
xyz.labh = function(xyz){
	var x = xyz[0], y = xyz[1], z = xyz[2];
	var l = 10 * Math.sqrt( y );
	var a = y === 0 ? 0 : 17.5 * ((( 1.02 * x ) - y ) / Math.sqrt( y ) );
	var b = y === 0 ? 0 : 7 * ( ( y - ( 0.847 * z ) ) / Math.sqrt( y ) );

	return [l, a, b];
};
},{"./xyz":29}],16:[function(require,module,exports){
/**
 * Cylindrical LAB
 *
 * @module color-space/lchab
 */

var xyz = require('./xyz');
var lab = require('./lab');


//cylindrical lab
var lchab = module.exports = {
	name: 'lchab',
	min: [0,0,0],
	max: [100,100,360],
	channel: ['lightness', 'chroma', 'hue'],
	alias: ['LCHab', 'cielch', 'LCH', 'HLC', 'LSH'],

	xyz: function(arg) {
		return lab.xyz(lchab.lab(arg));
	},

	lab: function(lch) {
		var l = lch[0],
				c = lch[1],
				h = lch[2],
				a, b, hr;

		hr = h / 360 * 2 * Math.PI;
		a = c * Math.cos(hr);
		b = c * Math.sin(hr);
		return [l, a, b];
	}
};


//extend lab
lab.lchab = function(lab) {
	var l = lab[0],
			a = lab[1],
			b = lab[2],
			hr, h, c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;
	if (h < 0) {
		h += 360;
	}
	c = Math.sqrt(a * a + b * b);
	return [l, c, h];
};

xyz.lchab = function(arg){
	return lab.lchab(xyz.lab(arg));
};
},{"./lab":14,"./xyz":29}],17:[function(require,module,exports){
/**
 * Cylindrical CIE LUV
 *
 * @module color-space/lchuv
 */

var luv = require('./luv');
var xyz = require('./xyz');

//cylindrical luv
var lchuv = module.exports = {
	name: 'lchuv',
	channel: ['lightness', 'chroma', 'hue'],
	alias: ['LCHuv', 'cielchuv'],
	min: [0,0,0],
	max: [100,100,360],

	luv: function(luv){
		var l = luv[0],
		c = luv[1],
		h = luv[2],
		u, v, hr;

		hr = h / 360 * 2 * Math.PI;
		u = c * Math.cos(hr);
		v = c * Math.sin(hr);
		return [l, u, v];
	},

	xyz: function(arg) {
		return luv.xyz(lchuv.luv(arg));
	}
};

luv.lchuv = function(luv){
	var l = luv[0], u = luv[1], v = luv[2];

	var c = Math.sqrt(u*u + v*v);
	var hr = Math.atan2(v,u);
	var h = hr * 360 / 2 / Math.PI;
	if (h < 0) {
		h += 360;
	}

	return [l,c,h]
};

xyz.lchuv = function(arg){
  return luv.lchuv(xyz.luv(arg));
};
},{"./luv":19,"./xyz":29}],18:[function(require,module,exports){
/**
 * A responsivity of cones color space.
 * Used for CAT - chromatic adaptation transform.
 *
 * http://en.wikipedia.org/wiki/LMS_color_space
 * http://www.mathworks.com/matlabcentral/fileexchange/28790-colorspace-transformations
 *
 * @todo xyz -> lms
 * @todo  tests
 *
 * @module color-space/lms
 */

var xyz = require('./xyz');

var lms = module.exports = {
	name: 'lms',
	min: [0,0,0],
	max: [100,100,100],
	channel: ['long', 'medium', 'short'],

	/*
	//transform matrices
	matrix: {
		HPE: [
			0.38971, 0.68898,-0.07868,
		   -0.22981, 1.18340, 0.04641,
			0.00000, 0.00000, 1.00000],
		VONKRIES: [
			0.4002, 0.7076, -0.0808,
		   -0.2263, 1.1653,  0.0457,
			0.00000,0.00000, 0.9182],
		BFD: [
			0.8951, 0.2664,-0.1614,
		   -0.7502, 1.7135,	0.0367,
			0.0389,-0.0686, 1.0296],
		CAT97: [
			0.8562, 0.3372,-0.1934,
		   -0.8360, 1.8327, 0.0033,
			0.0357,-0.00469,1.0112],
		CAT00: [
			0.7982, 0.3389,-0.1371,
		   -0.5918, 1.5512, 0.0406,
			0.0008, 0.0239, 0.9753],
		CAT02: [
			0.7328, 0.4296,-0.1624,
		   -0.7036, 1.6975, 0.0061,
			0.0030, 0.0136, 0.9834]
	},
	*/

	xyz: function(arg, matrix){
		var l = arg[0], m = arg[1], s = arg[2];

		if (!matrix) {
			matrix = [
				1.096123820835514, -0.278869000218287, +0.182745179382773,
				0.454369041975359, + 0.473533154307412, +0.072097803717229,
				-0.009627608738429, -0.005698031216113, +1.015325639954543
			];
		}

		return [
			l * matrix[0] + m * matrix[1] + s * matrix[2],
			l * matrix[3] + m * matrix[4] + s * matrix[5],
			l * matrix[6] + m * matrix[7] + s * matrix[8]
		];
	}
};

xyz.lms = function(arg, matrix) {
		var x = arg[0], y = arg[1], z = arg[2];

		if (!matrix) {
			matrix = [
				0.7328, 0.4296,-0.1624,
				-0.7036, 1.6975, 0.0061,
				0.0030, 0.0136, 0.9834
			];
		}

		return [
			x * matrix[0] + y * matrix[1] + z * matrix[2],
			x * matrix[3] + y * matrix[4] + z * matrix[5],
			x * matrix[6] + y * matrix[7] + z * matrix[8]
		];
};
},{"./xyz":29}],19:[function(require,module,exports){
/**
 * CIE LUV (C'est la vie)
 *
 * @module color-space/luv
 */

var xyz = require('./xyz');

module.exports = {
	name: 'luv',
	//NOTE: luv has no rigidly defined limits
	//easyrgb fails to get proper coords
	//boronine states no rigid limits
	//colorMine refers this ones:
	min: [0,-134,-140],
	max: [100,224,122],
	channel: ['lightness', 'u', 'v'],
	alias: ['LUV', 'cieluv', 'cie1976'],

	xyz: function(arg, i, o){
		var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;
		l = arg[0], u = arg[1], v = arg[2];

		if (l === 0) return [0,0,0];

		//get constants
		var e = 0.008856451679035631; //(6/29)^3
		var k = 0.0011070564598794539; //(3/29)^3

		//get illuminant/observer
		i = i || 'D65';
		o = o || 2;

		xn = xyz.whitepoint[o][i][0];
		yn = xyz.whitepoint[o][i][1];
		zn = xyz.whitepoint[o][i][2];

		un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
		vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));
		// un = 0.19783000664283;
		// vn = 0.46831999493879;


		_u = u / (13 * l) + un || 0;
		_v = v / (13 * l) + vn || 0;

		y = l > 8 ? yn * Math.pow( (l + 16) / 116 , 3) : yn * l * k;

		//wikipedia method
		x = y * 9 * _u / (4 * _v) || 0;
		z = y * (12 - 3 * _u - 20 * _v) / (4 * _v) || 0;

		//boronine method
		//https://github.com/boronine/husl/blob/master/husl.coffee#L201
		// x = 0 - (9 * y * _u) / ((_u - 4) * _v - _u * _v);
		// z = (9 * y - (15 * _v * y) - (_v * x)) / (3 * _v);

		return [x, y, z];
	}
};

// http://www.brucelindbloom.com/index.html?Equations.html
// https://github.com/boronine/husl/blob/master/husl.coffee
//i - illuminant
//o - observer
xyz.luv = function(arg, i, o) {
	var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;

	//get constants
	var e = 0.008856451679035631; //(6/29)^3
	var k = 903.2962962962961; //(29/3)^3

	//get illuminant/observer coords
	i = i || 'D65';
	o = o || 2;

	xn = xyz.whitepoint[o][i][0];
	yn = xyz.whitepoint[o][i][1];
	zn = xyz.whitepoint[o][i][2];

	un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
	vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));


	x = arg[0], y = arg[1], z = arg[2];


	_u = (4 * x) / (x + (15 * y) + (3 * z)) || 0;
	_v = (9 * y) / (x + (15 * y) + (3 * z)) || 0;

	var yr = y/yn;

	l = yr <= e ? k * yr : 116 * Math.pow(yr, 1/3) - 16;

	u = 13 * l * (_u - un);
	v = 13 * l * (_v - vn);

	return [l, u, v];
};
},{"./xyz":29}],20:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var L_to_Y, Y_to_L, conv, distanceFromPole, dotProduct, epsilon, fromLinear, getBounds, intersectLineLine, kappa, lengthOfRayUntilIntersect, m, m_inv, maxChromaForLH, maxSafeChromaForL, refU, refV, root, toLinear;

  m = {
    R: [3.2409699419045214, -1.5373831775700935, -0.49861076029300328],
    G: [-0.96924363628087983, 1.8759675015077207, 0.041555057407175613],
    B: [0.055630079696993609, -0.20397695888897657, 1.0569715142428786]
  };

  m_inv = {
    X: [0.41239079926595948, 0.35758433938387796, 0.18048078840183429],
    Y: [0.21263900587151036, 0.71516867876775593, 0.072192315360733715],
    Z: [0.019330818715591851, 0.11919477979462599, 0.95053215224966058]
  };

  refU = 0.19783000664283681;

  refV = 0.468319994938791;

  kappa = 903.2962962962963;

  epsilon = 0.0088564516790356308;

  getBounds = function(L) {
    var bottom, channel, j, k, len1, len2, m1, m2, m3, ref, ref1, ref2, ret, sub1, sub2, t, top1, top2;
    sub1 = Math.pow(L + 16, 3) / 1560896;
    sub2 = sub1 > epsilon ? sub1 : L / kappa;
    ret = [];
    ref = ['R', 'G', 'B'];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      channel = ref[j];
      ref1 = m[channel], m1 = ref1[0], m2 = ref1[1], m3 = ref1[2];
      ref2 = [0, 1];
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        t = ref2[k];
        top1 = (284517 * m1 - 94839 * m3) * sub2;
        top2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * L * sub2 - 769860 * t * L;
        bottom = (632260 * m3 - 126452 * m2) * sub2 + 126452 * t;
        ret.push([top1 / bottom, top2 / bottom]);
      }
    }
    return ret;
  };

  intersectLineLine = function(line1, line2) {
    return (line1[1] - line2[1]) / (line2[0] - line1[0]);
  };

  distanceFromPole = function(point) {
    return Math.sqrt(Math.pow(point[0], 2) + Math.pow(point[1], 2));
  };

  lengthOfRayUntilIntersect = function(theta, line) {
    var b1, len, m1;
    m1 = line[0], b1 = line[1];
    len = b1 / (Math.sin(theta) - m1 * Math.cos(theta));
    if (len < 0) {
      return null;
    }
    return len;
  };

  maxSafeChromaForL = function(L) {
    var b1, j, len1, lengths, m1, ref, ref1, x;
    lengths = [];
    ref = getBounds(L);
    for (j = 0, len1 = ref.length; j < len1; j++) {
      ref1 = ref[j], m1 = ref1[0], b1 = ref1[1];
      x = intersectLineLine([m1, b1], [-1 / m1, 0]);
      lengths.push(distanceFromPole([x, b1 + x * m1]));
    }
    return Math.min.apply(Math, lengths);
  };

  maxChromaForLH = function(L, H) {
    var hrad, j, l, len1, lengths, line, ref;
    hrad = H / 360 * Math.PI * 2;
    lengths = [];
    ref = getBounds(L);
    for (j = 0, len1 = ref.length; j < len1; j++) {
      line = ref[j];
      l = lengthOfRayUntilIntersect(hrad, line);
      if (l !== null) {
        lengths.push(l);
      }
    }
    return Math.min.apply(Math, lengths);
  };

  dotProduct = function(a, b) {
    var i, j, ref, ret;
    ret = 0;
    for (i = j = 0, ref = a.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      ret += a[i] * b[i];
    }
    return ret;
  };

  fromLinear = function(c) {
    if (c <= 0.0031308) {
      return 12.92 * c;
    } else {
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }
  };

  toLinear = function(c) {
    var a;
    a = 0.055;
    if (c > 0.04045) {
      return Math.pow((c + a) / (1 + a), 2.4);
    } else {
      return c / 12.92;
    }
  };

  conv = {
    'xyz': {},
    'luv': {},
    'lch': {},
    'husl': {},
    'huslp': {},
    'rgb': {},
    'hex': {}
  };

  conv.xyz.rgb = function(tuple) {
    var B, G, R;
    R = fromLinear(dotProduct(m.R, tuple));
    G = fromLinear(dotProduct(m.G, tuple));
    B = fromLinear(dotProduct(m.B, tuple));
    return [R, G, B];
  };

  conv.rgb.xyz = function(tuple) {
    var B, G, R, X, Y, Z, rgbl;
    R = tuple[0], G = tuple[1], B = tuple[2];
    rgbl = [toLinear(R), toLinear(G), toLinear(B)];
    X = dotProduct(m_inv.X, rgbl);
    Y = dotProduct(m_inv.Y, rgbl);
    Z = dotProduct(m_inv.Z, rgbl);
    return [X, Y, Z];
  };

  Y_to_L = function(Y) {
    if (Y <= epsilon) {
      return Y * kappa;
    } else {
      return 116 * Math.pow(Y, 1 / 3) - 16;
    }
  };

  L_to_Y = function(L) {
    if (L <= 8) {
      return L / kappa;
    } else {
      return Math.pow((L + 16) / 116, 3);
    }
  };

  conv.xyz.luv = function(tuple) {
    var L, U, V, X, Y, Z, varU, varV;
    X = tuple[0], Y = tuple[1], Z = tuple[2];
    if (Y === 0) {
      return [0, 0, 0];
    }
    L = Y_to_L(Y);
    varU = (4 * X) / (X + (15 * Y) + (3 * Z));
    varV = (9 * Y) / (X + (15 * Y) + (3 * Z));
    U = 13 * L * (varU - refU);
    V = 13 * L * (varV - refV);
    return [L, U, V];
  };

  conv.luv.xyz = function(tuple) {
    var L, U, V, X, Y, Z, varU, varV;
    L = tuple[0], U = tuple[1], V = tuple[2];
    if (L === 0) {
      return [0, 0, 0];
    }
    varU = U / (13 * L) + refU;
    varV = V / (13 * L) + refV;
    Y = L_to_Y(L);
    X = 0 - (9 * Y * varU) / ((varU - 4) * varV - varU * varV);
    Z = (9 * Y - (15 * varV * Y) - (varV * X)) / (3 * varV);
    return [X, Y, Z];
  };

  conv.luv.lch = function(tuple) {
    var C, H, Hrad, L, U, V;
    L = tuple[0], U = tuple[1], V = tuple[2];
    C = Math.sqrt(Math.pow(U, 2) + Math.pow(V, 2));
    if (C < 0.00000001) {
      H = 0;
    } else {
      Hrad = Math.atan2(V, U);
      H = Hrad * 360 / 2 / Math.PI;
      if (H < 0) {
        H = 360 + H;
      }
    }
    return [L, C, H];
  };

  conv.lch.luv = function(tuple) {
    var C, H, Hrad, L, U, V;
    L = tuple[0], C = tuple[1], H = tuple[2];
    Hrad = H / 360 * 2 * Math.PI;
    U = Math.cos(Hrad) * C;
    V = Math.sin(Hrad) * C;
    return [L, U, V];
  };

  conv.husl.lch = function(tuple) {
    var C, H, L, S, max;
    H = tuple[0], S = tuple[1], L = tuple[2];
    if (L > 99.9999999 || L < 0.00000001) {
      C = 0;
    } else {
      max = maxChromaForLH(L, H);
      C = max / 100 * S;
    }
    return [L, C, H];
  };

  conv.lch.husl = function(tuple) {
    var C, H, L, S, max;
    L = tuple[0], C = tuple[1], H = tuple[2];
    if (L > 99.9999999 || L < 0.00000001) {
      S = 0;
    } else {
      max = maxChromaForLH(L, H);
      S = C / max * 100;
    }
    return [H, S, L];
  };

  conv.huslp.lch = function(tuple) {
    var C, H, L, S, max;
    H = tuple[0], S = tuple[1], L = tuple[2];
    if (L > 99.9999999 || L < 0.00000001) {
      C = 0;
    } else {
      max = maxSafeChromaForL(L);
      C = max / 100 * S;
    }
    return [L, C, H];
  };

  conv.lch.huslp = function(tuple) {
    var C, H, L, S, max;
    L = tuple[0], C = tuple[1], H = tuple[2];
    if (L > 99.9999999 || L < 0.00000001) {
      S = 0;
    } else {
      max = maxSafeChromaForL(L);
      S = C / max * 100;
    }
    return [H, S, L];
  };

  conv.rgb.hex = function(tuple) {
    var ch, hex, j, len1;
    hex = "#";
    for (j = 0, len1 = tuple.length; j < len1; j++) {
      ch = tuple[j];
      ch = Math.round(ch * 1e6) / 1e6;
      if (ch < 0 || ch > 1) {
        throw new Error("Illegal rgb value: " + ch);
      }
      ch = Math.round(ch * 255).toString(16);
      if (ch.length === 1) {
        ch = "0" + ch;
      }
      hex += ch;
    }
    return hex;
  };

  conv.hex.rgb = function(hex) {
    var b, g, j, len1, n, r, ref, results;
    if (hex.charAt(0) === "#") {
      hex = hex.substring(1, 7);
    }
    r = hex.substring(0, 2);
    g = hex.substring(2, 4);
    b = hex.substring(4, 6);
    ref = [r, g, b];
    results = [];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      n = ref[j];
      results.push(parseInt(n, 16) / 255);
    }
    return results;
  };

  conv.lch.rgb = function(tuple) {
    return conv.xyz.rgb(conv.luv.xyz(conv.lch.luv(tuple)));
  };

  conv.rgb.lch = function(tuple) {
    return conv.luv.lch(conv.xyz.luv(conv.rgb.xyz(tuple)));
  };

  conv.husl.rgb = function(tuple) {
    return conv.lch.rgb(conv.husl.lch(tuple));
  };

  conv.rgb.husl = function(tuple) {
    return conv.lch.husl(conv.rgb.lch(tuple));
  };

  conv.huslp.rgb = function(tuple) {
    return conv.lch.rgb(conv.huslp.lch(tuple));
  };

  conv.rgb.huslp = function(tuple) {
    return conv.lch.huslp(conv.rgb.lch(tuple));
  };

  root = {};

  root.fromRGB = function(R, G, B) {
    return conv.rgb.husl([R, G, B]);
  };

  root.fromHex = function(hex) {
    return conv.rgb.husl(conv.hex.rgb(hex));
  };

  root.toRGB = function(H, S, L) {
    return conv.husl.rgb([H, S, L]);
  };

  root.toHex = function(H, S, L) {
    return conv.rgb.hex(conv.husl.rgb([H, S, L]));
  };

  root.p = {};

  root.p.toRGB = function(H, S, L) {
    return conv.xyz.rgb(conv.luv.xyz(conv.lch.luv(conv.huslp.lch([H, S, L]))));
  };

  root.p.toHex = function(H, S, L) {
    return conv.rgb.hex(conv.xyz.rgb(conv.luv.xyz(conv.lch.luv(conv.huslp.lch([H, S, L])))));
  };

  root.p.fromRGB = function(R, G, B) {
    return conv.lch.huslp(conv.luv.lch(conv.xyz.luv(conv.rgb.xyz([R, G, B]))));
  };

  root.p.fromHex = function(hex) {
    return conv.lch.huslp(conv.luv.lch(conv.xyz.luv(conv.rgb.xyz(conv.hex.rgb(hex)))));
  };

  root._conv = conv;

  root._getBounds = getBounds;

  root._maxChromaForLH = maxChromaForLH;

  root._maxSafeChromaForL = maxSafeChromaForL;

  if (!((typeof module !== "undefined" && module !== null) || (typeof jQuery !== "undefined" && jQuery !== null) || (typeof requirejs !== "undefined" && requirejs !== null))) {
    this.HUSL = root;
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = root;
  }

  if (typeof jQuery !== "undefined" && jQuery !== null) {
    jQuery.husl = root;
  }

  if ((typeof requirejs !== "undefined" && requirejs !== null) && (typeof define !== "undefined" && define !== null)) {
    define(root);
  }

}).call(this);

},{}],21:[function(require,module,exports){
/**
 * Clamper.
 * Detects proper clamp min/max.
 *
 * @param {number} a Current value to cut off
 * @param {number} min One side limit
 * @param {number} max Other side limit
 *
 * @return {number} Clamped value
 */

module.exports = require('./wrap')(function(a, min, max){
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
});
},{"./wrap":23}],22:[function(require,module,exports){
/**
 * @module  mumath/loop
 *
 * Looping function for any framesize
 */

module.exports = require('./wrap')(function (value, left, right) {
	//detect single-arg case, like mod-loop
	if (right === undefined) {
		right = left;
		left = 0;
	}

	//swap frame order
	if (left > right) {
		var tmp = right;
		right = left;
		left = tmp;
	}

	var frame = right - left;

	value = ((value + left) % frame) - left;
	if (value < left) value += frame;
	if (value > right) value -= frame;

	return value;
});
},{"./wrap":23}],23:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function(a){
		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else if (typeof a === 'object') {
			var result = {}, slice;
			for (var i in a){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = typeof args[j] === 'object' ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
};
},{}],24:[function(require,module,exports){
/**
 * RGB space.
 *
 * @module  color-space/rgb
 */

module.exports = {
	name: 'rgb',
	min: [0,0,0],
	max: [255,255,255],
	channel: ['red', 'green', 'blue'],
	alias: ['RGB']
};
},{}],25:[function(require,module,exports){
/**
 * https://en.wikipedia.org/wiki/CIE_1960_color_space
 *
 * Obsolete color space
 *
 * @module  color-space/ucs
 */

var xyz = require('./xyz');
var luv = require('./luv');

var ucs = module.exports = {
	name: 'ucs',
	min: [0,0,0],
	max: [100, 100, 100],
	channel: ['U','V','W'],
	alias: ['UCS', 'cie1960']
};


/**
 * UCS to XYZ
 *
 * @param {Array} ucs XYZ values
 *
 * @return {Array} UCS values
 */
ucs.xyz = function(ucs) {
	var u = ucs[0],
		v = ucs[1],
		w = ucs[2];

	return [
		1.5 * u,
		v,
		1.5 * u - 3 * v + 2 * w
	];
};


/**
 * XYZ to UCS
 *
 * @param {Array} ucs UCS values
 *
 * @return {Array} XYZ values
 */
xyz.ucs = function(xyz) {
	var x = xyz[0],
		y = xyz[1],
		z = xyz[2];

	return [
		x * 2/3,
		y,
		0.5 * (-x + 3*y + z)
	];
};
},{"./luv":19,"./xyz":29}],26:[function(require,module,exports){
/**
 * https://en.wikipedia.org/wiki/CIE_1964_color_space
 *
 * Very similar to LUV, but w and v are calculated a bit differently.
 *
 * @module  color-space/uvw
 */

var ucs = require('./ucs');
var xyz = require('./xyz');

var uvw = module.exports = {
	name: 'uvw',
	min: [-134, -140, 0],
	max: [224, 122, 100],
	channel: ['U','V','W'],
	alias: ['UVW', 'cieuvw', 'cie1964']
};


/**
 * UVW to XYZ
 */
uvw.xyz = function (arg, i, o) {
	var _u, _v, w, u, v, x, y, z, xn, yn, zn, un, vn;
	u = arg[0], v = arg[1], w = arg[2];

	if (w === 0) return [0,0,0];

	//get illuminant/observer
	i = i || 'D65';
	o = o || 2;

	xn = xyz.whitepoint[o][i][0];
	yn = xyz.whitepoint[o][i][1];
	zn = xyz.whitepoint[o][i][2];

	un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
	vn = (6 * yn) / (xn + (15 * yn) + (3 * zn));

	y = Math.pow((w + 17) / 25, 3);

	_u = u / (13 * w) + un || 0;
	_v = v / (13 * w) + vn || 0;

	x = (6 / 4) * y * _u / _v;
	z = y * (2 / _v - 0.5 * _u / _v - 5);

	return [x, y, z];
};


/**
 * XYZ to UVW
 *
 * @return {Array} An UVW array
 */
xyz.uvw = function (arr, i, o) {
	var x = arr[0], y = arr[1], z = arr[2], xn, yn, zn, un, vn;

	//find out normal source u v
	i = i || 'D65';
	o = o || 2;

	xn = xyz.whitepoint[o][i][0];
	yn = xyz.whitepoint[o][i][1];
	zn = xyz.whitepoint[o][i][2];

	un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
	vn = (6 * yn) / (xn + (15 * yn) + (3 * zn));

	var _u = 4 * x / (x + 15 * y + 3 * z) || 0;
	var _v = 6 * y / (x + 15 * y + 3 * z) || 0;

	//calc values
	var w = 25 * Math.pow(y, 1/3) - 17;
	var u = 13 * w * (_u - un);
	var v = 13 * w * (_v - vn);

	return [u, v, w];
};



/**
 * UVW to UCS
 *
 * @param {Array} uvw UCS values
 *
 * @return {Array} UVW values
 */
uvw.ucs = function(uvw) {
	//find chromacity variables
};


/**
 * UCS to UVW
 *
 * @param {Array} uvw UVW values
 *
 * @return {Array} UCS values
 */
ucs.uvw = function(ucs) {
	//find chromacity variables
	var u = U / (U + V + W);
	var v = V / (U + V + W);

	//find 1964 UVW
	w = 25 * Math.pow(y, 1/3) - 17;
	u = 13 * w * (u - un);
	v = 13 * w * (v - vn);
};
},{"./ucs":25,"./xyz":29}],27:[function(require,module,exports){
/**
 * https://en.wikipedia.org/wiki/XvYCC
 *
 * Sony xvYCC is extended YCbCr
 *
 * It uses same transformation as
 * SD: ITU-R BT.601
 * HD: ITU-R BT.709
 *
 * But have extended mins/maxes, which (may) result in negative rgb values
 *
 * https://web.archive.org/web/20130524104850/http://www.sony.net/SonyInfo/technology/technology/theme/xvycc_01.html
 *
 * //TODO: look for a spec (120$) - there are xvYCC ←→ XYZ conversion formulas
 *
 * @module  color-space/xvycc
 */

var rgb = require('./rgb');
var ypbpr = require('./ypbpr');

var xvycc = module.exports = {
	name: 'xvycc',
	min: [0, 0, 0],
	max: [255, 255, 255],
	channel: ['Y','Cb','Cr'],
	alias: ['xvYCC']
};


/**
 * From analog to digital form.
 * Simple scale to min/max ranges
 *
 * @return {Array} Resulting digitized form
 */
ypbpr.xvycc = function (ypbpr) {
	var y = ypbpr[0], pb = ypbpr[1], pr = ypbpr[2];

	return [
		16 + 219 * y,
		128 + 224 * pb,
		128 + 224 * pr
	];
}


/**
 * From digital to analog form.
 * Scale to min/max ranges
 */
xvycc.ypbpr = function (xvycc) {
	var y = xvycc[0], cb = xvycc[1], cr = xvycc[2];

	return [
		(y - 16) / 219,
		(cb - 128) / 224,
		(cr - 128) / 224
	];
}


/**
 * xvYCC to RGB
 * transform through analog form
 *
 * @param {Array} xvycc RGB values
 *
 * @return {Array} xvYCC values
 */
xvycc.rgb = function (arr, kb, kr) {
	return ypbpr.rgb(xvycc.ypbpr(arr), kb, kr);
};


/**
 * RGB to xvYCC
 * transform through analog form
 *
 * @param {Array} xvycc xvYCC values
 *
 * @return {Array} RGB values
 */
rgb.xvycc = function(arr, kb, kr) {
	return ypbpr.xvycc(rgb.ypbpr(arr, kb, kr));
};
},{"./rgb":24,"./ypbpr":35}],28:[function(require,module,exports){
/**
 * Additional xyY space, where xy are relative chromacity params
 *
 * @module color-space/xyy
 */
var xyz = require('./xyz');

var xyy = {
	name: 'xyy',
	min: [0,0,0],
	max: [1,1,100],
	channel: ['x','y','Y'],
	alias: ['xyY', 'Yxy', 'yxy']
};

xyy.xyz = function(arg) {
	var X, Y, Z, x, y;
	x = arg[0]; y = arg[1]; Y = arg[2];
	if (y === 0) {
		return [0, 0, 0];
	}
	X = x * Y / y;
	Z = (1 - x - y) * Y / y;
	return [X, Y, Z];
};

xyz.xyy = function(arg) {
	var sum, X, Y, Z;
	X = arg[0]; Y = arg[1]; Z = arg[2];
	sum = X + Y + Z;
	if (sum === 0) {
		return [0, 0, Y];
	}
	return [X / sum, Y / sum, Y];
};

module.exports = xyy;
},{"./xyz":29}],29:[function(require,module,exports){
/**
 * CIE XYZ
 *
 * @module  color-space/xyz
 */

var rgb = require('./rgb');

var xyz = {
	name: 'xyz',
	min: [0,0,0],
	channel: ['X','Y','Z'],
	alias: ['XYZ', 'ciexyz', 'cie1931']
};


/**
 * Whitepoint reference values with observer/illuminant
 *
 * http://en.wikipedia.org/wiki/Standard_illuminant
 */
xyz.whitepoint = {
	//1931 2°
	2: {
		//incadescent
		A:[109.85, 100, 35.585],
		// B:[],
		C: [98.074, 100, 118.232],
		D50: [96.422, 100, 82.521],
		D55: [95.682, 100, 92.149],
		//daylight
		D65: [95.045592705167, 100, 108.9057750759878],
		D75: [94.972, 100, 122.638],
		//flourescent
		// F1: [],
		F2: [99.187, 100, 67.395],
		// F3: [],
		// F4: [],
		// F5: [],
		// F6:[],
		F7: [95.044, 100, 108.755],
		// F8: [],
		// F9: [],
		// F10: [],
		F11: [100.966, 100, 64.370],
		// F12: [],
		E: [100,100,100]
	},

	//1964  10°
	10: {
		//incadescent
		A:[111.144, 100, 35.200],
		C: [97.285, 100, 116.145],
		D50: [96.720, 100, 81.427],
		D55: [95.799, 100, 90.926],
		//daylight
		D65: [94.811, 100, 107.304],
		D75: [94.416, 100, 120.641],
		//flourescent
		F2: [103.280, 100, 69.026],
		F7: [95.792, 100, 107.687],
		F11: [103.866, 100, 65.627],
		E: [100,100,100]
	}
};


/**
 * Top values are the whitepoint’s top values, default are D65
 */
xyz.max = xyz.whitepoint[2].D65;


/**
 * Transform xyz to rgb
 *
 * @param {Array} xyz Array of xyz values
 *
 * @return {Array} RGB values
 */
xyz.rgb = function (xyz) {
	var x = xyz[0] / 100,
		y = xyz[1] / 100,
		z = xyz[2] / 100,
		r, g, b;

	// assume sRGB
	// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	r = (x * 3.240969941904521) + (y * -1.537383177570093) + (z * -0.498610760293);
	g = (x * -0.96924363628087) + (y * 1.87596750150772) + (z * 0.041555057407175);
	b = (x * 0.055630079696993) + (y * -0.20397695888897) + (z * 1.056971514242878);

	r = r > 0.0031308 ? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r = (r * 12.92);

	g = g > 0.0031308 ? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g = (g * 12.92);

	b = b > 0.0031308 ? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b = (b * 12.92);

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
}



/**
 * RGB to XYZ
 *
 * @param {Array} rgb RGB channels
 *
 * @return {Array} XYZ channels
 */
rgb.xyz = function(rgb) {
	var r = rgb[0] / 255,
			g = rgb[1] / 255,
			b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.41239079926595) + (g * 0.35758433938387) + (b * 0.18048078840183);
	var y = (r * 0.21263900587151) + (g * 0.71516867876775) + (b * 0.072192315360733);
	var z = (r * 0.019330818715591) + (g * 0.11919477979462) + (b * 0.95053215224966);

	return [x * 100, y *100, z * 100];
};



module.exports = xyz;
},{"./rgb":24}],30:[function(require,module,exports){
/**
 * https://en.wikipedia.org/?title=YCbCr
 *
 * YCbCr is a digital form of YPbPr conversion
 * Thence limits are [16...235], according to the ITU-R BT.709 or ITU-R BT.601
 *
 * @module  color-space/ycbcr
 */

var rgb = require('./rgb');
var ypbpr = require('./ypbpr');

var ycbcr = module.exports = {
	name: 'ycbcr',
	min: [16, 16, 16],
	max: [235, 240, 240],
	channel: ['Y','Cb','Cr'],
	alias: ['YCbCr', 'YCC']
};


/**
 * From analog to digital form.
 * Simple scale to min/max ranges
 *
 * @return {Array} Resulting digitized form
 */
ypbpr.ycbcr = function (ypbpr) {
	var y = ypbpr[0], pb = ypbpr[1], pr = ypbpr[2];

	return [
		16 + 219 * y,
		128 + 224 * pb,
		128 + 224 * pr
	];
}


/**
 * From digital to analog form.
 * Scale to min/max ranges
 */
ycbcr.ypbpr = function (ycbcr) {
	var y = ycbcr[0], cb = ycbcr[1], cr = ycbcr[2];

	return [
		(y - 16) / 219,
		(cb - 128) / 224,
		(cr - 128) / 224
	];
}


/**
 * YCbCr to RGB
 * transform through analog form
 *
 * @param {Array} ycbcr RGB values
 *
 * @return {Array} YCbCr values
 */
ycbcr.rgb = function (arr, kb, kr) {
	return ypbpr.rgb(ycbcr.ypbpr(arr), kb, kr);
};


/**
 * RGB to YCbCr
 * transform through analog form
 *
 * @param {Array} ycbcr YCbCr values
 *
 * @return {Array} RGB values
 */
rgb.ycbcr = function(arr, kb, kr) {
	return ypbpr.ycbcr(rgb.ypbpr(arr, kb, kr));
};
},{"./rgb":24,"./ypbpr":35}],31:[function(require,module,exports){
/**
 * YcCbcCrc is ITU-R BT.2020
 *
 * @module  color-space/yccbccrc
 */

var rgb = require('./rgb');
var ypbpr = require('./ypbpr');

var yccbccrc = module.exports = {
	name: 'yccbccrc',
	min: [0, -0.5, -0.5],
	max: [1, 0.5, 0.5],
	channel: ['Yc','Cbc','Crc'],
	alias: ['YcCbcCrc']
};


/**
 * YcCbcCrc to RGB
 *
 * @param {Array} yccbccrc RGB values
 *
 * @return {Array} YcCbcCrc values
 */
yccbccrc.rgb = function(yccbccrc) {
	return ypbpr.rgb(yccbccrc, 0.0593, 0.2627);
};


/**
 * RGB to YcCbcCrc
 *
 * @param {Array} yccbccrc YcCbcCrc values
 *
 * @return {Array} RGB values
 */
rgb.yccbccrc = function(arr) {
	return rgb.ypbpr(arr, 0.0593, 0.2627);
};
},{"./rgb":24,"./ypbpr":35}],32:[function(require,module,exports){
/**
 * https://en.wikipedia.org/?title=YCgCo
 *
 * @module  color-space/ycgco
 */

var rgb = require('./rgb');

var ycgco = module.exports = {
	name: 'ycgco',
	min: [0, -0.5, -0.5],
	max: [1, 0.5, 0.5],
	channel: ['Y','Cg','Co'],
	alias: ['YCgCo']
};


/**
 * YCgCo to RGB
 * transform through analog form
 *
 * @param {Array} ycgco RGB values
 *
 * @return {Array} YCgCo values
 */
ycgco.rgb = function (arr) {
	var y = arr[0], cg = arr[1], co = arr[2];

	var tmp = y - cg;

	return [
		(tmp + co)*255,
		(y + cg)*255,
		(tmp - co)*255
	];
};


/**
 * RGB to YCgCo
 * transform through analog form
 *
 * @param {Array} ycgco YCgCo values
 *
 * @return {Array} RGB values
 */
rgb.ycgco = function(arr) {
	var r = arr[0]/255, g = arr[1]/255, b = arr[2]/255;

	return [
		0.25*r + 0.5*g + 0.25*b,
		-0.25*r + 0.5*g - 0.25*b,
		0.5*r - 0.5*b
	];
};
},{"./rgb":24}],33:[function(require,module,exports){
/**
 * https://en.wikipedia.org/?title=YDbDr
 *
 * @module  color-space/ydbdr
 */

var rgb = require('./rgb');
var yuv = require('./yuv');

var ydbdr = module.exports = {
	name: 'ydbdr',
	min: [0,-1.333,-1.333],
	max: [1, 1.333, 1.333],
	channel: ['Y','Db','Dr'],
	alias: ['YDbDr']
};


/**
 * YDbDr to RGB
 *
 * @param {Array} ydbdr RGB values
 *
 * @return {Array} YDbDr values
 */
ydbdr.rgb = function(ydbdr) {
	var y = ydbdr[0], db = ydbdr[1], dr = ydbdr[2];

	var r = y + 0.000092303716148*db - 0.525912630661865*dr;
	var g = y - 0.129132898890509*db + 0.267899328207599*dr;
	var b = y + 0.664679059978955*db - 0.000079202543533*dr;

	return [r*255, g*255, b*255];
};


/**
 * RGB to YDbDr
 *
 * @param {Array} ydbdr YDbDr values
 *
 * @return {Array} RGB values
 */
rgb.ydbdr = function(rgb) {
	var r = rgb[0]/255, g = rgb[1]/255, b = rgb[2]/255;
	return [
		0.299*r + 0.587*g + 0.114*b,
		-0.450*r - 0.883*g + 1.333*b,
		-1.333*r + 1.116*g + 0.217*b
	];
};


/**
 * To YUV
 */
yuv.ydbdr = function (yuv) {
	return [
		yuv[0], 3.059*yuv[1], -2.169*yuv[2]
	]
};

/**
 * From YUV
 */
ydbdr.yuv = function (ydbdr) {
	return [
		ydbdr[0], ydbdr[1] / 3.059, -ydbdr[2] / 2.169
	]
};
},{"./rgb":24,"./yuv":36}],34:[function(require,module,exports){
/**
 * YIQ https://en.wikipedia.org/?title=YIQ
 *
 * @module  color-space/yiq
 */

var rgb = require('./rgb');

var yiq = module.exports = {
	name: 'yiq',
	min: [0,-0.5957,-0.5226],
	max: [1, 0.5957, 0.5226],
	channel: ['Y','I','Q'],
	alias: ['YIQ']
};

yiq.rgb = function(yiq) {
	var y = yiq[0],
		i = yiq[1],
		q = yiq[2],
		r, g, b;

	r = (y * 1) + (i *  0.956) + (q * 0.621);
	g = (y * 1) + (i * -0.272) + (q * -0.647);
	b = (y * 1) + (i * -1.108) + (q * 1.705);

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};


//extend rgb
rgb.yiq = function(rgb) {
	var r = rgb[0] / 255,
		g = rgb[1] / 255,
		b = rgb[2] / 255;


	var y = (r * 0.299) + (g * 0.587) + (b * 0.114);
	var i = 0, q = 0;
	if (r !== g || g !== b) {
		i = (r * 0.596) + (g * -0.275) + (b * -0.321);
		q = (r * 0.212) + (g * -0.528) + (b * 0.311);
	}
	return [y, i, q];
};
},{"./rgb":24}],35:[function(require,module,exports){
/**
 * https://en.wikipedia.org/?title=YPbPr
 *
 * YPbPr is analog form of YCbCr
 * hence limits are [0..1]
 *
 * Default conversion is ITU-R BT.709
 *
 * @module  color-space/ypbpr
 */

var rgb = require('./rgb');

var ypbpr = module.exports = {
	name: 'ypbpr',
	min: [0,-0.5,-0.5],
	max: [1, 0.5, 0.5],
	channel: ['Y','Pb','Pr'],
	alias: ['YPbPr', 'Y/PB/PR', 'YPRPB', 'PRPBY', 'PBPRY', 'Y/Pb/Pr', 'YPrPb', 'PrPbY', 'PbPrY', 'Y/R-Y/B-Y', 'Y(R-Y)(B-Y)', 'R-Y', 'B-Y']
};


/**
 * YPbPr to RGB
 *
 * @param {Array} ypbpr RGB values
 *
 * @return {Array} YPbPr values
 */
ypbpr.rgb = function(ypbpr, kb, kr) {
	var y = ypbpr[0], pb = ypbpr[1], pr = ypbpr[2];

	//default conversion is ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	var r = y + 2 * pr * (1 - kr);
	var b = y + 2 * pb * (1 - kb);
	var g = (y - kr * r - kb * b) / (1 - kr - kb);

	return [r*255,g*255,b*255];
};


/**
 * RGB to YPbPr
 *
 * @param {Array} ypbpr YPbPr values
 *
 * @return {Array} RGB values
 */
rgb.ypbpr = function(rgb, kb, kr) {
	var r = rgb[0]/255, g = rgb[1]/255, b = rgb[2]/255;

	//ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	var y = kr*r + (1 - kr - kb)*g + kb*b;
	var pb = 0.5 * (b - y) / (1 - kb);
	var pr = 0.5 * (r - y) / (1 - kr);

	return [y, pb, pr];
};
},{"./rgb":24}],36:[function(require,module,exports){
/**
 * YUV https://en.wikipedia.org/?title=YUV
 *
 * @module  color-space/yuv
 */

var rgb = require('./rgb');

var yuv = module.exports = {
	name: 'yuv',
	min: [0,-0.5,-0.5],
	max: [1, 0.5, 0.5],
	channel: ['Y','U','V'],
	alias: ['YUV', 'EBU'],

	rgb: function(yuv) {
		var y = yuv[0],
			u = yuv[1],
			v = yuv[2],
			r, g, b;

		r = (y * 1) + (u *  0) + (v * 1.13983);
		g = (y * 1) + (u * -0.39465) + (v * -0.58060);
		b = (y * 1) + (u * 2.02311) + (v * 0);

		r = Math.min(Math.max(0, r), 1);
		g = Math.min(Math.max(0, g), 1);
		b = Math.min(Math.max(0, b), 1);

		return [r * 255, g * 255, b * 255];
	}
};


//extend rgb
rgb.yuv = function(rgb) {
	var r = rgb[0] / 255,
		g = rgb[1] / 255,
		b = rgb[2] / 255;

	var y = (r * 0.299) + (g * 0.587) + (b * 0.114);
	var u = (r * -0.14713) + (g * -0.28886) + (b * 0.436);
	var v = (r * 0.615) + (g * -0.51499) + (b * -0.10001);

	return [y, u, v];
};
},{"./rgb":24}]},{},[12])(12)
});