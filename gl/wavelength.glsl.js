// GLSL chunk: wavelength (nm, 380-700) -> CIE XYZ D65 0-100. CIE 1931 2° colour-
// matching functions embedded at 5 nm (same table as wavelength.js CMF), linearly
// interpolated; 555 nm peak -> Y=100. One-way (forward only): the inverse (dominant
// wavelength of an arbitrary XYZ) is shared with — and left to — the `dsh` chunk,
// which owns the CIE 1931 spectral-locus table.
import xyz from './xyz.glsl.js'
export default {
	name: 'wavelength',
	deps: [xyz],
	dim: 1,
	edges: { xyz: [null, 'wavelength_xyz'] },
	code: /* glsl */ `
const float WAVELENGTH_X_[65] = float[65](0.00137, 0.00224, 0.00424, 0.00765, 0.01431, 0.02319, 0.04351, 0.07763, 0.13438, 0.21477, 0.2839, 0.3285, 0.34828, 0.34806, 0.3362, 0.3187, 0.2908, 0.2511, 0.19536, 0.1421, 0.09564, 0.05795, 0.03201, 0.0147, 0.0049, 0.0024, 0.0093, 0.0291, 0.06327, 0.1096, 0.1655, 0.22575, 0.2904, 0.3597, 0.43345, 0.51205, 0.5945, 0.6784, 0.7621, 0.8425, 0.9163, 0.9786, 1.0263, 1.0567, 1.0622, 1.0456, 1.0026, 0.9384, 0.85445, 0.7514, 0.6424, 0.5419, 0.4479, 0.3608, 0.2835, 0.2187, 0.1649, 0.1212, 0.0874, 0.0636, 0.04677, 0.0329, 0.0227, 0.01584, 0.01136);
const float WAVELENGTH_Y_[65] = float[65](0.00004, 0.00006, 0.00012, 0.00022, 0.0004, 0.00064, 0.00121, 0.00218, 0.004, 0.0073, 0.0116, 0.01684, 0.023, 0.0298, 0.038, 0.048, 0.06, 0.0739, 0.09098, 0.1126, 0.13902, 0.1693, 0.20802, 0.2586, 0.323, 0.4073, 0.503, 0.6082, 0.71, 0.7932, 0.862, 0.91485, 0.954, 0.9803, 0.99495, 1.0, 0.995, 0.9786, 0.952, 0.9154, 0.87, 0.8163, 0.757, 0.6949, 0.631, 0.5668, 0.503, 0.4412, 0.381, 0.321, 0.265, 0.217, 0.175, 0.1382, 0.107, 0.0816, 0.061, 0.04458, 0.032, 0.0232, 0.017, 0.01192, 0.00821, 0.00572, 0.0041);
const float WAVELENGTH_Z_[65] = float[65](0.00645, 0.01055, 0.02005, 0.03621, 0.06785, 0.1102, 0.2074, 0.3713, 0.6456, 1.03905, 1.3856, 1.62296, 1.74706, 1.7826, 1.77211, 1.7441, 1.6692, 1.5281, 1.28764, 1.0419, 0.81295, 0.6162, 0.46518, 0.3533, 0.272, 0.2123, 0.1582, 0.1117, 0.07825, 0.05725, 0.04216, 0.02984, 0.0203, 0.0134, 0.00875, 0.00575, 0.0039, 0.00275, 0.0021, 0.0018, 0.00165, 0.0014, 0.0011, 0.001, 0.0008, 0.0006, 0.00034, 0.00024, 0.00019, 0.0001, 0.00005, 0.00003, 0.00002, 0.00001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

vec3 wavelength_xyz(float c) {
	float wl = c;
	if (wl < 380.0) { wl = 380.0; }
	if (wl > 700.0) { wl = 700.0; }
	// find the 5 nm bracket [i, i+1] by walking the evenly-spaced grid (no float->int
	// cast: i and its lower bound wl0 both advance in lockstep with the fixed loop)
	int i = 0;
	float wl0 = 380.0;
	float next = 385.0;
	for (int k = 0; k < 64; k++) {
		if (next < wl) { i = k + 1; wl0 = next; }
		next = next + 5.0;
	}
	int j = i + 1;
	float f = (wl - wl0) / 5.0;
	return vec3(
		(WAVELENGTH_X_[i] + f * (WAVELENGTH_X_[j] - WAVELENGTH_X_[i])) * 100.0,
		(WAVELENGTH_Y_[i] + f * (WAVELENGTH_Y_[j] - WAVELENGTH_Y_[i])) * 100.0,
		(WAVELENGTH_Z_[i] + f * (WAVELENGTH_Z_[j] - WAVELENGTH_Z_[i])) * 100.0);
}`,
}
