/**
 * Ragoo and Farup's 2021 re-optimization of IPT keeps Ebner and Fairchild's structure
 * (XYZ to LMS matrix, signed power, opponent matrix) and refits its parameters: new
 * cone primaries, exponent 0.4071 instead of 0.43, and a skew, tilt and rotation folded
 * into the opponent matrix. The fit trades color order (hue linearity) against
 * perceptual uniformity; the published setting improves STRESS by 14 % and the
 * color-order metric by 37 % over IPT on the authors' own training data.
 *
 * @see {@link https://doi.org/10.2352/issn.2169-2629.2021.29.282} Ragoo & Farup 2021, Proc. IS&T CIC 29, 282-287
 * @year 2021
 * @by Luvin Munish Ragoo & Ivar Farup
 * @use Color-difference and gamut-mapping research.
 * @channel {I} 0 1 Lightness
 * @channel {P} -1 1 Red-Green
 * @channel {T} -1 1 Yellow-Blue
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Ragoo & Farup 2021, "Optimised IPT transform" with bias f = 0.1: XYZ(D65, Y = 1 for
// white) -> LMS via M1 (Eq. 27), signed power 0.4071 (Eq. 28), LMS' -> IPT via the
// summary matrix of Eq. 29 (= M2·M3·IPT's opponent matrix, Eq. 26, rounded to 4
// decimals as printed). Same constants as colour-science 0.4.7 XYZ_to_IPT_Ragoo2021.
// Inverses are derived.
import xyz from './xyz.js';
import { mat3, inv3, spow } from '../math.js';

const iptRagoo = { name: 'ipt-ragoo', range: [[0, 1], [-1, 1], [-1, 1]] };

const M1 = [
	0.4321, 0.6906, -0.0930,
	-0.1793, 1.1458, 0.0226,
	0.0631, 0.1532, 0.7226
];
const M2 = [
	0.3037, 0.6688, 0.0276,
	3.9247, -4.7339, 0.8093,
	1.5932, -0.5205, -1.0727
];
const M1I = inv3(M1);
const M2I = inv3(M2);
const g = 0.4071;

xyz['ipt-ragoo'] = (x, y, z) => mat3(M2, ...mat3(M1, x / 100, y / 100, z / 100).map(v => spow(v, g)));

iptRagoo.xyz = (i, p, t) => mat3(M1I, ...mat3(M2I, i, p, t).map(v => spow(v, 1 / g))).map(v => v * 100);

export default iptRagoo;
