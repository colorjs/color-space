/**
 * Panalog — the log curve for the Panavision Genesis, a digital cinema camera
 * developed jointly with Sony and released in 2005. Modeled on Kodak's Cineon
 * printing-density curve with its own black and white reference points, it let
 * Genesis footage slot into film-style, Cineon-based post pipelines, much like
 * RED's REDLogFilm did later for RED footage. Panavision never published a native
 * color gamut for the format, so it's handled here as a curve over linear RGB
 * rather than a distinct primaries set.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Panalog.html}
 * @year 2005
 * @by Panavision / Sony
 * @use Log curve for the Panavision Genesis digital cinema camera; legacy/historical.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Black 64 / white 681 over 10 bits, gain 444. 18% grey → 0.3746.
import lrgb from './lrgb.js';

const panalog = { name: 'panalog', range: [[0, 1], [0, 1], [0, 1]] };

const bo = Math.pow(10, (64 - 681) / 444);
const enc = x => (681 + 444 * Math.log10(x * (1 - bo) + bo)) / 1023;
const dec = y => (Math.pow(10, (1023 * y - 681) / 444) - bo) / (1 - bo);

lrgb.panalog = (r, g, b) => [enc(r), enc(g), enc(b)];
panalog.lrgb = (r, g, b) => [dec(r), dec(g), dec(b)];

export default panalog;
