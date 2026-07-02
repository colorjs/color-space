/**
 * Leica L-Log color space
 *
 * Leica's L-Log (SL2-S onward): linear toe below 0.006 then c·log10(d·x+e)+f,
 * recorded in a BT.2020 container per the L-Log reference manual — so a transfer
 * over `rec2020-linear`, like `nlog`. 18% grey → 0.4353.
 *
 * @see {@link https://leica-camera.com/sites/default/files/2021-11/L-Log_Reference_Manual_EN.pdf}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import rec2020Linear from './rec2020-linear.js';

const llog = { name: 'llog', range: [[0, 1], [0, 1], [0, 1]] };

const cut1 = 0.006, cut2 = 0.1380, a = 8, b = 0.09, c = 0.27, d = 1.3, e = 0.0115, f = 0.6;
const enc = x => x <= cut1 ? a * x + b : c * Math.log10(d * x + e) + f;
const dec = y => y <= cut2 ? (y - b) / a : (Math.pow(10, (y - f) / c) - e) / d;

llog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.llog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default llog;
