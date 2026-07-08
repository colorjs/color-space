/**
 * DIN99o Lab is a further nonlinear remapping of CIELAB, part of the German
 * DIN 6176 color-difference standard, built so that a simple Euclidean distance
 * between two points approximates perceived color difference far more closely
 * than raw CIELAB does. It compresses Lab's lightness and chroma logarithmically
 * and applies a hue rotation, correcting CIELAB's well-known tendency to
 * overstate differences among highly saturated colors. The DIN99 family is used
 * mainly in industrial color-tolerance work — coatings, plastics and automotive
 * finishes — as a lighter alternative to the more elaborate CIE ΔE2000 formula.
 *
 * @see {@link https://de.wikipedia.org/wiki/DIN99-Farbraum}
 * @year 2018
 * @by DIN (FNF/FNL 2 committee)
 * @use Industrial color-tolerance measurement standardized in DIN 6176; current lighter alternative to CIEDE2000 in coatings/plastics/automotive QC.
 * @channel {L} 0 100 Lightness
 * @channel {a} -40 40 Green-Red axis
 * @channel {b} -40 40 Blue-Yellow axis
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import labD65 from './lab-d65.js'; // DIN 6176 is defined relative to D65 CIELab

const din99oLab = {
	name: 'din99o-lab',
	range: [[0, 100], [-40, 40], [-40, 40]]
};

const kE = 1, kCH = 1;
const θ = (26 / 180) * Math.PI;
const cosθ = Math.cos(θ), sinθ = Math.sin(θ);
const factor = 100 / Math.log(139 / 100); // ≈ 303.67

// DIN99o Lab -> CIELab (D65)
din99oLab[labD65.name] = (l, a, b) => {
	const L = (Math.exp((l * kE) / factor) - 1) / 0.0039;
	const c = Math.sqrt(a * a + b * b);
	if (c === 0) return [L, 0, 0];
	const h = Math.atan2(b, a);
	const G = (Math.exp(0.0435 * c * kCH * kE) - 1) / 0.075;
	const e = G * Math.cos(h - θ);
	const f = G * Math.sin(h - θ);
	return [L, e * cosθ - (f / 0.83) * sinθ, e * sinθ + (f / 0.83) * cosθ];
};

// CIELab (D65) -> DIN99o Lab
labD65[din99oLab.name] = (l, a, b) => {
	const e = a * cosθ + b * sinθ;
	const f = 0.83 * (b * cosθ - a * sinθ);
	const G = Math.sqrt(e * e + f * f);
	const L = (factor / kE) * Math.log(1 + 0.0039 * l);
	const c = Math.log(1 + 0.075 * G) / (0.0435 * kCH * kE);
	if (c === 0) return [L, 0, 0];
	const h = Math.atan2(f, e) + θ;
	return [L, c * Math.cos(h), c * Math.sin(h)];
};

export default din99oLab;
