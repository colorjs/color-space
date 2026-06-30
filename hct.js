/**
 * HCT color space (Hue, Chroma, Tone)
 *
 * Material Design's color system based on CAM16
 * Uses tone (perceptual lightness) instead of lightness
 *
 * @see {@link https://material.io/blog/science-of-color-design}
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {C} 0 145 Chroma
 * @channel {T} 0 100 Tone (perceptual lightness)
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { toCam16, fromCam16, environment, constrain } from './cam16.js';

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

// HCT viewing conditions (Material Design / colorjs.io) — distinct from cam16's:
// precise D65, La = 200/π·Y(L*=50), Yb = Y(L*=50), average surround, no discounting.
// https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/viewing_conditions.ts
const Y50 = fromLstar(50); // ≈ 18.4187 (0-100)
const hctViewingConditions = environment(
	[0.9504559270516716, 1.0, 1.0890577507598784],
	(200 / Math.PI) * Y50 / 100, // La ≈ 11.7257 cd/m²
	Y50,                          // Yb ≈ 18.4187
	'average', false
);

const hct = {
	name: 'hct',
	range: [[0, 360], [0, 145], [0, 100]]
};

xyz.hct = (x, y, z) => {
	const t = toLstar(y);
	if (t === 0) return [0, 0, 0];
	const cam = toCam16([x, y, z], hctViewingConditions);
	return [constrain(cam.h), cam.C, t];
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
		xyzRes = fromCam16({ J: j, C: c, h: h }, hctViewingConditions);
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

	return fromCam16({ J: best, C: c, h: h }, hctViewingConditions);
}

export default hct;
