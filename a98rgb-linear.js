/**
 * Adobe RGB Linear color space
 *
 * Linear variant of Adobe RGB without gamma correction
 *
 * @see {@link https://en.wikipedia.org/wiki/Adobe_RGB_color_space}
 * @channel {R} 0 1 Red (linear)
 * @channel {G} 0 1 Green (linear)
 * @channel {B} 0 1 Blue (linear)
 * @illuminant D65
 * @observer 2
 */
import xyz from './xyz.js';

const a98Linear = {
	name: 'a98rgb-linear'
};

a98Linear.xyz = (r, g, b) => {
	// A98 RGB Linear: 0-1, XYZ: 0-100
	const x = r * 0.5766690429101305 + g * 0.1855582379065463 + b * 0.1882286462349947;
	const y = r * 0.29734497525053605 + g * 0.6273635662554661 + b * 0.07529145849399788;
	const z = r * 0.02703136138641234 + g * 0.07068885253582723 + b * 0.9913375368376388;
	return [x * 100, y * 100, z * 100];
}

xyz[a98Linear.name] = (x, y, z) => {
	// XYZ: 0-100, A98 RGB Linear: 0-1
	x /= 100; y /= 100; z /= 100;
	const r = x * 2.0415879038107465 + y * -0.5650069742788596 + z * -0.34473135077832956;
	const g = x * -0.9692436362808795 + y * 1.8759675015077202 + z * 0.04155505740717557;
	const b = x * 0.013444280632031142 + y * -0.11836239223101838 + z * 1.0151749943912054;
	return [r, g, b];
}

export default a98Linear;
