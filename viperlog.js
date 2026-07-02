/**
 * ViperLog color space
 *
 * The Thomson Viper FilmStream log — a pure log10 with no black offset (the flaw its
 * successors fixed): y = (1023 + 500·log10(x))/1023, per channel over linear-light
 * RGB (`lrgb`). Linear input clamps at 10^(−1023/500) ≈ 0.0090 — the value that
 * encodes to code 0 — so black round-trips to that floor. 18% grey → 0.6360.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_ViperLog.html}
 * @channel {R} 0 1 Red (ViperLog)
 * @channel {G} 0 1 Green (ViperLog)
 * @channel {B} 0 1 Blue (ViperLog)
 * @referred scene
 * @dynamic hdr
 */
import lrgb from './lrgb.js';

const viperlog = { name: 'viperlog', range: [[0, 1], [0, 1], [0, 1]] };

const floor = Math.pow(10, -1023 / 500); // encodes to exactly 0
const enc = x => (1023 + 500 * Math.log10(Math.max(x, floor))) / 1023;
const dec = y => Math.pow(10, (1023 * y - 1023) / 500);

lrgb.viperlog = (r, g, b) => [enc(r), enc(g), enc(b)];
viperlog.lrgb = (r, g, b) => [dec(r), dec(g), dec(b)];

export default viperlog;
