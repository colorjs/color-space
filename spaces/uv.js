/**
 * CIE 1976 UCS (u', v') — the modern, more perceptually uniform successor to the 1960
 * chromaticity diagram, standardized in CIE 15:2004. Equal distances on the u'v' plane
 * correspond more closely to equal perceived color differences than the older CIE xy
 * diagram does, which is why it's the chromaticity space of choice for LED binning,
 * display white-point tolerancing (Δu'v'), correlated color temperature work along the
 * Planckian locus, and colorimeter reporting.
 *
 * @see {@link https://cie.co.at/publications/colorimetry-4th-edition} CIE 15:2004
 * @wiki {@link https://en.wikipedia.org/wiki/CIELUV}
 * @year 1976
 * @by CIE
 * @use Modern uniform chromaticity diagram for LED binning, white-point tolerancing, and CCT; current standard.
 * @channel {u} 0 0.7 u' chromaticity
 * @channel {v} 0 0.6 v' chromaticity
 * @channel {Y} 0 100 Luminance
 * @method chromaticity
 * @encoding chromaticity
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// The v' axis is 1.5x the CIE 1960 v (the library's `ucs`). Stored with luminance Y as
// an invertible u'v'Y triplet (analogous to xyY).
import xyz from './xyz.js';
import whitepoint from '../whitepoints.js';

const uv = { name: 'uv',
	range: [[0, 0.7], [0, 0.6], [0, 100]] };

// the D65 white's u'v' — where achromatic (d = 0) inputs sit; any u'v' inverts to XYZ 0 at Y = 0
const [Xw, Yw, Zw] = whitepoint[2].D65;
const dw = Xw + 15 * Yw + 3 * Zw, un = 4 * Xw / dw, vn = 9 * Yw / dw;

// XYZ (0-100) -> u'v'Y
xyz.uv = (X, Y, Z) => {
	const d = X + 15 * Y + 3 * Z;
	if (d === 0) return [un, vn, 0];
	return [4 * X / d, 9 * Y / d, Y];
};

// u'v'Y -> XYZ (0-100): d = 9Y/v', X = u'd/4, Z = (d - X - 15Y)/3
uv.xyz = (u, v, Y) => {
	if (v === 0) return [0, 0, 0];
	const d = 9 * Y / v, X = u * d / 4;
	return [X, Y, (d - X - 15 * Y) / 3];
};

export default uv;
