/**
 * DKL — the cardinal-axis space of human color vision, proposed by Derrington, Krauskopf
 * & Lennie in 1984 from recordings of neurons in the macaque lateral geniculate nucleus.
 * Rather than an arbitrary opponent model, its three axes are the actual directions
 * early visual neurons respond along: an achromatic luminance axis, an isoluminant
 * red-green axis, and a tritan blue-yellow axis, all measured relative to an adapting
 * white. It remains a standard framework in vision science for designing stimuli that
 * isolate one cardinal mechanism at a time.
 *
 * @see {@link https://doi.org/10.1113/jphysiol.1984.sp015499} Derrington et al. 1984
 * @see {@link https://psychopy.org/general/colours.html#dkl-color-space} calibrated cardinal-axis convention
 * @year 1984
 * @by Derrington, Krauskopf & Lennie
 * @use Vision-science stimulus design isolating cardinal color mechanisms; current standard framework in that research field.
 * @channel {Lum} -1 1 Luminance contrast
 * @channel {RG} -1.7 1.7 Red-Green contrast
 * @channel {YV} -1.85 1.85 Tritan contrast
 * @method opponent
 * @encoding linear
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Cartesian cardinal coordinates, calibrated to an sRGB/D65 display. DKL is a CONTRAST
// space around an adapting background, not an absolute subtraction from display white:
// origin is 50% linear-light D65 (encoded sRGB ≈187.5), and the three basis vectors are
// luminance, isoluminant L−M, and S-(L+M). Each opponent unit is scaled until one sRGB
// gun reaches its limit, matching the conventional “fraction of maximal modulation along
// a cardinal axis” definition. Combined RGB-cube corners legitimately exceed one on an
// opponent coordinate, hence the minimal cube-covering ±1.70 / ±1.85 instrument ranges.
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const dkl = { name: 'dkl', range: [[-1, 1], [-1.7, 1.7], [-1.85, 1.85]] };

// Smith-Pokorny cone fundamentals (XYZ -> LMS) and a half-luminance D65 adaptation.
const M = [0.15514, 0.54312, -0.03286, -0.15514, 0.45684, 0.03286, 0, 0, 0.01608];
const MI = inv3(M), BG = [95.0456 / 2, 50, 108.9058 / 2];
const [L0, M0, S0] = mat3(M, ...BG);
// Convert a raw cone-opponent delta to linear sRGB and scale it until its largest
// signed gun modulation is ±.5 around the .5 background.
const cardinal = cone => { const v = mat3(MI, ...cone), lin = xyz.lrgb(...v)
	const k = 0.5 / Math.max(...lin.map(Math.abs)); return v.map(x => x * k) };
const LUM = BG, RG = cardinal([L0, -M0, 0]), YV = cardinal([0, 0, S0]);
// Columns are the three XYZ cardinal vectors.
const A = [LUM[0], RG[0], YV[0], LUM[1], RG[1], YV[1], LUM[2], RG[2], YV[2]], AI = inv3(A);

xyz.dkl = (X, Y, Z) => mat3(AI, X - BG[0], Y - BG[1], Z - BG[2]);
dkl.xyz = (Lum, RGc, YVc) => { const v = mat3(A, Lum, RGc, YVc); return v.map((x, i) => x + BG[i]) };

export default dkl;
