/**
 * O-Log — OPPO's log profile for its Find X8 Ultra-era smartphones. Apple Log and Xiaomi's
 * Mi-Log are two-piece curves; O-Log is one pure natural-log function across the whole tonal
 * range, with no separate toe near black. It is recorded in a BT.2020 color container.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_OPPOOLog.html}
 * @year 2025
 * @by OPPO
 * @use Log video on OPPO Find X8 Ultra-era phones.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut rec2020
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// P = 0.139·ln(R + 0.019) + 0.614. 18% grey → 0.3896.
import rec2020Linear from './rec2020-linear.js';

const olog = { name: 'olog', range: [[0, 1], [0, 1], [0, 1]] };

const ga = 0.139, be = 0.019, de = 0.614;
const enc = R => ga * Math.log(R + be) + de;
const dec = P => Math.exp((P - de) / ga) - be;

olog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.olog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default olog;
