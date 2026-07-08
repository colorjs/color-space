/**
 * Mi-Log — Xiaomi's log profile for the 14 Ultra and 15 Ultra smartphones, giving
 * their cameras a flatter image with more grading latitude than the phones'
 * standard color modes. Its curve follows the same quadratic-toe-plus-log2 shape as
 * Apple Log, tuned with Xiaomi's own constants, and is recorded in a BT.2020 color
 * container like other smartphone log formats.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_MiLog.html}
 * @year 2024
 * @by Xiaomi
 * @use Log video profile for Xiaomi 14 Ultra/15 Ultra smartphone cameras; current flagship-camera grading feature.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// 18% grey → 0.4535.
import rec2020Linear from './rec2020-linear.js';

const milog = { name: 'milog', range: [[0, 1], [0, 1], [0, 1]] };

const R0 = -0.09023729, Rt = 0.01974185, c = 18.10531998, be = 0.01384578, ga = 0.09271529, de = 0.67291850;
const Pt = c * (Rt - R0) ** 2;
const enc = R => R < R0 ? 0 : R < Rt ? c * (R - R0) ** 2 : ga * Math.log2(R + be) + de;
const dec = P => P < 0 ? R0 : P < Pt ? Math.sqrt(P / c) + R0 : Math.pow(2, (P - de) / ga) - be;

milog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.milog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default milog;
