/**
 * Hunter Lab is Richard Hunter's opponent-color scale for measuring surface color, published
 * in its L, a, b form in 1958 and adapted to other illuminants through the Ka, Kb coefficients
 * in 1967. It came years before CIELAB as one of the first practical attempts at a roughly
 * uniform scale, built on square roots of the tristimulus values, which Hunter's photoelectric
 * instruments could compute, where CIELAB uses cube roots. It is less uniform than CIELAB, but
 * thanks to its head start, legacy industrial specifications still report in Hunter Lab units.
 *
 * @see {@link https://doi.org/10.1364/JOSA.48.000985} Hunter 1958, Photoelectric Color Difference Meter, JOSA 48(12):985
 * @wiki {@link https://en.wikipedia.org/wiki/Hunter_Lab}
 * @year 1958
 * @by Richard S. Hunter
 * @use Surface-color QC in paints, plastics, textiles and food; still specified in some industry standards.
 * @channel {L} 0 100 Lightness
 * @channel {a} -75 115 Green-Red axis
 * @channel {b} -210 60 Blue-Yellow axis
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */

// Implementation notes:
// L = 100·√(Y/Yn); a = Ka·(X/Xn − Y/Yn)/√(Y/Yn); b = Kb·(Y/Yn − Z/Zn)/√(Y/Yn), on this
// library's D65 white, so the white maps to (100, 0, 0). Ka = 175·√(Xn/98.043),
// Kb = 70·√(Zn/118.115): the 1967 scaling of the illuminant-C originals 175 and 70
// (colour-science 0.4.7 XYZ_to_K_ab_HunterLab1966, after HunterLab's "Illuminant Factors
// in Universal Software and EasyMatch Coatings", 2008), giving 172.304 and 67.216 here;
// HunterLab tabulates 172.30 and 67.20 for its D65 white (95.02, 100, 108.82). Ka = 175,
// Kb = 70 belong to illuminant C only. Dates: HunterLab KA-06216 gives Rd,a,b 1943,
// L,a,b 1958, Ka/Kb 1967; the space is often dated 1948, after Hunter's first
// photoelectric color-difference meter papers.
import xyz from './xyz.js';

export const Xn = 95.04559270516717, Yn = 100, Zn = 108.90577507598783;
export const Ka = 175 * Math.sqrt(Xn / 98.043), Kb = 70 * Math.sqrt(Zn / 118.115);

const labh = {
	name: 'labh',
	range: [[0, 100], [-75, 115], [-210, 60]]
};

labh.xyz = (L, a, b) => {
	const r = L / 100, Y = r * r * Yn;
	return [(a * r / Ka + r * r) * Xn, Y, (r * r - b * r / Kb) * Zn];
};

xyz.labh = (X, Y, Z) => {
	const r = Math.sqrt(Y / Yn);
	if (r === 0) return [0, 0, 0];
	return [100 * r, Ka * (X / Xn - Y / Yn) / r, Kb * (Y / Yn - Z / Zn) / r];
};

export default labh;
