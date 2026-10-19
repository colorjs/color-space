/**
 * Rec. 709 display is Rec. 709 as a studio reference monitor shows it: BT.709 primaries and
 * D65 white, decoded by the ITU-R BT.1886 reference EOTF with zero black level and unit gain,
 * which leaves a pure 2.4 power. rec709 carries the camera curve instead; BT.709 itself names
 * BT.1886 as the reference monitor's decoding, and the two curves are not inverses, so the same
 * code values name different light in the two spaces.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.1886} ITU-R BT.1886 (03/2011) Annex 1
 * @see {@link https://www.itu.int/rec/R-REC-BT.709} ITU-R BT.709-6 (06/2015), Table item 1.2 note
 * @wiki {@link https://en.wikipedia.org/wiki/ITU-R_BT.1886}
 * @year 2011
 * @by ITU-R
 * @use Display-referred HD video: what a BT.1886 monitor emits for Rec. 709 code values.
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
// BT.1886 Annex 1: L = a·max(V + b, 0)^γ, γ = 2.40, a = (Lw^(1/γ) − Lb^(1/γ))^γ,
// b = Lb^(1/γ)/(Lw^(1/γ) − Lb^(1/γ)). Relative light with Lb = 0, Lw = 1 gives a = 1, b = 0:
// L = V^2.4. Extended past 0–1 sign-symmetrically (BT.1886 clamps V + b at 0), as CSS Color 4
// does for rec2020 and coloraide 8.13 does for its rec709. BT.709 shares sRGB's primaries and
// white, so linear light is lrgb.
import lrgb from './lrgb.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const rec709Display = {
	name: 'rec709-display',
	range: [[0, 1], [0, 1], [0, 1]]
};

rec709Display.lrgb = (r, g, b) => [gammaDecode(r, 2.4), gammaDecode(g, 2.4), gammaDecode(b, 2.4)];
lrgb['rec709-display'] = (r, g, b) => [gammaEncode(r, 2.4), gammaEncode(g, 2.4), gammaEncode(b, 2.4)];

export default rec709Display;
