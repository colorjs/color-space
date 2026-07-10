/**
 * DIN99o LCh is the cylindrical form of DIN99o Lab, the DIN 6176 color-difference
 * space, converting its rectangular axes into chroma and hue for the same reason
 * LCh does for ordinary CIELAB — a more direct handle for adjusting saturation and
 * hue. It keeps DIN99o's central advantage: because the space is built so
 * Euclidean distance already approximates perceived difference, a simple chroma
 * or lightness difference here is a meaningful color-tolerance metric without
 * further correction formulas.
 *
 * @see {@link https://de.wikipedia.org/wiki/DIN99-Farbraum}
 * @year 2018
 * @by DIN (FNF/FNL 2 committee)
 * @use Cylindrical form of DIN99o for direct chroma/hue tolerance adjustment; current, same industrial QC domain as DIN99o Lab.
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
import { cartToPolar, polarToCart } from '../util.js';

const din99oLch = {
	name: 'din99o-lch',
	range: [[0, 100], [0, 51.484], [0, 360]]
};

// DIN99o LCh -> DIN99o Lab (polar -> cartesian)
din99oLch[din99oLab.name] = (l, c, h) => polarToCart(l, c, h);

// DIN99o Lab -> DIN99o LCh (cartesian -> polar, achromatic hue -> 0)
din99oLab[din99oLch.name] = (l, a, b) => cartToPolar(l, a, b);

export default din99oLch;
