/**
 * scRGB — a linear-light extension of sRGB, standardized as IEC 61966-2-2, that carries
 * wide-gamut and HDR signals through an ordinary sRGB pipeline. It keeps sRGB's primaries and
 * D65 white, drops the gamma curve and allows values far outside 0–1, for colors brighter or
 * more saturated than sRGB can show.
 *
 * @see {@link https://webstore.iec.ch/publication/6171} IEC 61966-2-2:2003
 * @wiki {@link https://en.wikipedia.org/wiki/ScRGB}
 * @year 2003
 * @by IEC
 * @use Linear-light HDR; Windows composes its HDR desktop in FP16 scRGB.
 * @channel {R} -0.5 7.4998779296875 Red
 * @channel {G} -0.5 7.4998779296875 Green
 * @channel {B} -0.5 7.4998779296875 Blue
 * @method transfer
 * @encoding linear
 * @gamut srgb
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
