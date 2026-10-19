/**
 * N-Log — Nikon's log curve, introduced with the Z6 and Z7 mirrorless cameras in 2018 and
 * carried across the rest of the Z series. It pairs a cube-root shadow toe with a natural-log
 * highlight region, unlike the log10 curves common elsewhere. Its gamut, N-Gamut, has the
 * primaries of ITU-R BT.2020.
 *
 * @see {@link https://download.nikonimglib.com/archive3/hDCmK00m9JDI03RPruD74xpoU905/N-Log_Specification_(En)01.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2018
 * @by Nikon
 * @use Video on Nikon Z-series mirrorless cameras.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut rec2020
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Constants are exact rationals (650/1023, …). 18% grey → 0.3637.
import rec2020Linear from './rec2020-linear.js';

const nlog = { name: 'nlog', range: [[0, 1], [0, 1], [0, 1]] };

const c1 = 0.328, c2 = 452 / 1023, a = 650 / 1023, b = 0.0075, c = 150 / 1023, d = 619 / 1023;
const enc = x => x < c1 ? a * Math.cbrt(x + b) : c * Math.log(x) + d;
const dec = y => { if (y < c2) { const t = y / a; return t * t * t - b } return Math.exp((y - d) / c) };

nlog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.nlog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default nlog;
