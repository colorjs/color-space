/**
 * CIELAB is the CIE's 1976 perceptual color space, the first widely adopted
 * attempt to make Euclidean distance between coordinates track perceived color
 * difference. It splits color into lightness and two opponent axes — red versus
 * green and yellow versus blue — echoing how the visual system encodes color
 * beyond the retina. Color-managed workflows conventionally anchor Lab to the D50
 * illuminant, which is why it serves as the ICC profile connection space and the
 * reference form of CSS Color 4's lab() function, rather than tying it to any
 * particular display's white point.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#lab-colors}
 * @wiki {@link https://en.wikipedia.org/wiki/CIELAB_color_space}
 * @year 1976
 * @by CIE
 * @use Device-independent perceptual color specification; current ICC profile connection space and CSS Color 4's lab().
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Green-Red axis
 * @channel {b} -125 125 Blue-Yellow axis
 * @method opponent
 * @encoding perceptual
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz, { bradford, M_LRGB_INV } from './xyz.js';
import rgb from './rgb.js';
import { mat3, mul3, inv3 } from '../util.js';
import { srgbToLinear, linearToSrgb } from '../transfers.js';
import { labF, labFInv } from '../cie.js';

const lab = {
	name: 'lab',
	range: [[0, 100], [-125, 125], [-125, 125]]
};

const whiteD50 = [0.9642956764295677, 1, 0.8251046025104602]; // CSS Color 4 D50 (0-1)

lab.xyz = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	// Lab is D50-relative -> XYZ D50 (0-1) -> adapt to D65 -> 0-100 convention
	// (scaled in place: one allocation, bit-identical to a .map(v => v * 100) pass)
	const v = mat3(bradford.D50_D65, labFInv(fx) * whiteD50[0], labFInv(fy) * whiteD50[1], labFInv(fz) * whiteD50[2]);
	v[0] *= 100; v[1] *= 100; v[2] *= 100;
	return v;
};

xyz.lab = (x, y, z) => {
	// XYZ D65 (0-100) -> D50 (0-1) -> Lab
	const v = mat3(bradford.D65_D50, x / 100, y / 100, z / 100);
	const fx = labF(v[0] / whiteD50[0]);
	const fy = labF(v[1] / whiteD50[1]);
	const fz = labF(v[2] / whiteD50[2]);
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

// ── the display route, composed in source (as xyz.js composes rgb ⇄ xyz):
// Lab → XYZ(D50) → linear sRGB → gamma, per the CSS Color 4 pipeline. The Bradford
// adaptation and the XYZ→lRGB matrix pre-multiply into one at module scope, and the
// 0-100 XYZ convention cancels out of the seam entirely — one multiply per call.
const M_LABXYZ_LRGB = mul3(M_LRGB_INV, bradford.D50_D65);   // XYZ(D50, 0-1) → linear sRGB
const M_LRGB_LABXYZ = inv3(M_LABXYZ_LRGB);                  // derived exact inverse

lab.rgb = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	const v = mat3(M_LABXYZ_LRGB, labFInv(fx) * whiteD50[0], labFInv(fy) * whiteD50[1], labFInv(fz) * whiteD50[2]);
	return [255 * linearToSrgb(v[0]), 255 * linearToSrgb(v[1]), 255 * linearToSrgb(v[2])];
};

rgb.lab = (r, g, b) => {
	const v = mat3(M_LRGB_LABXYZ, srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255));
	const fx = labF(v[0] / whiteD50[0]);
	const fy = labF(v[1] / whiteD50[1]);
	const fz = labF(v[2] / whiteD50[2]);
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

export default lab;
