/**
 * sRGB — the standard RGB color space created by HP and Microsoft in 1996 and later
 * standardized as IEC 61966-2-1. It defines a D65 white point and a piecewise
 * gamma-like transfer curve tuned to typical display response. It became the default
 * color space of the web and of untagged digital images, and remains the assumed
 * gamut for ordinary displays, browsers and image formats today.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#numeric-srgb}
 * @wiki {@link https://en.wikipedia.org/wiki/SRGB}
 * @year 1996
 * @by HP & Microsoft
 * @use Default RGB space of the web and untagged images (sRGB); current, dominant consumer-display standard.
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
