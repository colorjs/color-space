/**
 * Fujifilm F-Log2 / F-Gamut color space
 *
 * F-Log2 (~14 stops, a shallower log than F-Log) over F-Gamut = ITU-R BT.2020
 * primaries, so a transfer over `rec2020-linear`. 18% grey → 0.3910.
 *
 * @see {@link https://dl.fujifilm-x.com/support/lut/F-Log2_DataSheet_E_Ver.1.0.pdf}
 * @channel {R} 0 1 Red (F-Log2)
 * @channel {G} 0 1 Green (F-Log2)
 * @channel {B} 0 1 Blue (F-Log2)
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import rec2020Linear from './rec2020-linear.js';

const flog2 = { name: 'flog2', range: [[0, 1], [0, 1], [0, 1]] };

const c1 = 0.000889, a = 5.555556, b = 0.064829, c = 0.245281, d = 0.384316, e = 8.799461, f = 0.092864, c2 = 0.100686685370811;
const enc = x => x < c1 ? e * x + f : c * Math.log10(a * x + b) + d;
const dec = y => y < c2 ? (y - f) / e : (Math.pow(10, (y - d) / c) - b) / a;

flog2['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.flog2 = (r, g, b) => [enc(r), enc(g), enc(b)];

export default flog2;
