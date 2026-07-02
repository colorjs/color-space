/**
 * Cineon color space
 *
 * Kodak Cineon printing-density log (the classic film-scan/DPX encoding, SMPTE 268M),
 * applied per channel over linear-light RGB. Reference black 95 / white 685 over a
 * 10-bit range; 18% grey encodes to 0.4573. No gamut of its own — a transfer over
 * `lrgb` (linear sRGB).
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Cineon.html}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @referred scene
 * @dynamic sdr
 */
import lrgb from './lrgb.js';

const cineon = { name: 'cineon', range: [[0, 1], [0, 1], [0, 1]] };

const bo = Math.pow(10, (95 - 685) / 300); // black offset, 10-bit black=95 / white=685
const enc = x => (685 + 300 * Math.log10(x * (1 - bo) + bo)) / 1023;
const dec = y => (Math.pow(10, (1023 * y - 685) / 300) - bo) / (1 - bo);

lrgb.cineon = (r, g, b) => [enc(r), enc(g), enc(b)];
cineon.lrgb = (r, g, b) => [dec(r), dec(g), dec(b)];

export default cineon;
