/**
 * GP-Log2 — GoPro's log profile for its MISSION 1 series cameras, documented by
 * GoPro Labs in 2026. Like Protune it is a single pure-log curve, but with log base
 * 600 instead of 113, packing up to 14 stops into a 10-bit signal over Rec.2020
 * primaries. Its linear domain is normalized to the clip point, not to diffuse
 * white: linear 1.0 is clipped white, and the camera meters 18% grey to 0.0517
 * (code 0.5416, about 554 of 1023), keeping about 1.8 stops of highlight headroom.
 *
 * @see {@link https://gopro.github.io/labs/log/}
 * @year 2026
 * @by GoPro
 * @use Log profile for GoPro MISSION 1 series cameras; graded with GoPro Labs' GP-Log2 LUT generator.
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
// GoPro Labs "GP-Log2 & Logarithmic Exposure" (docs/log) and the LUT generator source
// (docs/gplog2, LOGBASE = 600): v = ln(599·L + 1)/ln(600), L = (600^v − 1)/599, on
// Rec.2020 primaries. Linear 1.0 = clip; 18% grey = L 0.0517 → 0.5416. GoPro's LUT
// generator restores mid grey with a default +1.8 EV gain (0.0517 · 2^1.8 ≈ 0.18);
// this space keeps GoPro's own linear (the generator at EV 0), so a linear 0.18
// encodes to 0.7331. Negative linear mirrors, as in the generator's logEnc; the
// decode mirrors too, so it stays logEnc's exact inverse below code 0.
import rec2020Linear from './rec2020-linear.js';

const gplog2 = { name: 'gplog2', range: [[0, 1], [0, 1], [0, 1]] };

const enc = x => Math.sign(x) * Math.log1p(Math.abs(x) * 599) / Math.log(600);
const dec = y => Math.sign(y) * (Math.pow(600, Math.abs(y)) - 1) / 599;

gplog2['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.gplog2 = (r, g, b) => [enc(r), enc(g), enc(b)];

export default gplog2;
