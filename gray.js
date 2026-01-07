/**
 * Grayscale
 * https://www.w3.org/TR/css-color-4/#grays
 *
 * @module color-space/gray
 */
import rgb from './rgb.js';

const gray = {
	name: 'gray',
	channel: ['gray'],
};

/**
 * Gray to RGB - all channels get the same value
 */
gray.rgb = (g) => [g, g, g];

/**
 * RGB to Gray using luminance formula (Rec. 709)
 * https://en.wikipedia.org/wiki/Grayscale#Colorimetric_(perceptual_luminance-preserving)_conversion_to_grayscale
 */
rgb.gray = (r, g, b) => [0.2126 * r + 0.7152 * g + 0.0722 * b];

export default gray;
