/**
 * DIN99c is one of three refinements of the DIN99 uniform color space published in
 * 2002 by Cui, Luo, Rigg, Roesler and Witt, fitted to combined small color-difference
 * data so Euclidean distance performs close to CIEDE2000. Like its sibling DIN99d it
 * corrects the blue region by mixing a share of Z into X before the CIELAB step;
 * unlike DIN99d it keeps the CIELAB axis orientation (no rotation) and scales the
 * b axis by 0.94 before the logarithmic chroma compression.
 *
 * @see {@link https://doi.org/10.1002/col.10066}
 * @year 2002
 * @by Cui, Luo, Rigg, Roesler & Witt
 * @use Euclidean color-difference research; not part of DIN 6176.
 * @channel {L} 0 100 Lightness
 * @channel {a} -40 50 Green-Red axis
 * @channel {b} -50 50 Blue-Yellow axis
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// X' = 1.1·X − 0.1·Z, applied to the sample and to the white (X'w = 1.1·Xw − 0.1·Zw),
// then CIELab from (X', Y, Z); L99 = 317.65·ln(1 + 0.0037·L*); e = a*, f = 0.94·b*
// (rotation 0°); G = √(e² + f²); C99 = 23·ln(1 + 0.066·G); a99 = C99·e/G, b99 = C99·f/G.
// Constants: Cui et al. 2002 via colour-science 0.4.7 DIN99_METHODS['DIN99c']
// = [317.65, 0.0037, 0, 0.94, 23.0, 0.066, 0, 1]. colour-science's XYZ_to_DIN99 omits
// the X' step; the 1.1/0.1 coefficients and the corrected white are those of
// I. Farup's colourlab (space.py, _din99c_xyz/_din99c_white) and the description at
// https://de.wikipedia.org/wiki/DIN99-Farbraum, and mirror din99d.js.
// Channel ranges: the sRGB cube spans a99 −38.5…+45.2, b99 −45.7…+44.2 (rounded outward).
import xyz from './xyz.js';
import { labF, labFInv } from '../cie.js';

const din99c = {
	name: 'din99c',
	range: [[0, 100], [-40, 50], [-50, 50]]
};

const c1 = 317.65, c2 = 0.0037, c4 = 0.94, c5 = 23, c6 = 0.066;

// the X-corrected D65 white
const Xw = 95.04559270516716, Yw = 100, Zw = 108.90577507598784;
const Xcw = 1.1 * Xw - 0.1 * Zw;

// XYZ (D65, 0-100) -> DIN99c
xyz.din99c = (X, Y, Z) => {
	const fx = labF((1.1 * X - 0.1 * Z) / Xcw), fy = labF(Y / Yw), fz = labF(Z / Zw);
	const L = 116 * fy - 16, e = 500 * (fx - fy), f = c4 * 200 * (fy - fz);
	const G = Math.sqrt(e * e + f * f);
	const L99 = c1 * Math.log1p(c2 * L);
	if (G === 0) return [L99, 0, 0];
	const k = c5 * Math.log1p(c6 * G) / G; // C99 / G
	return [L99, k * e, k * f];
};

// DIN99c -> XYZ (D65, 0-100)
din99c.xyz = (L99, a99, b99) => {
	const L = Math.expm1(L99 / c1) / c2;
	const C99 = Math.sqrt(a99 * a99 + b99 * b99);
	const k = C99 === 0 ? 0 : Math.expm1(C99 / c5) / (c6 * C99); // G / C99
	const fy = (L + 16) / 116, fx = k * a99 / 500 + fy, fz = fy - k * b99 / c4 / 200;
	const Z = labFInv(fz) * Zw;
	return [(labFInv(fx) * Xcw + 0.1 * Z) / 1.1, labFInv(fy) * Yw, Z];
};

export default din99c;
