/**
 * Linear-light ProPhoto RGB — the gamma-free counterpart to Kodak's ProPhoto (ROMM)
 * RGB, sharing its very wide primaries and D50 white point but with channel values
 * directly proportional to light intensity. It serves as the intermediate space for
 * color math on ProPhoto-referenced images, such as raw photo processing, before
 * results are re-encoded with ProPhoto's transfer curve.
 *
 * @see {@link https://www.color.org/ROMMRGB.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space}
 * @year 1999
 * @by Kodak
 * @use Linear intermediate for Kodak ProPhoto (ROMM) RGB; current, used in raw-photo color-math pipelines.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut prophoto
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz, { bradford } from './xyz.js';
import { mat3 } from './util.js';

const prophotoLinear = {
	name: 'prophoto-linear',
	range: [[0, 1], [0, 1], [0, 1]]
};

// ProPhoto (Linear) -> XYZ (D50)
const M_PP_XYZ50 = [
	0.79776664490064230, 0.13518129740053308, 0.03134773412839220,
	0.28807482881940130, 0.71183523424187300, 0.00008993693872564,
	0.00000000000000000, 0.00000000000000000, 0.82510460251046020
];

// XYZ (D50) -> ProPhoto (Linear)
const M_XYZ50_PP = [
	1.34578688164715830, -0.25557208737979464, -0.05110186497554526,
	-0.54463070512490190, 1.50824774284514680, 0.02052744743642139,
	0.00000000000000000, 0.00000000000000000, 1.21196754563894520
];

prophotoLinear.xyz = (r, g, b) => {
	// ProPhoto Linear (0-1) -> XYZ D50 -> XYZ D65 (0-100)
	const [x50, y50, z50] = mat3(M_PP_XYZ50, r, g, b);
	return mat3(bradford.D50_D65, x50, y50, z50).map(v => v * 100);
}

xyz[prophotoLinear.name] = (x, y, z) => {
	// XYZ D65 (0-100) -> XYZ D50 -> ProPhoto Linear (0-1)
	const [x50, y50, z50] = mat3(bradford.D65_D50, x / 100, y / 100, z / 100);
	return mat3(M_XYZ50_PP, x50, y50, z50);
}

export default prophotoLinear;
