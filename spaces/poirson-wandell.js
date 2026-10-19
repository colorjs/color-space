/**
 * Poirson–Wandell opponent space is the pattern-color-separable space of Allen Poirson and
 * Brian Wandell (1993): one luminance and two chromatic channels, linear in cone or XYZ
 * coordinates, fitted so that the perceived color of a pattern and its spatial form separate.
 * S-CIELAB (Zhang and Wandell, 1996) blurs an image in it with one spatial kernel per channel
 * before converting to CIELAB. The channels are not normalized to a white: D65 has small
 * chromatic values.
 *
 * @see {@link https://doi.org/10.1364/JOSAA.10.002458} Poirson & Wandell 1993, JOSA A 10(12):2458-2470
 * @see {@link https://github.com/ISET/isetcam/blob/17146a9f0470cc89b58d583851f680187268506d/metrics/scielab/cmatrix.m} Zhang's S-CIELAB cmatrix.m, 'xyz2opp'
 * @see {@link https://doi.org/10.1002/col.10195} Johnson & Fairchild 2003, Color Res. Appl. 28(6), eq. 1
 * @year 1993
 * @by Poirson & Wandell
 * @use S-CIELAB and other spatial color-difference metrics: filter here, then go to CIELAB.
 * @channel {O1} 0 87.1 Luminance
 * @channel {O2} -12.2 7 Red-green
 * @channel {O3} -41.2 45 Blue-yellow
 * @method opponent
 * @encoding linear
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// XYZ (CIE 1931 2°) -> O1 O2 O3: Xuemei Zhang's S-CIELAB cmatrix.m (3/11/96, last modified
// 1/22/98), 'xyz2opp', spacetype 2, as ISETCam carries it (also colorTransformMatrix.m, which
// returns the transpose for row vectors). Johnson & Fairchild 2003 eq. 1 prints the same matrix
// to 3 decimals with two misprints: 0.297 for 0.2787 (O1·X) and −0.077 for +0.0772 (O2·Z).
// Poirson & Wandell's cone matrix (lms2opp, also in cmatrix.m) times Smith–Pokorny cones with a
// least-squares scale per cone reproduces all nine code entries within 0.007 and gives O1·X 0.282,
// O2·Z +0.081. O2 is positive toward green, O3 toward blue.
// Inverse derived. Linear, so the XYZ scale passes through (hub XYZ, Y 0–100). Ranges: the sRGB
// cube's extent.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const poirsonWandell = { name: 'poirson-wandell', range: [[0, 87.1], [-12.2, 7], [-41.2, 45]] };

const M = [
	0.2787336, 0.7218031, -0.1065520,
	-0.4487736, 0.2898056, 0.0771569,
	0.0859513, -0.5899859, 0.5011089
];
const MI = inv3(M);

xyz['poirson-wandell'] = (x, y, z) => mat3(M, x, y, z);
poirsonWandell.xyz = (o1, o2, o3) => mat3(MI, o1, o2, o3);

export default poirsonWandell;
