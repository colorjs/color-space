/**
 * Panalog color space
 *
 * Panavision's Genesis-era Cineon-style log (black 64 / white 681 over 10 bits,
 * gain 444), per channel over linear-light RGB. No published native gamut — a
 * transfer over `lrgb` (linear sRGB), like `cineon`. 18% grey → 0.3746.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Panalog.html}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @referred scene
 * @dynamic hdr
 */
import lrgb from './lrgb.js';

const panalog = { name: 'panalog', range: [[0, 1], [0, 1], [0, 1]] };

const bo = Math.pow(10, (64 - 681) / 444);
const enc = x => (681 + 444 * Math.log10(x * (1 - bo) + bo)) / 1023;
const dec = y => (Math.pow(10, (1023 * y - 681) / 444) - bo) / (1 - bo);

lrgb.panalog = (r, g, b) => [enc(r), enc(g), enc(b)];
panalog.lrgb = (r, g, b) => [dec(r), dec(g), dec(b)];

export default panalog;
