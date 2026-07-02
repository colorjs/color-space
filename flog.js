/**
 * Fujifilm F-Log / F-Gamut color space
 *
 * Fujifilm's F-Log curve (linear toe + log highlight) over F-Gamut, whose primaries
 * are exactly ITU-R BT.2020 — so this is a transfer over the existing `rec2020-linear`.
 * 18% grey → 0.4593.
 *
 * @see {@link https://dl.fujifilm-x.com/support/lut/F-Log_DataSheet_E_Ver.1.1.pdf}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import rec2020Linear from './rec2020-linear.js';

const flog = { name: 'flog', range: [[0, 1], [0, 1], [0, 1]] };

const c1 = 0.00089, a = 0.555556, b = 0.009468, c = 0.344676, d = 0.790453, e = 8.735631, f = 0.092864, c2 = 0.100537775223865;
const enc = x => x < c1 ? e * x + f : c * Math.log10(a * x + b) + d;
const dec = y => y < c2 ? (y - f) / e : (Math.pow(10, (y - d) / c) - b) / a;

flog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.flog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default flog;
