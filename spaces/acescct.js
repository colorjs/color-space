/**
 * ACEScct — the Academy Color Encoding System's other grading space, sharing
 * ACEScg's AP1 primaries and ACEScc's log2 curve but adding a linear toe near black.
 * That toe keeps traditional lift/gamma/gain color-corrector controls behaving the
 * way colorists expect instead of exaggerating noise in the shadows, which is why
 * ACEScct is generally preferred over ACEScc on control surfaces built for legacy
 * grading tools.
 *
 * @see {@link https://docs.acescentral.com/encodings/acescct/}
 * @wiki {@link https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACEScc_&_ACEScct}
 * @year 2016
 * @by Academy (AMPAS)
 * @use Log2-with-toe color-grading working space in ACES post-production; current default ACES grading space.
 * @channel {R} -0.358 1.468 Red
 * @channel {G} -0.358 1.468 Green
 * @channel {B} -0.358 1.468 Blue
 * @method transfer
 * @encoding log
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
