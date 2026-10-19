/**
 * sRGB 2.2 display is sRGB as the standard's reference display decodes it: sRGB primaries and
 * D65 white with a pure 2.2 power and no linear toe. IEC 61966-2-1 characterizes its reference
 * display by that exponent and writes the piecewise curve, toe included, as the encoding.
 * Decoding with 2.2 renders shadows darker than the piecewise inverse does: signal 0.1 gives
 * 0.63 % of white instead of 1.00 %.
 *
 * @see {@link https://webstore.iec.ch/publication/6169} IEC 61966-2-1:1999, Introduction and 4.1
 * @see {@link https://personalpages.manchester.ac.uk/staff/d.h.foster/Tutorial_HSI2RGB/IEC_61966-2-1.pdf} IEC/4WD 61966-2-1 (1998), 2.1 eq. (1)
 * @wiki {@link https://en.wikipedia.org/wiki/SRGB}
 * @year 1999
 * @by IEC (TC 100)
 * @use What a display calibrated to a 2.2 power shows for sRGB-encoded values.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut srgb
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// IEC 61966-2-1:1999 Introduction: the three major factors of sRGB are "the colorimetric RGB
// definition, the simple exponent value of 2,2, and the well-defined viewing conditions". The
// last public draft (IEC/4WD 61966-2-1, 100/PT61966(PL)34, 1998-05-28) §2.1 lists "Display
// input/output characteristic (R, G, and B) 2,2" and "Display model Offset 0,0" and writes
// V_sRGB = (V′_sRGB + 0,0)^2,2 (eq. 1); its §3.1 says the linear toe "is integrated into the
// encoding specification to optimise encoding implementations". In the 1999 standard the
// reference display sits in 4.1, which is not public; the ICC's sRGB registry page (Holm)
// reads it as "Approximately 2.2", with the piecewise curve as the precise transfer function.
// Sign-extended past 0–1 like the neighbours. Linear light is lrgb.
import lrgb from './lrgb.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const rgbDisplay = {
	name: 'rgb-display',
	range: [[0, 1], [0, 1], [0, 1]]
};

rgbDisplay.lrgb = (r, g, b) => [gammaDecode(r, 2.2), gammaDecode(g, 2.2), gammaDecode(b, 2.2)];
lrgb['rgb-display'] = (r, g, b) => [gammaEncode(r, 2.2), gammaEncode(g, 2.2), gammaEncode(b, 2.2)];

export default rgbDisplay;
