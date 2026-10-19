/**
 * The Helmholtz–Kohlrausch extension Hellwig, Stolitzka and Fairchild published in 2022
 * alongside the Hellwig 2022 model: of two colors with the same luminance, the more saturated
 * one looks lighter. Fitted to earlier experimental data, it adds to the lightness J a term
 * that grows with chroma and depends on hue; colorfulness M and hue h stay Hellwig 2022's.
 *
 * @see {@link https://doi.org/10.1002/col.22793} Hellwig, Stolitzka & Fairchild 2022
 * @year 2022
 * @by Luke Hellwig, Dale Stolitzka & Mark Fairchild
 * @use Color-appearance modeling that predicts the extra lightness of saturated colors.
 * @channel {J} 0 100 Lightness
 * @channel {M} 0 60 Colorfulness
 * @channel {h} 0 360 Hue angle
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// J_HK = J + f(h)·C^0.587, C = 35·M/A_w the Hellwig 2022 chroma, f(h) = −0.160 cos h +
// 0.132 cos 2h − 0.405 sin h + 0.080 sin 2h + 0.792 (as colour-science 0.4.7 and coloraide
// 8.13 implement the paper). C depends on M alone, so the inverse is closed-form:
// J = J_HK − f(h)·C^0.587. Viewing conditions are hellwig2022.js's (D65 [95.05, 100,
// 108.88], L_A = 318.31 cd/m², Y_b = 20, average surround); A_w is its white's achromatic
// response, recomputed here the same way.
import hellwig, { Aw } from './hellwig2022.js';
import { spow } from '../math.js';

const hk = { name: 'hellwig2022-hk', range: [[0, 100], [0, 60], [0, 360]] };

// the lightness the effect adds at colorfulness M and hue h (degrees)
const dJ = (M, h) => {
	const hr = h * Math.PI / 180;
	const f = -0.160 * Math.cos(hr) + 0.132 * Math.cos(2 * hr) - 0.405 * Math.sin(hr) + 0.080 * Math.sin(2 * hr) + 0.792;
	return f * spow(35 * M / Aw, 0.587);
};

hellwig[hk.name] = (J, M, h) => [J + dJ(M, h), M, h];
hk.hellwig2022 = (J, M, h) => [J - dJ(M, h), M, h];

export default hk;
