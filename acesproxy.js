/**
 * ACESproxy — the Academy's on-set monitoring and preview encoding, built to carry
 * AP1 linear-light images as 10-bit legal-range code values over standard SDI video
 * cables during production. It's a coarse, quantized encoding meant for on-set color
 * decisions, dailies, and viewfinder-style preview — not for storage, compositing, or
 * final grading, where ACEScc or ACEScct take over once footage reaches post.
 *
 * @see {@link https://docs.acescentral.com/encodings/acesproxy/}
 * @wiki {@link https://en.wikipedia.org/wiki/Academy_Color_Encoding_System}
 * @year 2013
 * @by Academy (AMPAS)
 * @use On-set monitoring and dailies preview encoding over SDI video; current but narrow-purpose, not used for storage or final grading.
 * @channel {R} 0.0626 0.9189 Red
 * @channel {G} 0.0626 0.9189 Green
 * @channel {B} 0.0626 0.9189 Blue
 * @illuminant D60
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// ACES spec S-2013-001. CV = round((log2(lin) + 2.5)·50 + 425) clamped to [64, 940],
// expressed here as CV/1023 floats. Rounding to integral code values is part of the
// standard (it rides SDI cables), so round-trips quantise to ~1/100 stop.
// 18% grey → 426/1023 ≈ 0.4164.
import acescg from './acescg.js';

const acesproxy = { name: 'acesproxy', range: [[0.0626, 0.9189], [0.0626, 0.9189], [0.0626, 0.9189]] };

const enc = x => (x <= Math.pow(2, -9.72) ? 64 : Math.max(64, Math.min(940, Math.round((Math.log2(x) + 2.5) * 50 + 425)))) / 1023;
const dec = v => Math.pow(2, (v * 1023 - 425) / 50 - 2.5);

acesproxy.acescg = (r, g, b) => [dec(r), dec(g), dec(b)];
acescg.acesproxy = (r, g, b) => [enc(r), enc(g), enc(b)];

export default acesproxy;
