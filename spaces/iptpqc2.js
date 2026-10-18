/**
 * IPT-PQ-C2 is Dolby's PQ-coded form of IPT, the signal of Dolby Vision profile 5,
 * standardized as SMPTE ST 2128. Rec. 2100 linear RGB goes to LMS through a
 * Hunt-Pointer-Estévez cone matrix with 2 % crosstalk (the "C2"), each cone is PQ-coded
 * as in ICtCp, and Ebner and Fairchild's IPT matrix forms I, P and T. ST 2128 limits it
 * to consumer distribution, not mastering or production interchange.
 *
 * @see {@link https://doi.org/10.5594/SMPTE.ST2128.2026-07} SMPTE ST 2128:2026-07, Formulas (1)-(4)
 * @year 2015
 * @by Dolby / SMPTE
 * @use HDR consumer distribution in Dolby Vision profile 5 streams; current, proprietary ecosystem.
 * @channel {I} 0 1 Intensity
 * @channel {P} -0.5 0.5 Red-Green
 * @channel {T} -0.5 0.5 Yellow-Blue
 * @method opponent
 * @encoding pq
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Implementation notes:
// SMPTE ST 2128:2026-07 §6.2: LMS = [1747 2169 180; 673 3029 394; 50 207 3839]/4096 ·
// RGB (Formula 2, crosstalk premultiplied; rows sum to 4096, so D65 white gives L = M = S),
// L'M'S' = inversePQ (ST 2084, Formula 3), IPT = LMS2IPT · L'M'S' with LMS2IPT =
// [1638 1638 820; 18248 −19870 1622; 3300 1463 −4763]/4096 (Formula 1, Ebner-Fairchild
// IPT ×4096). No offsets: P, T are signed in [−0.5, 0.5] (§4.2); the +0.5 in Dolby
// Vision RPUs is signal coding. Cross-checks: Formula 2 equals ct(0.02)·HPE·BT.2020 with
// the crosstalk and HPE of Dolby's patent WO 2016/172091 A1 Eq. (1b) and libplacebo's
// 2019 dvipt_rgb2lms (commit fb30b848) to within the 1/4096 rounding. ST 2128 scales
// RGB 1.0 to 10000 cd/m² (§4.1); like ictcp.js and rec2100-pq.js, relative white 1.0 is
// placed at 203 cd/m², so white is I = pq(203) ≈ 0.58, P = T = 0. Inverses are derived.
// Year given is the patent priority date (2015-04-22). Profile 5 streams also carry per-scene
// reshaping in the RPU; this is the plain ST 2128 representation without it.
import rec2020Linear from './rec2020-linear.js';
import { mat3, inv3 } from '../math.js';
import { pqST2084Encode, pqST2084Decode } from '../transfers.js';

const iptpqc2 = { name: 'iptpqc2', range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]] };

const Yw = 203; // absolute luminance of media white, cd/m² (as ictcp.js)
const M_RGB_LMS = [1747, 2169, 180, 673, 3029, 394, 50, 207, 3839].map(v => v / 4096);
const M_LMS_IPT = [1638, 1638, 820, 18248, -19870, 1622, 3300, 1463, -4763].map(v => v / 4096);
const M_LMS_RGB = inv3(M_RGB_LMS);
const M_IPT_LMS = inv3(M_LMS_IPT);

rec2020Linear.iptpqc2 = (r, g, b) => mat3(M_LMS_IPT, ...mat3(M_RGB_LMS, r, g, b).map(v => pqST2084Encode(v * Yw)));

iptpqc2['rec2020-linear'] = (i, p, t) => mat3(M_LMS_RGB, ...mat3(M_IPT_LMS, i, p, t).map(v => pqST2084Decode(v) / Yw));

export default iptpqc2;
