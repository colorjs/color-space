/**
 * Display P3 Linear color space
 *
 * Linear variant of DCI-P3 (Apple Display P3)
 * Without gamma correction, used for image processing
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-display-p3}
 * @channel {R} 0 1 Red (linear)
 * @channel {G} 0 1 Green (linear)
 * @channel {B} 0 1 Blue (linear)
 * @illuminant D65
 * @observer 2
 */
import xyz from './xyz.js';

const p3Linear = {
	name: 'p3-linear'
};

p3Linear.xyz = (r, g, b) => {
	// Matrix: P3 Linear -> XYZ (D65)
	// P3 Linear: 0-1, XYZ: 0-100
	const x = r * 0.4865709486482162 + g * 0.26566769316909306 + b * 0.1982172852343625;
	const y = r * 0.2289745640697488 + g * 0.6917385218365064 + b * 0.079286914093745;
	const z = r * 0.0000000000000000 + g * 0.04511338185890264 + b * 1.043944368900976;
	return [x * 100, y * 100, z * 100];
}

xyz[p3Linear.name] = (x, y, z) => {
	// Matrix: XYZ (D65) -> P3 Linear
	// XYZ: 0-100, P3 Linear: 0-1
	x /= 100; y /= 100; z /= 100;
	const r = x * 2.493496911941425 + y * -0.9313836179191239 + z * -0.40271078445071684;
	const g = x * -0.8294889695615747 + y * 1.7626640603183463 + z * 0.023624685841943577;
	const b = x * 0.03584583024378447 + y * -0.07617238926804182 + z * 0.9568845240076872;
	return [r, g, b];
}

export default p3Linear;
