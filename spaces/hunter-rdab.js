/**
 * Hunter Rd,a,b is Richard Hunter's earliest opponent-color scale, developed in 1943
 * for illuminant C so that early analog tristimulus colorimeters could report a
 * color as reflectance plus red-green and yellow-blue values. Rd is the CIE Y value
 * itself; a and b are linear differences of normalized X, Y, Z, scaled by a factor
 * f(Y) that grows toward black to keep the dark end of the chromatic scales from
 * collapsing. It preceded Hunter L,a,b (1958) and survives in a few industries,
 * notably as a brightness reading for neutral limestone-based powders.
 *
 * @see {@link https://www.hunterlab.com/media/documents/duplicate-of-an-1016-rdab.pdf} HunterLab AN-1016
 * @year 1943
 * @by Richard S. Hunter
 * @use Single-number brightness/reflectance of neutral limestone-based powders; legacy, rarely used today.
 * @channel {Rd} 0 100 Luminance reflectance
 * @channel {a} -70 120 Green-Red axis
 * @channel {b} -260 60 Blue-Yellow axis
 * @method opponent
 * @encoding linear
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Rd = Y; a = Ka·f(Y)·(X/Xn − Y/Yn); b = Kb·f(Y)·(Y/Yn − Z/Zn);
// f(Y) = 0.51·(21 + 0.2·Y)/(1 + 0.2·Y)  (HunterLab AN-1016.01 (2012), p.3; colour-science
// 0.4.7 XYZ_to_Hunter_Rdab). AN-1016 prints the denominator as 1 + 0.21·Y; colour-science
// uses 1 + 0.2·Y, which keeps f(100) ≈ 1 (0.9957; 0.950 with 0.21). 0.2 is used here.
// White: this library's D65 (as labh.js normalizes to D65), so the white maps to a = b = 0.
// Ka, Kb for that white: Ka = 175·√(Xn/98.043), Kb = 70·√(Zn/118.115), the scaling of the
// illuminant-C originals used by colour-science XYZ_to_K_ab_HunterLab1966 (gives 172.30,
// 67.22; AN-1016 Table 1 lists 172.30, 67.20 for its D65 white 95.018, 108.824).
// Channel ranges: the sRGB cube spans a −68.7…+118.7, b −252.0…+55.5 (rounded outward);
// f(Y) ≈ 4.7 at blue's Y = 7.2 stretches its b.
import xyz from './xyz.js';

const hunterRdab = {
	name: 'hunter-rdab',
	range: [[0, 100], [-70, 120], [-260, 60]]
};

const Xn = 95.04559270516716, Yn = 100, Zn = 108.90577507598784;
const Ka = 175 * Math.sqrt(Xn / 98.043), Kb = 70 * Math.sqrt(Zn / 118.115);
const fY = (Y) => 0.51 * (21 + 0.2 * Y) / (1 + 0.2 * Y);

// XYZ (D65, 0-100) -> Hunter Rd,a,b
xyz[hunterRdab.name] = (X, Y, Z) => {
	const f = fY(Y);
	return [Y, Ka * f * (X / Xn - Y / Yn), Kb * f * (Y / Yn - Z / Zn)];
};

// Hunter Rd,a,b -> XYZ (D65, 0-100)
hunterRdab.xyz = (Rd, a, b) => {
	const f = fY(Rd);
	return [(a / (Ka * f) + Rd / Yn) * Xn, Rd, (Rd / Yn - b / (Kb * f)) * Zn];
};

export default hunterRdab;
