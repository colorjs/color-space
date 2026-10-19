/**
 * L-Log — Leica's log curve, first offered on the original SL (Typ 601) in 2015 and carried on
 * to the SL2, SL2-S and later SL and Q3 cameras. A short linear toe in deep shadow gives way
 * to a logarithmic response. It is recorded in a BT.2020 color container, the gamut Nikon's
 * N-Log also uses; the original SL records BT.709.
 *
 * @see {@link https://leica-camera.com/sites/default/files/pm-37826-L-Log_Reference_Manual_V1.9.pdf}
 * @year 2015
 * @by Leica
 * @use Leica SL-series video, native on the SL2-S, SL2 and SL.
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
// Linear toe below 0.006, then c·log10(d·x+e)+f. 18% grey → 0.4353.
import rec2020Linear from './rec2020-linear.js';

const llog = { name: 'llog', range: [[0, 1], [0, 1], [0, 1]] };

const cut1 = 0.006, cut2 = 0.1380, a = 8, b = 0.09, c = 0.27, d = 1.3, e = 0.0115, f = 0.6;
const enc = x => x <= cut1 ? a * x + b : c * Math.log10(d * x + e) + f;
const dec = y => y <= cut2 ? (y - b) / a : (Math.pow(10, (y - f) / c) - e) / d;

llog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.llog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default llog;
