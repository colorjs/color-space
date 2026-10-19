/**
 * DIN99o LCh is the cylindrical form of DIN99o Lab, the DIN 6176 color-difference space. As
 * LCh does for CIELAB, it trades the rectangular axes for chroma and hue, a more direct handle
 * on saturation and hue. Since DIN99o's Euclidean distance already approximates perceived
 * difference, a plain chroma or lightness difference here is a meaningful tolerance metric,
 * with no correction formulas.
 *
 * @see {@link https://de.wikipedia.org/wiki/DIN99-Farbraum}
 * @year 2018
 * @by DIN (FNF/FNL 2 committee)
 * @use Adjusting chroma and hue tolerances in industrial QC.
 * @aka DIN99b LCh
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 51.484 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import din99oLab from './din99o-lab.js';
import { cartToPolar, polarToCart } from '../math.js';

const din99oLch = {
	name: 'din99o-lch',
	range: [[0, 100], [0, 51.484], [0, 360]]
};

// DIN99o LCh -> DIN99o Lab (polar -> cartesian)
din99oLch[din99oLab.name] = (l, c, h) => polarToCart(l, c, h);

// DIN99o Lab -> DIN99o LCh (cartesian -> polar, achromatic hue -> 0)
din99oLab[din99oLch.name] = (l, a, b) => cartToPolar(l, a, b);

export default din99oLch;
