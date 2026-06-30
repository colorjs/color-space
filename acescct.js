/**
 * ACEScct color space
 *
 * ACES log encoding for colour grading (AP1 primaries, same as ACEScg) with a
 * pure-log curve plus a linear toe near black for lift/gamma/gain controls.
 * ACES spec S-2016-001. Connects to acescg (its linear form).
 *
 * @channel {R} -0.358 1.468 Red (log encoded)
 * @channel {G} -0.358 1.468 Green (log encoded)
 * @channel {B} -0.358 1.468 Blue (log encoded)
 */
import acescg from './acescg.js';

const acescct = {
	name: 'acescct'
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
