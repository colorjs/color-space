/**
 * CIE 1976 UCS (u'v') color space
 *
 * The modern uniform-chromaticity diagram (CIE 15:2004 §8.1 / ISO 11664-5): the
 * dominant chromaticity space for LED binning (ANSI C78.377), display white-point
 * tolerancing (Δu'v'), CCT / Planckian-locus work and colorimeter reporting. The
 * v' axis is 1.5× the CIE 1960 v (the library's `ucs`). Stored with luminance Y as
 * an invertible u'v'Y triplet (analogous to xyY).
 *
 * @see {@link https://en.wikipedia.org/wiki/CIELUV#The_CIE_1976_UCS_diagram}
 * @see {@link https://cie.co.at/publications/colorimetry-4th-edition} CIE 15:2004
 * @channel {u} 0 0.7 u' chromaticity
 * @channel {v} 0 0.6 v' chromaticity
 * @channel {Y} 0 100 Luminance (CIE Y)
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';

const uv = { name: 'uv' };

// XYZ (0-100) -> u'v'Y
xyz.uv = (X, Y, Z) => {
	const d = X + 15 * Y + 3 * Z;
	if (d === 0) return [0, 0, 0];
	return [4 * X / d, 9 * Y / d, Y];
};

// u'v'Y -> XYZ (0-100): d = 9Y/v', X = u'd/4, Z = (d - X - 15Y)/3
uv.xyz = (u, v, Y) => {
	if (v === 0) return [0, 0, 0];
	const d = 9 * Y / v, X = u * d / 4;
	return [X, Y, (d - X - 15 * Y) / 3];
};

export default uv;
