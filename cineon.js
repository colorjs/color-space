/**
 * Cineon — Kodak's printing-density log encoding from the early 1990s, created for
 * the Cineon film-scanning and digital-intermediate system that first let film labs
 * work with scanned negatives digitally instead of on an optical printer. Its
 * 10-bit log curve maps negative density directly to code values, with reference
 * black and white points chosen to mirror film stock's response. It has no gamut of
 * its own — scanned imagery inherited whatever primaries the film stock and scanner
 * implied — and it survives today mainly through the DPX file format it gave rise to.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Cineon.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Cineon#Cineon_file_format}
 * @year 1992
 * @by Kodak
 * @use Film-scanning/digital-intermediate log encoding; historical, survives mainly through the DPX file format it originated.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
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
