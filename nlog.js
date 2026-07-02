/**
 * Nikon N-Log / N-Gamut color space
 *
 * Nikon's N-Log — a cube-root toe (shadows) and natural-log highlight (note: ln, not
 * log10) — over N-Gamut, whose primaries are exactly ITU-R BT.2020, so a transfer over
 * `rec2020-linear`. Constants are exact rationals (650/1023, …). 18% grey → 0.3637.
 *
 * @see {@link https://download.nikonimglib.com/archive3/hDCmK00m9JDI03RPruD74xpoU905/N-Log_Specification_(En)01.pdf}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import rec2020Linear from './rec2020-linear.js';

const nlog = { name: 'nlog', range: [[0, 1], [0, 1], [0, 1]] };

const c1 = 0.328, c2 = 452 / 1023, a = 650 / 1023, b = 0.0075, c = 150 / 1023, d = 619 / 1023;
const enc = x => x < c1 ? a * Math.cbrt(x + b) : c * Math.log(x) + d;
const dec = y => y < c2 ? Math.pow(y / a, 3) - b : Math.exp((y - d) / c);

nlog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.nlog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default nlog;
