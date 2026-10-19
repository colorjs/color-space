/**
 * Cineon — Kodak's printing-density log encoding from the early 1990s, made for its Cineon
 * film-scanning and digital-intermediate system. That system was the first to let film labs
 * work on scanned negatives digitally instead of on an optical printer. Its 10-bit log curve
 * maps negative density straight to code values, with reference black and white points chosen
 * to mirror the film stock's response. It has no gamut of its own: scans inherit whatever
 * primaries the film stock and scanner imply.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Cineon.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Cineon#Cineon_file_format}
 * @year 1992
 * @by Kodak
 * @use Digital intermediates; historical, surviving mainly through the DPX format it originated.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @referred scene
 * @dynamic sdr
 */
// Implementation notes:
// SMPTE 268M. Reference black 95 / white 685 over a 10-bit range. 18% grey → 0.4573.
import lrgb from './lrgb.js';

const cineon = { name: 'cineon', range: [[0, 1], [0, 1], [0, 1]] };

const bo = Math.pow(10, (95 - 685) / 300); // black offset, 10-bit black=95 / white=685
const enc = x => (685 + 300 * Math.log10(x * (1 - bo) + bo)) / 1023;
const dec = y => (Math.pow(10, (1023 * y - 685) / 300) - bo) / (1 - bo);

lrgb.cineon = (r, g, b) => [enc(r), enc(g), enc(b)];
cineon.lrgb = (r, g, b) => [dec(r), dec(g), dec(b)];

export default cineon;
