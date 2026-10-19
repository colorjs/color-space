/**
 * sRGB — the standard RGB color space HP and Microsoft created in 1996, later standardized as
 * IEC 61966-2-1. It has a D65 white point and a piecewise, gamma-like curve tuned to typical
 * displays.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#numeric-srgb}
 * @wiki {@link https://en.wikipedia.org/wiki/SRGB}
 * @year 1996
 * @by HP & Microsoft
 * @use The web and untagged images; the dominant consumer-display standard.
 * @channel {R} 0 255 Red
 * @channel {G} 0 255 Green
 * @channel {B} 0 255 Blue
 * @method transfer
 * @encoding gamma
 * @gamut srgb
 * @illuminant D65
 * @referred display
 * @dynamic sdr
 */
const rgb = {
	name: 'rgb',
	range: [[0, 255], [0, 255], [0, 255]],
};

export default rgb;
