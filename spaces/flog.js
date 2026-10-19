/**
 * F-Log — Fujifilm's log curve, introduced with the X-T2 in 2016 over HDMI only and recorded
 * in-camera from the X-H1 in 2018. Firmware then brought internal F-Log to the X-T2 and other
 * X-series and GFX cameras. A linear toe in the shadows and a logarithmic highlight rolloff
 * extend recordable dynamic range for grading. It is defined over F-Gamut, whose primaries
 * match ITU-R BT.2020.
 *
 * @see {@link https://dl.fujifilm-x.com/support/lut/F-Log_DataSheet_E_Ver.1.1.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2016
 * @by Fujifilm
 * @use The standard log on Fujifilm bodies that lack F-Log2.
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
// 18% grey → 0.4593.
import rec2020Linear from './rec2020-linear.js';

const flog = { name: 'flog', range: [[0, 1], [0, 1], [0, 1]] };

const c1 = 0.00089, a = 0.555556, b = 0.009468, c = 0.344676, d = 0.790453, e = 8.735631, f = 0.092864, c2 = 0.100537775223865;
const enc = x => x < c1 ? e * x + f : c * Math.log10(a * x + b) + d;
const dec = y => y < c2 ? (y - f) / e : (Math.pow(10, (y - d) / c) - b) / a;

flog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.flog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default flog;
