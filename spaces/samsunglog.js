/**
 * Samsung Log — Samsung's log profile for Galaxy phones, introduced with the Galaxy
 * S25 series in January 2025 and specified in Samsung's 2025 white paper. Two log10
 * segments meet at 1% reflectance: below it a mirrored segment bends the toe into an
 * S-shape that keeps more shadow gradation, above it the main segment carries the
 * highlights to the white limit at scene 12.0, about 6 stops over middle grey. The
 * signal sits in a BT.2020 container with a D65 white; 18% grey lands at 0.5279,
 * 10-bit code 540.
 *
 * @see {@link https://developer.samsung.com/mobile/samsung-log-video.html}
 * @year 2025
 * @by Samsung
 * @use Log video on Galaxy phones (S25 series, S24 series via One UI 7) for grading with Samsung's Rec.709 LUT.
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
// Samsung Log White Paper (2025), "Samsung Log transfer function": forward
// y = α1·log10(x + β1) + γ1 (x ≥ xt), α2·log10(−x + β2) + γ2 (x0 ≤ x < xt), 0 (x < x0);
// inverse x = 10^((y − γ1)/α1) − β1 (y ≥ yt), β2 − 10^((y − γ2)/α2) (0 ≤ y < yt),
// x0 (y < 0); xt 0.01, x0 −0.05, yt 0.206561909, α1 0.258984868, β1 0.0003645,
// γ1 0.720504856, α2 −0.20942, β2 0.016904, γ2 −0.24597. Above y = 1 the formula
// runs on (no clamp); below code 0 the decode holds at x0, as the paper specifies.
// Table 1: 0 → 0.125124 (128), 0.01 → 0.206562 (211), 0.18 → 0.527859 (540),
// 0.90 → 0.708700 (725), 12.0 → 1.0 (1023). Table 2: ITU-R BT.2020-2 primaries, D65.
// Samsung's "Samsung Log to Linear 1DLUT v1.0" (4096 entries) equals this inverse to
// 5.5e-13 at every entry but the last, which the file writes as exactly 12.0 where the
// formula gives 12.0000123. The segments meet 3.6e-6 apart at xt and 3.8e-6 above 0
// at x0 — the paper's rounding, inherited as written.
import rec2020Linear from './rec2020-linear.js';

const samsunglog = { name: 'samsunglog', range: [[0, 1], [0, 1], [0, 1]] };

const xt = 0.01, x0 = -0.05, yt = 0.206561909;
const a1 = 0.258984868, b1 = 0.0003645, g1 = 0.720504856;
const a2 = -0.20942, b2 = 0.016904, g2 = -0.24597;
const enc = x => x >= xt ? a1 * Math.log10(x + b1) + g1 : x >= x0 ? a2 * Math.log10(b2 - x) + g2 : 0;
const dec = y => y >= yt ? Math.pow(10, (y - g1) / a1) - b1 : y >= 0 ? b2 - Math.pow(10, (y - g2) / a2) : x0;

samsunglog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.samsunglog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default samsunglog;
