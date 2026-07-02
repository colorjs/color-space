/**
 * RGB color space (sRGB)
 *
 * Standard red-green-blue color space for displays
 * Uses D65 illuminant, gamma-corrected
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#numeric-srgb}
 * @channel {R} 0 255 Red
 * @channel {G} 0 255 Green
 * @channel {B} 0 255 Blue
 * @illuminant D65
 * @referred display
 * @dynamic sdr
 */
const rgb = {
	name: 'rgb',
	range: [[0, 255], [0, 255], [0, 255]],
};

export default rgb;
