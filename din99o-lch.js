/**
 * DIN99o LCh color space
 *
 * Cylindrical (polar) form of DIN99o Lab. Defined relative to din99o-lab;
 * everything else is reached by chaining through it.
 *
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 51.484 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @illuminant D65
 * @observer 2
 */
import din99oLab from './din99o-lab.js';

const din99oLch = {
	name: 'din99o-lch',
	range: [[0, 100], [0, 51.484], [0, 360]]
};

// DIN99o LCh -> DIN99o Lab (polar -> cartesian)
din99oLch[din99oLab.name] = (l, c, h) => {
	const hRad = (h / 180) * Math.PI;
	return [l, c * Math.cos(hRad), c * Math.sin(hRad)];
};

// DIN99o Lab -> DIN99o LCh (cartesian -> polar)
din99oLab[din99oLch.name] = (l, a, b) => {
	const c = Math.sqrt(a * a + b * b);
	const h = Math.atan2(b, a) * (180 / Math.PI);
	return [l, c, h >= 0 ? h : h + 360];
};

export default din99oLch;
