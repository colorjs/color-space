/**
 * ACESproxy color space
 *
 * The Academy's on-set transport encoding (S-2013-001): AP1 linear light mapped to
 * 10-bit legal-range code values — CV = round((log2(lin) + 2.5)·50 + 425) clamped to
 * [64, 940] — expressed here as CV/1023 floats. Rounding to integral code values is
 * part of the standard (it rides SDI cables), so round-trips quantise to ~1/100 stop.
 * Not for storage or compositing — use ACEScc/ACEScct. 18% grey → 426/1023 ≈ 0.4164.
 *
 * @see {@link https://docs.acescentral.com/specifications/acesproxy/}
 * @channel {R} 0.0626 0.9189 Red (ACESproxy)
 * @channel {G} 0.0626 0.9189 Green (ACESproxy)
 * @channel {B} 0.0626 0.9189 Blue (ACESproxy)
 * @illuminant D60
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import acescg from './acescg.js';

const acesproxy = { name: 'acesproxy', range: [[0.0626, 0.9189], [0.0626, 0.9189], [0.0626, 0.9189]] };

const enc = x => (x <= Math.pow(2, -9.72) ? 64 : Math.max(64, Math.min(940, Math.round((Math.log2(x) + 2.5) * 50 + 425)))) / 1023;
const dec = v => Math.pow(2, (v * 1023 - 425) / 50 - 2.5);

acesproxy.acescg = (r, g, b) => [dec(r), dec(g), dec(b)];
acescg.acesproxy = (r, g, b) => [enc(r), enc(g), enc(b)];

export default acesproxy;
