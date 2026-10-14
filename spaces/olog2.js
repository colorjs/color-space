/**
 * O-Log2 – OPPO's second smartphone log profile, released in 2026. OPPO publishes
 * LUTs and an ACES transform for it but, as of October 2026, no white paper. Like
 * O-Log it is a single pure-log curve with no toe segment, now in base 2 rather than
 * e: scene-linear 0 encodes to 0.1199, 18% grey to 0.4879 and diffuse white to
 * 0.6942. It is recorded in a BT.2020 color container with a D65 white.
 *
 * @see {@link https://www.oppo.com/en/o-log-technical-downloads/}
 * @year 2026
 * @by OPPO
 * @use Log video profile for OPPO smartphones; graded through OPPO's O-Log2 LUTs or its ACES transform.
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
// OPPO "O-Log2 ACES Workflow" V2 (O-Log2_ACES_Workflow_Guide_ENG_V2.zip, files dated
// 2026-05-22, from the downloads page above), O-Log2_to_ACES_AP0_V2.ctl lines 4-11:
//   encode  0.0855 * log(x + 0.0096) / log(2.0) + 0.693
//   decode  exp((x - 0.693) / 0.0855 * log(2.0)) - 0.0096
// i.e. P = 0.0855·log2(R + 0.0096) + 0.693; the .dctl decodes the same way. Its matrix
// (rec2020_to_xyz, BT.2020 to 4 decimals, then CAT02 to the ACES white) fixes the
// container as BT.2020 D65. 18% grey → 0.487888, 100% → 0.694179. Linear below
// −0.0096 has no encoding (NaN), as in olog.js.
import rec2020Linear from './rec2020-linear.js';

const olog2 = { name: 'olog2', range: [[0, 1], [0, 1], [0, 1]] };

const ga = 0.0855, be = 0.0096, de = 0.693;
const enc = R => ga * Math.log2(R + be) + de;
const dec = P => 2 ** ((P - de) / ga) - be;

olog2['rec2020-linear'] = (r, g, b) => [dec(r), dec(g), dec(b)];
rec2020Linear.olog2 = (r, g, b) => [enc(r), enc(g), enc(b)];

export default olog2;
