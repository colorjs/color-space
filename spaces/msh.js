/**
 * Msh is Kenneth Moreland's 2009 spherical form of CIELAB, introduced to design
 * smooth diverging color maps for scientific visualization. M is the length of the
 * (L*, a*, b*) vector, s the angle away from the L* axis (saturation) and h the hue
 * angle in the a*b* plane. Interpolating linearly in Msh, with s driven to 0 at the
 * midpoint, gives diverging maps whose lightness peaks smoothly at a near-white
 * center; the cool-to-warm map built this way replaced the rainbow as ParaView's
 * default in 2008 (release 3.4).
 *
 * @see {@link https://doi.org/10.1007/978-3-642-10520-3_9} Moreland, ISVC 2009, LNCS 5876
 * @year 2009
 * @by Kenneth Moreland
 * @use Scientific visualization, as in ParaView and VTK's cool-to-warm map.
 * @channel {M} 0 150 Magnitude
 * @channel {s} 0 1.5707963267948966 Saturation angle in radians
 * @channel {h} 0 6.283185307179586 Hue angle in radians
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Moreland, "Diverging Color Maps for Scientific Visualization (Expanded)", §4.2 Eq. (10),
// https://www.kennethmoreland.com/color-maps/ColorMapsExpanded.pdf:
// M = √(L*² + a*² + b*²), s = arccos(L*/M), h = arctan(b*/a*);
// inverse L* = M·cos s, a* = M·sin s·cos h, b* = M·sin s·sin h. CIELAB on a D65 white
// (§5, text above Table 1; coloraide 8.13 Msh BASE = 'lab-d65'). s and h stay in
// radians as in the paper's control points (red 80, 1.08, 0.5) and in coloraide.
// s is computed as atan2(C, L*), equal to arccos(L*/M) for M > 0 but exact near the
// L* axis where arccos loses half its digits. h wraps to [0, 2π) (coloraide's h % 2π);
// achromatic hue → 0 below chroma 1e-8, as util.js cartToPolar.
// Negative L* (non-physical) gives s > π/2 and still inverts exactly; coloraide signs M
// instead, so the two differ only there.
// Channel ranges: s spans [0, π/2] for L* ≥ 0 (sRGB reaches 1.522, dark blue), h a full
// turn; M reaches 148.5 on the sRGB cube (green), 150 rounded outward.
import labD65 from './lab-d65.js';

const msh = {
	name: 'msh',
	range: [[0, 150], [0, Math.PI / 2], [0, 2 * Math.PI]]
};

// CIELab (D65) -> Msh
labD65[msh.name] = (L, a, b) => {
	const C = Math.sqrt(a * a + b * b);
	const M = Math.sqrt(L * L + C * C);
	if (M === 0) return [0, 0, 0];
	const h = C < 1e-8 ? 0 : Math.atan2(b, a);
	return [M, Math.atan2(C, L), h < 0 ? h + 2 * Math.PI : h];
};

// Msh -> CIELab (D65)
msh[labD65.name] = (M, s, h) => {
	const C = M * Math.sin(s);
	return [M * Math.cos(s), C * Math.cos(h), C * Math.sin(h)];
};

export default msh;
