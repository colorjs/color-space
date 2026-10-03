/**
 * KineLOG3 — Kinefinity's log curve, introduced in September 2025, modelled on
 * negative-film scanning: a log10 curve with a short linear segment below a small
 * negative cut. It encodes Kinefinity Wide Gamut, the native gamut of the MAVO
 * Edge 6K and MM2 LF, whose primaries all lie outside the spectral locus (green at
 * y = 1.148, blue below zero). 18% grey lands at 0.3919, the spec's 39.2 IRE, and
 * 90% reflectance at 0.5722.
 *
 * @see {@link https://kinefinity.com/kinelog3-technical-specifications}
 * @year 2025
 * @by Kinefinity
 * @use Log curve for Kinefinity cinema cameras on Kinefinity Wide Gamut (MAVO Edge 6K, MM2 LF); introduced September 2025.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Kinefinity "KineLog3 Technical Specifications" (2025-09-24, revised page):
// Y = log10(a·x + 1)·b·c + d (x ≥ cut), (x − cut)/s below; a 66.64, b 0.296,
// c 0.907136, d 0.092864, cut −0.008239, s 0.017178. Code 1.0 decodes to 35.85.
// Kinefinity Wide Gamut, revised spec: R(0.7571, 0.2282) G(0.2139, 1.1480)
// B(0.0536, −0.2236), white D65. An earlier copy of the page, same date, prints
// blue y −0.2282 with matrices that don't match it; the revised −0.2236 agrees with
// all three published 4-decimal matrices to 5e-5, so M is the primaries' exact NPM.
// Green y = 1.148 is a virtual primary (z < 0), as are red (x past the locus's
// 0.7347) and blue (y < 0). The spec's "0% → IRE 0.09" is a typo: d = 0.092864 is
// 9.29 IRE (18% → 39.19, 90% → 57.22 match its 39.2 and 57.2).
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const kinelog3 = { name: 'kinelog3', range: [[0, 1], [0, 1], [0, 1]] };

const a = 66.64, b = 0.296, c = 0.907136, d = 0.092864, cut = -0.008239, s = 0.017178;
const enc = x => x >= cut ? Math.log10(a * x + 1) * b * c + d : (x - cut) / s;
const dec = y => y >= 0 ? (Math.pow(10, (y - d) / b / c) - 1) / a : y * s + cut;

// Kinefinity Wide Gamut linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.6879169670679012, 0.19791836478086558, 0.06462059520290471,
	0.20734731460163125, 1.0622266609089932, -0.2695739755106249,
	0.013356728854706327, -0.3348604778597252, 1.4105614997648976
];
const MI = inv3(M);

kinelog3.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.kinelog3 = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default kinelog3;
