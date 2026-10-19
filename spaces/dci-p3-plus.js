/**
 * DCI-P3+ – an expanded color gamut Canon added to the EOS C500 cinema camera's RAW
 * development in a 2013 firmware update, wider than DCI-P3 but sharing its DCI white point
 * (x 0.314, y 0.351). Its blue primary lies below the spectral locus (y −0.09), so part of
 * its code range encodes no real color; Canon's Cinema Gamut, added in the same update, is
 * wider still. Here it carries DCI-P3's pure gamma 2.6, as colour-science defines it, with
 * the DCI white Bradford-adapted to D65 as in dci-p3.js.
 *
 * @see {@link https://github.com/colour-science/colour/blob/v0.4.7/colour/models/rgb/datasets/dci_p3.py} colour-science 0.4.7, RGB_COLOURSPACE_DCI_P3_P
 * @wiki {@link https://en.wikipedia.org/wiki/DCI-P3}
 * @year 2013
 * @by Canon
 * @use RAW development target; niche.
 * @aka DCI-P3-P
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut dci-p3-plus
 * @illuminant DCI
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.74, 0.27) G(0.22, 0.78) B(0.09, -0.09), white DCI (0.314, 0.351), gamma 2.6:
// colour-science 0.4.7 RGB_COLOURSPACES['DCI-P3-P'] (citing Canon's 2014 EOS C500 firmware
// page) and Wikipedia's DCI-P3 table agree; no Canon document printing the primaries was
// found. Canon's 2013-09-04 firmware release (canon.ca) confirms the gamut, the shared DCI-P3
// white and that Cinema Gamut is wider. The 2.6 gamma is colour-science's pairing (DCI-P3's
// RP 431-2 curve); in camera Canon pairs the gamut with Canon Log.
// M = Bradford(DCI -> D65 white, xyz.js bradfordAdaptation) x normalized primary matrix
// (SMPTE RP 177), the construction dci-p3.js uses; MI = inv3(M).
import xyz, { bradfordAdaptation } from './xyz.js';
import { mat3, mul3, inv3 } from '../math.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const dciP3Plus = { name: 'dci-p3-plus', range: [[0, 1], [0, 1], [0, 1]] };

// white XYZ (Y = 1) from CIE 1931 xy
const white = (x, y) => [x / y, 1, (1 - x - y) / y];

// linear DCI-P3+ -> XYZ, DCI white (Y 0..1)
const MDCI = [
	0.5590735550249721, 0.2489359493408076, 0.08657739022111492,
	0.20398629710370608, 0.8825910931174088, -0.08657739022111492,
	-0.007555048040878009, 0, 0.9619710024568324
];
const M = mul3(bradfordAdaptation(white(0.314, 0.351), white(0.3127, 0.3290)), MDCI), MI = inv3(M);
const dec = v => gammaDecode(v, 2.6), enc = v => gammaEncode(v, 2.6);

dciP3Plus.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz['dci-p3-plus'] = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default dciP3Plus;
