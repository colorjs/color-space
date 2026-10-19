/**
 * Rec. 2020 display is Rec. 2020 as a reference monitor shows it: BT.2020 primaries and D65
 * white, decoded by the ITU-R BT.1886 reference EOTF with zero black level and unit gain, a
 * pure 2.4 power over the extended range. CSS Color 4 defines color(rec2020 …) this way.
 * rec2020 keeps the BT.2020 camera curve, so the same three numbers name different colors in
 * the two spaces.
 *
 * @see {@link https://drafts.csswg.org/css-color-4/#predefined-rec2020} CSS Color 4 §10.8
 * @see {@link https://www.itu.int/rec/R-REC-BT.1886} ITU-R BT.1886 (03/2011) Annex 1
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020} ITU-R BT.2020-2 (10/2015), Table 4 note
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._2020}
 * @year 2011
 * @by ITU-R; W3C CSS WG
 * @use CSS color(rec2020 …); display-referred UHD video on a BT.1886 monitor.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut rec2020
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// BT.1886 Annex 1 with Lb = 0, Lw = 1 (a = 1, b = 0): L = V^2.4. CSS Color 4 sample code
// lin_2020 / gam_2020 (ED 2026-10-09 §19): sign·|V|^2.4 and sign·|L|^(1/2.4), "defined over the
// extended range, not clamped"; colorjs.io 0.7.1 and coloraide 8.13 rec2020 are the same.
// Linear light is rec2020-linear.
import rec2020Linear from './rec2020-linear.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const rec2020Display = {
	name: 'rec2020-display',
	range: [[0, 1], [0, 1], [0, 1]]
};

rec2020Display['rec2020-linear'] = (r, g, b) => [gammaDecode(r, 2.4), gammaDecode(g, 2.4), gammaDecode(b, 2.4)];
rec2020Linear['rec2020-display'] = (r, g, b) => [gammaEncode(r, 2.4), gammaEncode(g, 2.4), gammaEncode(b, 2.4)];

export default rec2020Display;
