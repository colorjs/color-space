/**
 * Insta360 I-Log — Insta360's log profile, here in the 10-bit container curve of
 * its June 2026 white paper (revision 2026.05.20). A log10 curve rises from a short
 * linear toe and holds scene reflectance from black to 2200%, about 7 stops over
 * middle grey, on BT.2020 primaries with a D65 white. 0% lands at 0.0906 (10-bit
 * code 93) and 18% grey at 0.4220 (code 432). The paper's version history shows the
 * curve has changed: an initial version in 2024, a new transfer function for the
 * 10-bit container in July 2025, and a bug fix before the final release.
 *
 * @see {@link https://www.insta360.com/download/i-log}
 * @see {@link https://onlinemanual.insta360.com/lunaultra/en-us/operation-tutorials/shooting-preview/shooting-specs/i-log}
 * @year 2026
 * @by Insta360
 * @use Log profile for Insta360's 10-bit I-Log cameras (X6, Luna Ultra); graded with Insta360's official I-Log LUTs.
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
// Insta360 I-Log White Paper (June 2026; version history 2024.09.20 init, 2025.07.07
// "new transfer function for 10 bit container", 2026.05.20 "bug fix before final
// release"). This is the 2026.05.20 curve; the earlier versions' constants are not
// in the paper and are not reproduced here. Encode: δ + η·log10(x + θ) for x > τ
// (0.01104854), α·x + β otherwise; decode (y − β)/α below 0.154402, else
// 10^((y − δ)/η) − θ; α 5.77837328, β 0.09055934, δ 0.623992, η 0.280055, θ 0.01.
// Table: 0% → 0.0905593 (93), 18% → 0.422003 (432), 2200% → 1.0 (1023). Gamut:
// ITU-R BT.2020 primaries, white (0.3127, 0.329). The segments meet to 2.5e-9; the
// linear toe runs on below 0 (code 0 decodes to −0.0157), no clamp.
// Insta360's X6 I-Log LUTs (v2, dated 2026.05.20) are display renderings, not a
// scaled scene: the PQ (1000 nit, 203 nit diffuse white) LUT puts the 18% code at
// 26.7 nit (ITU-R BT.2408's 26 nit grey reference) and scene 1.0 at 181 nit, not 203,
// and rolls highlights off to 852 nit at code 1.0 – so they can't anchor this curve.
import rec2020Linear from './rec2020-linear.js';

const ilog = { name: 'ilog', range: [[0, 1], [0, 1], [0, 1]] };

const A = 5.77837328, B = 0.09055934, D = 0.623992, E = 0.280055, T = 0.01;
const enc = x => x > 0.01104854 ? D + E * Math.log10(x + T) : A * x + B;
const dec = y => y < 0.154402 ? (y - B) / A : Math.pow(10, (y - D) / E) - T;

ilog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.ilog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default ilog;
