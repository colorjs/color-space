/**
 * GP-Log2 — GoPro's log profile for its MISSION 1 series cameras, documented by
 * GoPro Labs in 2026. Like Protune it is a single pure-log curve, but with log base
 * 600 instead of 113, packing up to 14 stops into a 10-bit signal over Rec.2020
 * primaries. The camera meters 18% grey to code 0.5416 (about 554 of 1023) and
 * clips about 1.8 stops above diffuse white.
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
// Rec.2020 primaries, where GoPro's L is normalized to the clip point (L 1.0 = clip,
// 18% grey = L 0.0517 → 0.5416). Like every log here, this space speaks SCENE linear –
// 0.18 is middle grey – so L carries the generator's own default exposure gain, +1.8 EV:
// scene = 2^1.8 · L (0.18 → L 0.05169 → 0.5416, clip at scene 3.48). Without it a
// GP-Log2 → display LUT would render GoPro's metered grey 1.8 stops dark. Negative
// linear mirrors, as in the generator's logEnc; the decode mirrors too.
import rec2020Linear from './rec2020-linear.js';

const gplog2 = { name: 'gplog2', range: [[0, 1], [0, 1], [0, 1]] };

const G = 2 ** 1.8   // the GoPro LUT generator's default exposure gain: GoPro linear → scene linear
const enc = x => Math.sign(x) * Math.log1p(Math.abs(x) / G * 599) / Math.log(600);
const dec = y => Math.sign(y) * (Math.pow(600, Math.abs(y)) - 1) / 599 * G;

gplog2['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.gplog2 = (r, g, b) => [enc(r), enc(g), enc(b)];

export default gplog2;
