/**
 * scRGB color space
 *
 * Linear-light sRGB (same primaries and D65 white as sRGB/lrgb) with the extended
 * IEC 61966-2-2 range [-0.5, 61439/8192] for wide-gamut and HDR signals. In float
 * the values are identical to linear sRGB — only the declared range differs.
 *
 * @see {@link https://en.wikipedia.org/wiki/ScRGB}
 * @channel {R} -0.5 7.4998779296875 Red (linear)
 * @channel {G} -0.5 7.4998779296875 Green (linear)
 * @channel {B} -0.5 7.4998779296875 Blue (linear)
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import lrgb from './lrgb.js';

const scrgb = {
	name: 'scrgb',
	range: [[-0.5, 7.4998779296875], [-0.5, 7.4998779296875], [-0.5, 7.4998779296875]]
};

scrgb.lrgb = (r, g, b) => [r, g, b];
lrgb.scrgb = (r, g, b) => [r, g, b];

export default scrgb;
