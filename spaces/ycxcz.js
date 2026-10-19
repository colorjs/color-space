/**
 * YyCxCz is a linearized CIELAB from model-based halftoning, by Flohr, Kolpatzik,
 * Balasubramanian, Carrara, Bouman and Allebach (1993). It keeps CIELAB's white normalization
 * and scale factors and drops the cube root: Yy = 116·Y/Yn − 16, Cx = 500·(X/Xn − Y/Yn),
 * Cz = 200·(Y/Yn − Z/Zn). Being linear in XYZ, its channels can be low-pass filtered like light,
 * so halftone error models and image-difference metrics such as NVIDIA's FLIP filter here
 * before converting to CIELAB.
 *
 * @see {@link https://doi.org/10.1117/12.152701} Flohr et al. 1993, Proc. SPIE 1913:270-281
 * @see {@link https://users.ece.utexas.edu/~bevans/papers/2003/colorHalftoning/colorHVSspl00282.pdf} Monga, Geisler & Evans 2003, IEEE SPL 10(4), eq. 11-13
 * @see {@link https://github.com/NVlabs/flip/blob/d3ab02a4425eb167d8a4021b382a2bafc6e6c838/src/cpp/FLIP.h#L443-L462} NVIDIA FLIP, XYZToYCxCz
 * @year 1993
 * @by Flohr, Kolpatzik, Balasubramanian, Carrara, Bouman & Allebach
 * @use Halftone design and spatial image-difference metrics (FLIP): filter here, then go to CIELAB.
 * @channel {Yy} -16 100 Linearized lightness
 * @channel {Cx} -170 170 Red-green
 * @channel {Cz} -161 161 Yellow-blue
 * @method opponent
 * @encoding linear
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Monga, Geisler & Evans 2003 eq. 11-13 (citing Flohr et al. 1993, not available online):
// Yy = 116·Y/Yn − 16, Cx = 500·(X/Xn − Y/Yn), Cz = 200·(Y/Yn − Z/Zn), white D65; NVIDIA FLIP's
// XYZToYCxCz is the same with a D65 white. Kolpatzik & Bouman, J. Electron. Imaging 4(2), 1995,
// §4 (two of the 1993 authors) print Yy = 116·Y/Yn without the −16: an offset of Yy only, which
// moves no difference or filter result. White here is the library's D65 (whitepoints.js).
// Ranges: the sRGB cube's extent.
import xyz from './xyz.js';
import whitepoint from '../whitepoints.js';

const ycxcz = { name: 'ycxcz', range: [[-16, 100], [-170, 170], [-161, 161]] };

const [Xn, Yn, Zn] = whitepoint[2].D65;

xyz.ycxcz = (X, Y, Z) => {
	const x = X / Xn, y = Y / Yn, z = Z / Zn;
	return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};

ycxcz.xyz = (Yy, Cx, Cz) => {
	const y = (Yy + 16) / 116;
	return [(y + Cx / 500) * Xn, y * Yn, (y - Cz / 200) * Zn];
};

export default ycxcz;
