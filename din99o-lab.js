/**
 * DIN99o Lab color space
 *
 * Perceptually uniform variant of CIE Lab
 * Optimized for Euclidean color difference calculations
 * DIN 6176 standard
 *
 * @channel {L} 0 100 Lightness
 * @channel {a} -40 40 Green-Red axis
 * @channel {b} -40 40 Blue-Yellow axis
 * @illuminant D65
 * @observer 2
 */
import lab from './lab.js';
import rgb from './rgb.js';

// DIN99o constants
const kE = 1;
const kCH = 1;
const θ = (26 / 180) * Math.PI;
const cosθ = Math.cos(θ);
const sinθ = Math.sin(θ);
const factor = 100 / Math.log(139 / 100); // ~ 303.67

const din99oLab = {
	name: 'din99o-lab',
	min: [0, -40.09, -40.469],
	max: [100, 45.501, 44.344],
	channel: ['l', 'a', 'b'],
	alias: ['din99o'],

	// Range documentation (not used in conventional v3)
	range: [[0, 100], [-40.09, 45.501], [-40.469, 44.344]],

	xyz: function(l, a, b) {
		return lab.xyz(...this.lab(l, a, b));
	},

	rgb: function(l, a, b) {
		return lab.rgb(...this.lab(l, a, b));
	},

	// Convert DIN99o Lab to CIELab D65
	lab: function(l, a, b) {
		l = l !== undefined ? l : 0;
		a = a !== undefined ? a : 0;
		b = b !== undefined ? b : 0;

		// Convert L using exponential formula
		const labL = (Math.exp((l * kE) / factor) - 1) / 0.0039;

		// Convert a,b through intermediate e,f coordinates
		// First need to calculate via polar (LCh) form
		const c = Math.sqrt(a * a + b * b);
		if (c === 0) {
			return [labL, 0, 0];
		}

		const h = Math.atan2(b, a);
		const G = (Math.exp(0.0435 * c * kCH * kE) - 1) / 0.075;
		const e = G * Math.cos(h - θ);
		const f = G * Math.sin(h - θ);

		const labA = e * cosθ - (f / 0.83) * sinθ;
		const labB = e * sinθ + (f / 0.83) * cosθ;

		return [labL, labA, labB];
	}
};

// Add Lab conversions
din99oLab.lab.lab = (l, a, b) => [l, a, b];

// Add RGB input support
rgb.din99oLab = function(r, g, b) {
	const [labL, labA, labB] = this.lab(r, g, b);
	return lab.din99oLab(labL, labA, labB);
};

// Add Lab input support (CIELAB D65 to DIN99o Lab)
lab.din99oLab = function(l, a, b) {
	l = l !== undefined ? l : 0;
	a = a !== undefined ? a : 0;
	b = b !== undefined ? b : 0;

	// Rotate and scale chromaticity
	const e = a * cosθ + b * sinθ;
	const f = 0.83 * (b * cosθ - a * sinθ);
	const G = Math.sqrt(e * e + f * f);

	// Convert L using logarithmic formula
	const dinL = (factor / kE) * Math.log(1 + 0.0039 * l);

	// Convert chroma
	const dinC = Math.log(1 + 0.075 * G) / (0.0435 * kCH * kE);

	if (dinC === 0) {
		return [dinL, 0, 0];
	}

	// Convert hue
	const h = Math.atan2(f, e) + θ;
	const dinA = dinC * Math.cos(h);
	const dinB = dinC * Math.sin(h);

	return [dinL, dinA, dinB];
};

export default din99oLab;
