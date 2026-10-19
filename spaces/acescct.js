/**
 * ACEScct is an ACES space for color grading. It uses ACEScg's AP1 primaries and
 * ACEScc's log2 curve, with an added linear segment near black. This segment adjusts
 * the response of shadows to lift/gamma/gain controls to suit traditional grading tools.
 *
 * @see {@link https://docs.acescentral.com/encodings/acescct/}
 * @wiki {@link https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACEScc_&_ACEScct}
 * @year 2016
 * @by Academy (AMPAS)
 * @use The default log2 color-grading space in ACES post-production.
 * @channel {R} -0.358 1.468 Red
 * @channel {G} -0.358 1.468 Green
 * @channel {B} -0.358 1.468 Blue
 * @method transfer
 * @encoding log
 * @gamut ap1
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// ACES spec S-2016-001.
import acescg from './acescg.js';

const acescct = {
	name: 'acescct',
	range: [[-0.358, 1.468], [-0.358, 1.468], [-0.358, 1.468]]
};

const log2 = (x) => Math.log(x) / Math.LN2;

// linear (ACEScg) -> ACEScct
const encode = (lin) => lin <= 0.0078125
	? 10.5402377416545 * lin + 0.0729055341958355
	: (log2(lin) + 9.72) / 17.52;

// ACEScct -> linear (ACEScg)
const decode = (cct) => cct <= 0.155251141552511
	? (cct - 0.0729055341958355) / 10.5402377416545
	: Math.pow(2, cct * 17.52 - 9.72);

acescct.acescg = (r, g, b) => [decode(r), decode(g), decode(b)];
acescg.acescct = (r, g, b) => [encode(r), encode(g), encode(b)];

export default acescct;
