/**
 * ADX16 – Academy Density Exchange at 16 bits per channel, the form SMPTE ST 2065-3 recommends:
 * ADX10's printing-density metric in six more bits, four of precision and two of range: the
 * film base at 1520 and 8000 codes per unit of red density (ADX16 = 16 × ADX10, exactly). Its
 * codes reach 8 of red density above the base, room for the negative and internegative stocks
 * that, the standard notes, exceed ADX10's 1.856. The Academy's input transform to ACES2065-1
 * is ADX10's after the code scaling.
 *
 * @see {@link https://pub.smpte.org/doc/st2065-3/20200909-pub/st2065-3-2020.pdf}
 * @see {@link https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/ADX/ACEScsc.Academy.ADX16_to_ACES.ctl}
 * @wiki {@link https://en.wikipedia.org/wiki/Academy_Color_Encoding_System}
 * @year 2008
 * @by Academy (AMPAS)
 * @use Scanned film negatives entering ACES as 16-bit files, the standard's preferred form.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// ST 2065-3:2020 Eq. 1: ADX16 = round(w·(APD − APD_Dmin)·8000 + 1520), w = 1.00, 0.92, 0.95,
// clamped to 0..65535; Eq. 3: ADX16 = 16·ADX10. Carried here as code/65535 floats, unrounded.
// ACES2065-1 by ACEScsc.Academy.ADX16_to_ACES.ctl (aces-dev v1.3): cdd = (code − 1520)/8000,
// then the steps of ADX10's CTL, identical constants (adx10.js). 18% grey: 7120/65535 → 0.18,
// the code the CTL's REF_PT names. OpenColorIO 2.6's ADX16_to_ACES2065-1 caps exposure at the
// half-float maximum 65504, reached near density 3.76 (code 31600 of 65535 on the neutral axis);
// above that it and this file part ways, below it they agree to 4e-6.
import aces2065 from './aces2065-1.js';
import { fromDensity, toDensity } from './adx10.js';

const adx16 = { name: 'adx16', range: [[0, 1], [0, 1], [0, 1]] };

adx16['aces2065-1'] = (r, g, b) => fromDensity((r * 65535 - 1520) / 8000, (g * 65535 - 1520) / 8000, (b * 65535 - 1520) / 8000);
aces2065.adx16 = (r, g, b) => toDensity(r, g, b).map(d => (d * 8000 + 1520) / 65535);

export default adx16;
