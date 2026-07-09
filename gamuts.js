/**
 * RGB gamut reference data — the primary chromaticities (CIE xy) and white point that
 * define each RGB working space. Native-white referred (the space's own white, before
 * any adaptation to the D65 hub). Split out like whitepoints.js so a space carries a
 * one-word `@gamut` tag and meta resolves the numbers here.
 *
 *     import gamut from 'color-space/gamuts.js'
 *     gamut.srgb // { primaries: { r:[0.64,0.33], g:[0.30,0.60], b:[0.15,0.06] }, white: 'D65' }
 *
 * Values: CSS Color 4 §12 predefined spaces (sRGB, display-p3, a98-rgb, prophoto-rgb,
 * rec2020), SMPTE RP 431-2 (DCI-P3), the ACES spec (AP0/AP1), ITU-R BT.470 (NTSC/PAL),
 * SMPTE C, and CIE 1931 (CIE RGB, white E). The D65 primaries are checked in the test
 * suite against each space's live R/G/B → XYZ chromaticities.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined}
 */
const P = (r, g, b) => ({ r, g, b });

const gamut = {
	srgb: { primaries: P([0.640, 0.330], [0.300, 0.600], [0.150, 0.060]), white: 'D65' },
	'display-p3': { primaries: P([0.680, 0.320], [0.265, 0.690], [0.150, 0.060]), white: 'D65' },
	'dci-p3': { primaries: P([0.680, 0.320], [0.265, 0.690], [0.150, 0.060]), white: 'DCI' },
	rec2020: { primaries: P([0.708, 0.292], [0.170, 0.797], [0.131, 0.046]), white: 'D65' },
	'adobe-rgb': { primaries: P([0.640, 0.330], [0.210, 0.710], [0.150, 0.060]), white: 'D65' },
	prophoto: { primaries: P([0.734699, 0.265301], [0.159597, 0.840403], [0.036598, 0.000105]), white: 'D50' },
	ap1: { primaries: P([0.713, 0.293], [0.165, 0.830], [0.128, 0.044]), white: 'ACES' },
	ap0: { primaries: P([0.7347, 0.2653], [0.0, 1.0], [0.0001, -0.0770]), white: 'ACES' },
	'apple-rgb': { primaries: P([0.625, 0.340], [0.280, 0.595], [0.155, 0.070]), white: 'D65' },
	ntsc: { primaries: P([0.67, 0.33], [0.21, 0.71], [0.14, 0.08]), white: 'C' },
	pal: { primaries: P([0.640, 0.330], [0.290, 0.600], [0.150, 0.060]), white: 'D65' },
	'smpte-c': { primaries: P([0.630, 0.340], [0.310, 0.595], [0.155, 0.070]), white: 'D65' },
	'cie-rgb': { primaries: P([0.7347, 0.2653], [0.2738, 0.7174], [0.1666, 0.0089]), white: 'E' }
};

export default gamut;
export { gamut };
