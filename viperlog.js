/**
 * ViperLog — the log curve for the Thomson Viper FilmStream, one of the earliest
 * digital cinema cameras, announced in 2002, well before the tapeless RED and
 * ARRI ALEXA workflows that came to dominate the format. Its curve is a pure log10
 * function with no black offset, a simplicity that later curves from other
 * manufacturers deliberately corrected to avoid crushing near-black detail. It's
 * applied over linear-light RGB without a published native gamut of its own.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_ViperLog.html}
 * @year 2002
 * @by Thomson Grass Valley
 * @use Log curve for the Thomson Viper FilmStream, one of the earliest digital cinema cameras; legacy/historical.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// y = (1023 + 500·log10(x))/1023. Linear input clamps at 10^(−1023/500) ≈ 0.0090 —
// the value that encodes to code 0 — so black round-trips to that floor.
// 18% grey → 0.6360.
import lrgb from './lrgb.js';

const viperlog = { name: 'viperlog', range: [[0, 1], [0, 1], [0, 1]] };

const floor = Math.pow(10, -1023 / 500); // encodes to exactly 0
const enc = x => (1023 + 500 * Math.log10(Math.max(x, floor))) / 1023;
const dec = y => Math.pow(10, (1023 * y - 1023) / 500);

lrgb.viperlog = (r, g, b) => [enc(r), enc(g), enc(b)];
viperlog.lrgb = (r, g, b) => [dec(r), dec(g), dec(b)];

export default viperlog;
