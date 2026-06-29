/**
 * HCT color space (Hue, Chroma, Tone)
 *
 * Material Design's color system based on CAM16
 * Uses tone (perceptual lightness) instead of lightness
 *
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {C} 0 150 Chroma
 * @channel {T} 0 100 Tone (perceptual lightness)
 */
import xyz from './xyz.js';
import { toCam16, fromCam16, viewingConditions } from './cam16.js';

// I'll assume I can duplicate constrain or update cam16.js.
// I'll update cam16.js to export constrain first if needed.
// Actually allow me to update cam16.js to export constrain?
// Whatever, I'll just duplicate it locally. It's simple.

const constrainLocal = (h) => {
	let r = h % 360;
	if (r < 0) r += 360;
	return r;
};

const eps = 216 / 24389;
const kappa = 24389 / 27;

function toLstar(y) {
	// Y (0-100) to L* (0-100)
	y = y / 100; // normalize to 0-1
	const fy = y > eps ? Math.cbrt(y) : (kappa * y + 16) / 116;
	return 116.0 * fy - 16.0;
}

function fromLstar(l) {
	// L* (0-100) to Y (0-100)
	const y01 = l > 8 ? Math.pow((l + 16) / 116, 3) : l / kappa;
	return y01 * 100;
}

const hct = {
	name: 'hct',
	channel: ['h', 'c', 't'],
	range: [[0, 360], [0, 150], [0, 100]]
};

xyz.hct = (x, y, z) => {
	const t = toLstar(y);
	if (t === 0) return [0, 0, 0];
	const cam = toCam16([x, y, z], viewingConditions);
	return [constrainLocal(cam.h), cam.C, t];
}

hct.xyz = (h, c, t) => {
	if (t === 0) return [0, 0, 0];
	const y = fromLstar(t);

	let j;
	if (t > 0) {
		j = 0.00379058511492914 * t * t + 0.608983189401032 * t + 0.9155088574762233;
	} else {
		j = 9.514440756550361e-6 * t * t + 0.08693057439788597 * t - 21.928975842194614;
	}

	let xyzRes;
	let attempt = 0;
	let last = Infinity;
	let best = j;
	const threshold = 2e-12;
	const max_attempts = 15;

	while (attempt <= max_attempts) {
		xyzRes = fromCam16({ J: j, C: c, h: h }, viewingConditions);
		const delta = Math.abs(xyzRes[1] - y);
		if (delta < last) {
			if (delta <= threshold) {
				return xyzRes;
			}
			best = j;
			last = delta;
		}
		// Newton step
		if (xyzRes[1] === 0) break; // Avoid div by zero?
		j = j - ((xyzRes[1] - y) * j) / (2 * xyzRes[1]);
		attempt++;
	}

	return fromCam16({ J: best, C: c, h: h }, viewingConditions);
}

export default hct;
