/**
 * OPPO O-Log color space
 *
 * OPPO's O-Log profile (Find X8 Ultra era) — a pure natural-log curve
 * P = 0.139·ln(R + 0.019) + 0.614 — recorded in a BT.2020 container, so a transfer
 * over `rec2020-linear`. 18% grey → 0.3896.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_OPPOOLog.html}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import rec2020Linear from './rec2020-linear.js';

const olog = { name: 'olog', range: [[0, 1], [0, 1], [0, 1]] };

const ga = 0.139, be = 0.019, de = 0.614;
const enc = R => ga * Math.log(R + be) + de;
const dec = P => Math.exp((P - de) / ga) - be;

olog['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.olog = (r, g, b) => [enc(r), enc(g), enc(b)];

export default olog;
