/**
 * ICtCp with the HLG transfer is the second ICtCp variant in ITU-R BT.2100: the same
 * Rec. 2020 to LMS cone matrix as PQ ICtCp, but each cone signal is coded with the
 * Hybrid Log-Gamma OETF on scene light, and the Ct and Cp rows are the PQ rows scaled
 * by about 0.55 and 0.53. It gives HLG chains ICtCp's constant-intensity chroma as an
 * alternative to Y′C′bC′r.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2100} ITU-R BT.2100-3, Table 7 (HLG column)
 * @wiki {@link https://en.wikipedia.org/wiki/ICtCp}
 * @year 2018
 * @by Dolby / ITU-R
 * @use Constant-intensity opponent coding for HLG HDR; standardized, but BT.2100 keeps NCL Y′C′bC′r as the default and reserves ICtCp for exchange by mutual agreement.
 * @channel {I} 0 1 Intensity
 * @channel {Ct} -0.5 0.5 Tritan chroma
 * @channel {Cp} -0.5 0.5 Protanopia chroma
 * @method opponent
 * @encoding hlg
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// ITU-R BT.2100-3 (02/2025) Table 7, HLG column: LMS = [1688 2146 262; 683 2951 462;
// 99 309 3688]/4096 · Rec. 2020 scene-linear RGB; L'M'S' = HLG OETF (Table 5: a =
// 0.17883277, b = 0.28466892, c = 0.55991073, Note 5c); I = (L' + M')/2, Ct = (3625L' −
// 7465M' + 3840S')/4096, Cp = (9500L' − 9212M' − 288S')/4096. colour-science labels this
// matrix 'ITU-R BT.2100-2 HLG' (2018) and the older HLG variant, which reused the PQ
// rows, 'BT.2100-1 HLG'; editions before BT.2100-3 were not reachable to confirm. Scaling mirrors rec2100-hlg.js: relative linear 1.0 (diffuse white) sits at
// HLG signal 0.75, so white is I = 0.75, Ct = Cp = 0. The OETF is transfers.js's sign-extended
// hlgEncode/hlgDecode, shared with rec2100-hlg.js. Matches colour-science
// 0.4.7 RGB_to_ICtCp(RGB·E_w, method='ITU-R BT.2100-2 HLG') to < 1e-9: colour uses the
// analytic b = 1 − 4a, c = 0.5 − a·ln(4a); this file keeps Note 5c's rounded values, as
// rec2100-hlg.js does.
import rec2020Linear from './rec2020-linear.js';
import { mat3, inv3 } from '../math.js';
import { hlgEncode, hlgDecode } from '../transfers.js';

const ictcpHlg = { name: 'ictcp-hlg', range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]] };

const M_RGB_LMS = [1688, 2146, 262, 683, 2951, 462, 99, 309, 3688].map(v => v / 4096);
const M_LMS_ICTCP = [2048, 2048, 0, 3625, -7465, 3840, 9500, -9212, -288].map(v => v / 4096);
const M_LMS_RGB = inv3(M_RGB_LMS);
const M_ICTCP_LMS = inv3(M_LMS_ICTCP);

rec2020Linear['ictcp-hlg'] = (r, g, bl) => mat3(M_LMS_ICTCP, ...mat3(M_RGB_LMS, r, g, bl).map(hlgEncode));

ictcpHlg['rec2020-linear'] = (i, ct, cp) => mat3(M_LMS_RGB, ...mat3(M_ICTCP_LMS, i, ct, cp).map(hlgDecode));

export default ictcpHlg;
