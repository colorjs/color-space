/**
 * Log3G12 — an earlier RED Digital Cinema log curve, predating Log3G10 but sharing
 * the same REDWideGamutRGB primaries. It allocates 12 stops of range above middle
 * grey rather than Log3G10's 10, and its curve is sign-symmetric, encoding negative
 * scene-linear values continuously instead of clipping them. RED has since moved to
 * Log3G10 as its recommended acquisition curve.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Log3G12.html}
 * @year 2016
 * @by RED Digital Cinema (Graeme Nattress)
 * @use Earlier RED cinema log curve superseded by Log3G10; legacy, still decodable but no longer recommended.
 * @successor log3g10 RED settled on Log3G10 as its one recommended curve
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut rwg
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Grey (18%) encodes to exactly 1/3. Gamut: REDWideGamutRGB, matrix in rwg.js.
import xyz from './xyz.js';
import rwg from './rwg.js';

const log3g12 = { name: 'log3g12', range: [[0, 1], [0, 1], [0, 1]] };

const enc = x => Math.sign(x) * 0.184904 * Math.log10(Math.abs(x) * 347.189667 + 1);
const dec = y => Math.sign(y) * (Math.pow(10, Math.abs(y) / 0.184904) - 1) / 347.189667;

log3g12.xyz = (r, g, b) => rwg.xyz(dec(r), dec(g), dec(b));
xyz.log3g12 = (x, y, z) => xyz.rwg(x, y, z).map(enc);

export default log3g12;
