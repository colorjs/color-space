/**
 * Grayscale color space
 *
 * Achromatic colors without hue or saturation
 * Used for monochrome displays and images
 *
 * @channel {gray} 0 1 Gray value
 */
import rgb from './rgb.js';

const gray = {
	name: 'gray'
}

/**
 * Gray to RGB - all channels get the same value
 * Gray: 0-1, RGB: 0-255
 */
gray.rgb = (g) => [g * 255, g * 255, g * 255];

/**
 * RGB to Gray using luminance formula (Rec. 709)
 * https://en.wikipedia.org/wiki/Grayscale#Colorimetric_(perceptual_luminance-preserving)_conversion_to_grayscale
 * RGB: 0-255, Gray: 0-1
 */
rgb.gray = (r, g, b) => [(0.2126 * r + 0.7152 * g + 0.0722 * b) / 255];

export default gray;
