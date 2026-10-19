/**
 * Apple Log — Apple's log profile for ProRes Log recording, introduced with the iPhone 15 Pro
 * in 2023 and integrated into Final Cut Pro's color tools. Its curve opens with a quadratic
 * toe near black, then switches to log2 for the highlights, extending recordable dynamic range
 * well beyond the phone's standard video profiles. It is defined over BT.2020 primaries; Apple
 * Log 2 later kept the curve on a wider gamut.
 *
 * @see {@link https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/apple_log_profile.py}
 * @year 2023
 * @by Apple
 * @use Cinema-oriented log capture on iPhone Pro.
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
// 18% grey → 0.4883. Spec via the public ACES CTL / colour-science; Apple's own
// white paper is developer-gated.
import rec2020Linear from './rec2020-linear.js';

const applelog = { name: 'applelog', range: [[0, 1], [0, 1], [0, 1]] };

const R0 = -0.05641088, Rt = 0.01, c = 47.28711236, be = 0.00964052, ga = 0.08550479, de = 0.69336945;
const Pt = c * (Rt - R0) ** 2;
// exported: Apple Log 2 (applelog2.js) is this same curve on Apple Wide Gamut
export const enc = R => R < R0 ? 0 : R < Rt ? c * (R - R0) ** 2 : ga * Math.log2(R + be) + de;
export const dec = P => P < 0 ? R0 : P < Pt ? Math.sqrt(P / c) + R0 : Math.pow(2, (P - de) / ga) - be;

applelog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.applelog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default applelog;
