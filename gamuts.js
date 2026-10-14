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
	'cie-rgb': { primaries: P([0.7347, 0.2653], [0.2738, 0.7174], [0.1666, 0.0089]), white: 'E' },
	widegamut: { primaries: P([0.7347, 0.2653], [0.1152, 0.8264], [0.1566, 0.0177]), white: 'D50' },
	ecirgb: { primaries: P([0.67, 0.33], [0.21, 0.71], [0.14, 0.08]), white: 'D50' },
	betargb: { primaries: P([0.6888, 0.3112], [0.1986, 0.7551], [0.1265, 0.0352]), white: 'D50' },
	donrgb4: { primaries: P([0.696, 0.300], [0.215, 0.765], [0.130, 0.035]), white: 'D50' },
	bestrgb: { primaries: P([0.7347, 0.2653], [0.215, 0.775], [0.130, 0.035]), white: 'D50' },
	colormatch: { primaries: P([0.630, 0.340], [0.295, 0.605], [0.150, 0.075]), white: 'D50' },
	ektaspace: { primaries: P([0.695, 0.305], [0.260, 0.700], [0.110, 0.005]), white: 'D50' },
	brucergb: { primaries: P([0.64, 0.33], [0.28, 0.65], [0.15, 0.06]), white: 'D65' },
	'dci-p3-plus': { primaries: P([0.74, 0.27], [0.22, 0.78], [0.09, -0.09]), white: 'DCI' },
	russellrgb: { primaries: P([0.69, 0.31], [0.18, 0.77], [0.10, 0.02]), white: 'D55' },
	awg3: { primaries: P([0.6840, 0.3130], [0.2210, 0.8480], [0.0861, -0.1020]), white: 'D65' },
	awg4: { primaries: P([0.7347, 0.2653], [0.1424, 0.8576], [0.0991, -0.0308]), white: 'D65' },
	dwg: { primaries: P([0.8000, 0.3130], [0.1682, 0.9877], [0.0790, -0.1155]), white: 'D65' },
	rwg: { primaries: P([0.780308, 0.304253], [0.121595, 1.493994], [0.095612, -0.084589]), white: 'D65' },
	bmdwg: { primaries: P([0.7177215, 0.3171181], [0.2280410, 0.8615690], [0.1005841, -0.0820452]), white: 'D65' },
	vgamut: { primaries: P([0.730, 0.280], [0.165, 0.840], [0.100, -0.030]), white: 'D65' },
	sgamut3: { primaries: P([0.730, 0.280], [0.140, 0.855], [0.100, -0.050]), white: 'D65' },
	dgamut: { primaries: P([0.71, 0.31], [0.21, 0.88], [0.09, -0.08]), white: 'D65' },
	egamut: { primaries: P([0.8, 0.3177], [0.18, 0.9], [0.065, -0.0805]), white: 'D65' }
};

export default gamut;
export { gamut };
