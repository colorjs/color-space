/*
	DIN99o LCh color space

	Cylindrical (polar) representation of DIN99o Lab.

	Channels:
	- L: Lightness (0-100)
	- C: Chroma (0-51.484)
	- h: Hue angle in degrees (0-360)

	Implementation based on culori:
	https://github.com/Evercoder/culori/tree/main/src/dlch
*/

import din99oLab from './din99o-lab.js';
import lab from './lab.js';
import rgb from './rgb.js';

const din99oLch = {
	name: 'din99o-lch',
	min: [0, 0, 0],
	max: [100, 51.484, 360],
	channel: ['l', 'c', 'h'],
	alias: ['din99o-polar'],

	// Range documentation (not used in conventional v3)
	range: [[0, 100], [0, 51.484], [0, 360]],

	xyz: function(l, c, h) {
		return din99oLab.xyz(...this.din99oLab(l, c, h));
	},

	rgb: function(l, c, h) {
		return din99oLab.rgb(...this.din99oLab(l, c, h));
	},

	lab: function(l, c, h) {
		return din99oLab.lab(...this.din99oLab(l, c, h));
	},

	// Convert DIN99o LCh to DIN99o Lab
	din99oLab: function(l, c, h) {
		l = l !== undefined ? l : 0;
		c = c !== undefined ? c : 0;
		h = h !== undefined ? h : 0;

		// Polar to Cartesian conversion
		const hRad = (h / 180) * Math.PI;
		const a = c * Math.cos(hRad);
		const b = c * Math.sin(hRad);

		return [l, a, b];
	}
};

// Add DIN99o Lab conversions
din99oLch.din99oLab.din99oLab = (l, c, h) => [l, c, h];

// Add RGB input support
rgb.din99oLch = function(r, g, b) {
	return din99oLab.din99oLch(...this.din99oLab(r, g, b));
};

// Add Lab input support
lab.din99oLch = function(l, a, b) {
	return din99oLab.din99oLch(...this.din99oLab(l, a, b));
};

// Add DIN99o Lab to DIN99o LCh conversion
din99oLab.din99oLch = function(l, a, b) {
	l = l !== undefined ? l : 0;
	a = a !== undefined ? a : 0;
	b = b !== undefined ? b : 0;

	// Cartesian to polar conversion
	const c = Math.sqrt(a * a + b * b);
	const h = Math.atan2(b, a) * (180 / Math.PI);

	return [l, c, h >= 0 ? h : h + 360];
};

export default din99oLch;
