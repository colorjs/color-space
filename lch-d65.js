/**
 * LCh (D65) color space
 *
 * Cylindrical (polar) form of lab-d65 — intuitive hue/chroma with the D65 white
 * point. For the CSS/ICC D50 LCh, use `lchab`.
 *
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 150 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @illuminant D65
 * @observer 2
 */
import labD65 from './lab-d65.js';

const lchD65 = {
	name: 'lch-d65',
	range: [[0, 100], [0, 150], [0, 360]]
};

// LCh -> Lab (D65)
lchD65[labD65.name] = (l, c, h) => {
	const hr = h / 360 * 2 * Math.PI;
	return [l, c * Math.cos(hr), c * Math.sin(hr)];
};

// Lab (D65) -> LCh
labD65[lchD65.name] = (l, a, b) => {
	const c = Math.sqrt(a * a + b * b);
	// achromatic: hue undefined -> 0
	const h = c === 0 ? 0 : Math.atan2(b, a) * 180 / Math.PI;
	return [l, c, h >= 0 ? h : h + 360];
};

export default lchD65;
