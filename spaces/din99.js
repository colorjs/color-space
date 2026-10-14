/**
 * DIN99 is the uniform color space of the German standard DIN 6176:2001, written by
 * the DIN colorimetry committee (FNF/FNL 2) so that plain Euclidean distance
 * approximates the CIE94 color difference without CIE94's weighting functions. It
 * takes D65 CIELAB, compresses lightness logarithmically, rotates the a*b* plane
 * by 16°, shrinks the rotated yellow-blue axis to 0.7 and compresses chroma
 * logarithmically; a99/b99 stay in the rotated frame. DIN 6176:2018 replaced it
 * with the refitted DIN99o and moved this formula to an appendix.
 *
 * @see {@link https://doi.org/10.1520/D2244-07} ASTM D2244-07 (cites DIN 6176:2001)
 * @year 2001
 * @by DIN (FNF/FNL 2 committee)
 * @use Industrial color-tolerance measurement (coatings, plastics); legacy, superseded by DIN99o in DIN 6176:2018.
 * @channel {L} 0 100 Lightness
 * @channel {a} -30 40 Rotated red-green axis
 * @channel {b} -35 35 Rotated yellow-blue axis
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// L99 = c1·ln(1 + 0.0158·L*); e = a*cos16° + b*sin16°; f = 0.7(b*cos16° − a*sin16°);
// G = √(e² + f²); C99 = ln(1 + 0.045·G)/0.045; a99 = C99·e/G, b99 = C99·f/G (no hue
// rotation back: h99 = atan2(f, e)). kE = kCH = 1 (DIN's reference conditions).
// Constants: DIN 6176:2001 as quoted by de.wikipedia (L99 coefficient printed 105.51)
// and ASTM D2244-07 / colour-science 0.4.7 DIN99_METHODS['DIN99'] (105.509). 105.509
// is used: both round 100/ln(2.58) = 105.50867; L* = 100 maps to L99 = 100.0003.
// DIN 6176 specifies D65 (10° field); this library's CIELAB is D65 / 2°, as for din99o-lab.
// Channel ranges: the sRGB cube spans a99 −27.4…+36.2, b99 −33.4…+31.2 (rounded outward).
import labD65 from './lab-d65.js';

const din99 = {
	name: 'din99',
	range: [[0, 100], [-30, 40], [-35, 35]]
};

const c1 = 105.509, c2 = 0.0158, c4 = 0.7, c6 = 0.045;
const θ = 16 * Math.PI / 180;
const cosθ = Math.cos(θ), sinθ = Math.sin(θ);

// CIELab (D65) -> DIN99
labD65[din99.name] = (L, a, b) => {
	const e = a * cosθ + b * sinθ;
	const f = c4 * (b * cosθ - a * sinθ);
	const G = Math.sqrt(e * e + f * f);
	const L99 = c1 * Math.log1p(c2 * L);
	if (G === 0) return [L99, 0, 0];
	const k = Math.log1p(c6 * G) / (c6 * G); // C99 / G
	return [L99, k * e, k * f];
};

// DIN99 -> CIELab (D65)
din99[labD65.name] = (L99, a99, b99) => {
	const L = Math.expm1(L99 / c1) / c2;
	const C99 = Math.sqrt(a99 * a99 + b99 * b99);
	if (C99 === 0) return [L, 0, 0];
	const k = Math.expm1(c6 * C99) / (c6 * C99); // G / C99
	const e = k * a99, f = k * b99 / c4;
	return [L, e * cosθ - f * sinθ, e * sinθ + f * cosθ];
};

export default din99;
