/**
 * F-Log2 C — Fujifilm's F-Log2 curve recorded on F-Gamut C, a wider gamut than the
 * BT.2020-matched F-Gamut that F-Log and F-Log2 use. Fujifilm's data sheet states the
 * curve is identical to F-Log2, so 0%, 18% and 90% reflectance still land on 10-bit
 * codes 95, 400 and 570; only the primaries change. F-Gamut C's red sits on ACES AP0
 * red, and its green and blue lie outside the spectral locus, so the gamut encloses
 * BT.2020. Fujifilm added it to the X-H2, X-H2S and GFX100 II by firmware.
 *
 * @see {@link https://dl.fujifilm-x.com/support/lut/F-Log2C_DataSheet_E_Ver.1.0.pdf}
 * @year 2024
 * @by Fujifilm
 * @use F-Log2 recording on the wider F-Gamut C primaries; added to X-H2, X-H2S and GFX100 II by firmware in November 2024.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Fujifilm "F-Log2 C Data Sheet" Ver.1.0 (2024-11): curve constants identical to
// F-Log2 (see flog2.js), 18% grey → 400/1023 = 0.3910. F-Gamut C primaries
// R(0.7347, 0.2653) G(0.0263, 0.9737) B(0.1173, -0.0224), white D65; the matrix
// equals colour-science 0.4.7 RGB_COLOURSPACES['F-Gamut C'].matrix_RGB_to_XYZ.
import xyz from './xyz.js';
import { enc, dec } from './flog2.js';
import { mat3, inv3 } from '../util.js';

const flog2c = { name: 'flog2c', range: [[0, 1], [0, 1], [0, 1]] };

// F-Gamut C linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.7892749677891812, 0.020040229879954023, 0.14114072938253647,
	0.2850070082407373, 0.7419456971144955, -0.026952705355232878,
	0, 0, 1.0890577507598784
];
const MI = inv3(M);

flog2c.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.flog2c = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default flog2c;
