/**
 * scRGB — a linear-light extension of sRGB standardized as IEC 61966-2-2, created to
 * carry wide-gamut and HDR signals through an otherwise ordinary sRGB pipeline. It
 * keeps sRGB's D65 white point and primaries but removes the gamma curve and widens
 * the encoding range well beyond the usual 0-1 span, allowing values for colors
 * brighter or more saturated than standard sRGB can display.
 *
 * @see {@link https://en.wikipedia.org/wiki/ScRGB}
 * @channel {R} -0.5 7.4998779296875 Red
 * @channel {G} -0.5 7.4998779296875 Green
 * @channel {B} -0.5 7.4998779296875 Blue
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
