/**
 * IPT — an opponent color space built by Ebner & Fairchild in 1998 specifically so lines
 * of constant hue stay straight under changes in saturation and lightness, a property
 * CIELAB lacks. I, P and T stand for lightness, red-green and yellow-blue, derived from
 * a cone-response power law followed by an opponent recombination. Its hue-linear design
 * made it the structural ancestor of Dolby's ICtCp, and it remains a common choice for
 * gamut mapping and image-difference work.
 *
 * @see {@link https://doi.org/10.2352/CIC.1998.6.1.art00003}
 * @channel {I} 0 1 Lightness
 * @channel {P} -1 1 Red-Green
 * @channel {T} -1 1 Yellow-Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// XYZ(D65) -> LMS via M1, signed power 0.43, then LMS' -> IPT via M2.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const ipt = {
	name: 'ipt',
	range: [[0, 1], [-1, 1], [-1, 1]]
};

const spow = (v, e) => v < 0 ? -Math.pow(-v, e) : Math.pow(v, e);

// XYZ(D65, normalized) -> LMS  (Ebner & Fairchild 1998, Table 1)
const M1 = [
	0.4002, 0.7075, -0.0807,
	-0.2280, 1.1500, 0.0612,
	0.0000, 0.0000, 0.9184
];
// LMS' -> IPT
const M2 = [
	0.4000, 0.4000, 0.2000,
	4.4550, -4.8510, 0.3960,
	0.8056, 0.3572, -1.1628
];
const M1I = inv3(M1);
const M2I = inv3(M2);

xyz.ipt = (x, y, z) => {
	const [l, m, s] = mat3(M1, x / 100, y / 100, z / 100);
	return mat3(M2, spow(l, 0.43), spow(m, 0.43), spow(s, 0.43));
};

ipt.xyz = (i, p, t) => {
	const [lp, mp, sp] = mat3(M2I, i, p, t);
	const [x, y, z] = mat3(M1I, spow(lp, 1 / 0.43), spow(mp, 1 / 0.43), spow(sp, 1 / 0.43));
	return [x * 100, y * 100, z * 100];
};

export default ipt;
