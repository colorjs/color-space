/**
 * Wavelength — the color of monochromatic light, a single point on the visible
 * spectrum's "rainbow" of pure spectral hues, from deep violet near 380 nm to deep red
 * near 700 nm. Converting a wavelength to CIE XYZ uses the color-matching functions of
 * the CIE 1931 standard observer, the same experimentally-derived functions underlying
 * all of modern colorimetry. Going the other direction recovers the nearest spectral
 * wavelength of any color — the dominant wavelength that gives CIE DSH its hue,
 * projected into the 380–700 nm domain.
 *
 * @see {@link https://en.wikipedia.org/wiki/CIE_1931_color_space}
 * @wiki {@link https://en.wikipedia.org/wiki/Spectral_color}
 * @year 1931
 * @by CIE
 * @use Monochromatic-light-to-XYZ mapping via the CIE 1931 standard observer; current colorimetry reference.
 * @channel {wl} 380 700 Wavelength
 * @method spectral
 * @encoding chromaticity
 * @illuminant E
 * @observer 2
 * @referred display
 * @loss projective Any color projects to its nearest spectral-locus hue; purples have no wavelength.
 * @dynamic sdr
 */
// Implementation notes:
// Forward maps a wavelength in nm to CIE XYZ via the CIE 1931 2° colour-matching
// functions (embedded at 5 nm, scaled so the 555 nm peak luminance is Y=100). The
// inverse projects any colour to its nearest spectral wavelength (shared with
// dsh.js): exact for spectral inputs, lossy otherwise — purples, which have no
// dominant wavelength of their own, snap to the nearer end of the line of purples
// (never a negative or out-of-range value; DSH keeps the signed complementary
// convention). Achromatic colours return the 0 sentinel, which the forward renders
// as the D65 neutral — mirroring dsh's d=0.
import xyz from './xyz.js';
import { spectralWavelength } from './dsh.js';
import whitepoint from '../whitepoints.js';

const wavelength = { name: 'wavelength', range: [[380, 700]] };

// CIE 1931 2° colour-matching functions (x̄, ȳ, z̄), 380-700 nm at 5 nm
// (exported for reuse — ostwald.js integrates semichromes against it)
export const CMF = [
	[380, 0.00137, 0.00004, 0.00645], [385, 0.00224, 0.00006, 0.01055], [390, 0.00424, 0.00012, 0.02005], [395, 0.00765, 0.00022, 0.03621],
	[400, 0.01431, 0.0004, 0.06785], [405, 0.02319, 0.00064, 0.1102], [410, 0.04351, 0.00121, 0.2074], [415, 0.07763, 0.00218, 0.3713],
	[420, 0.13438, 0.004, 0.6456], [425, 0.21477, 0.0073, 1.03905], [430, 0.2839, 0.0116, 1.3856], [435, 0.3285, 0.01684, 1.62296],
	[440, 0.34828, 0.023, 1.74706], [445, 0.34806, 0.0298, 1.7826], [450, 0.3362, 0.038, 1.77211], [455, 0.3187, 0.048, 1.7441],
	[460, 0.2908, 0.06, 1.6692], [465, 0.2511, 0.0739, 1.5281], [470, 0.19536, 0.09098, 1.28764], [475, 0.1421, 0.1126, 1.0419],
	[480, 0.09564, 0.13902, 0.81295], [485, 0.05795, 0.1693, 0.6162], [490, 0.03201, 0.20802, 0.46518], [495, 0.0147, 0.2586, 0.3533],
	[500, 0.0049, 0.323, 0.272], [505, 0.0024, 0.4073, 0.2123], [510, 0.0093, 0.503, 0.1582], [515, 0.0291, 0.6082, 0.1117],
	[520, 0.06327, 0.71, 0.07825], [525, 0.1096, 0.7932, 0.05725], [530, 0.1655, 0.862, 0.04216], [535, 0.22575, 0.91485, 0.02984],
	[540, 0.2904, 0.954, 0.0203], [545, 0.3597, 0.9803, 0.0134], [550, 0.43345, 0.99495, 0.00875], [555, 0.51205, 1, 0.00575],
	[560, 0.5945, 0.995, 0.0039], [565, 0.6784, 0.9786, 0.00275], [570, 0.7621, 0.952, 0.0021], [575, 0.8425, 0.9154, 0.0018],
	[580, 0.9163, 0.87, 0.00165], [585, 0.9786, 0.8163, 0.0014], [590, 1.0263, 0.757, 0.0011], [595, 1.0567, 0.6949, 0.001],
	[600, 1.0622, 0.631, 0.0008], [605, 1.0456, 0.5668, 0.0006], [610, 1.0026, 0.503, 0.00034], [615, 0.9384, 0.4412, 0.00024],
	[620, 0.85445, 0.381, 0.00019], [625, 0.7514, 0.321, 0.0001], [630, 0.6424, 0.265, 0.00005], [635, 0.5419, 0.217, 0.00003],
	[640, 0.4479, 0.175, 0.00002], [645, 0.3608, 0.1382, 0.00001], [650, 0.2835, 0.107, 0], [655, 0.2187, 0.0816, 0],
	[660, 0.1649, 0.061, 0], [665, 0.1212, 0.04458, 0], [670, 0.0874, 0.032, 0], [675, 0.0636, 0.0232, 0],
	[680, 0.04677, 0.017, 0], [685, 0.0329, 0.01192, 0], [690, 0.0227, 0.00821, 0], [695, 0.01584, 0.00572, 0],
	[700, 0.01136, 0.0041, 0]
];
const N = CMF.length;

// wavelength (nm) -> XYZ (0-100; 555 nm peak -> Y=100)
wavelength.xyz = (wl) => {
	if (wl === 0) return whitepoint[2].D65.slice();   // the 0 sentinel: no dominant hue -> neutral
	wl = Math.max(380, Math.min(700, wl));
	let i = 0;
	while (i < N - 1 && CMF[i + 1][0] < wl) i++;
	const f = (wl - CMF[i][0]) / (CMF[i + 1][0] - CMF[i][0]);
	return [1, 2, 3].map(k => (CMF[i][k] + f * (CMF[i + 1][k] - CMF[i][k])) * 100);
};

// XYZ -> nearest spectral wavelength (380-700; achromatic -> 0)
xyz.wavelength = (X, Y, Z) => {
	const s = X + Y + Z;
	return [s === 0 ? 0 : spectralWavelength(X / s, Y / s)];
};

export default wavelength;
