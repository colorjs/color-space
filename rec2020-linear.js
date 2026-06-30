/**
 * Rec. 2020 Linear color space
 *
 * Linear variant of ITU-R Rec. 2020 (UHDTV/4K standard)
 * Without gamma correction for image processing
 *
 * @channel {R} 0 1 Red (linear)
 * @channel {G} 0 1 Green (linear)
 * @channel {B} 0 1 Blue (linear)
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';

const rec2020Linear = {
	name: 'rec2020-linear'
};

rec2020Linear.xyz = (r, g, b) => {
	// Rec2020 Linear: 0-1, XYZ: 0-100
	const x = r * 0.6369580483012914 + g * 0.14461690358620832 + b * 0.1688809751641721;
	const y = r * 0.2627002120112671 + g * 0.6779980715188708 + b * 0.05930171646986196;
	const z = r * 0.0000000000000000 + g * 0.028072693049087428 + b * 1.060985057710791;
	return [x * 100, y * 100, z * 100];
}

xyz[rec2020Linear.name] = (x, y, z) => {
	// XYZ: 0-100, Rec2020 Linear: 0-1
	x /= 100; y /= 100; z /= 100;
	const r = x * 1.716651187971268 + y * -0.355670783776392 + z * -0.253366281373660;
	const g = x * -0.666684351832489 + y * 1.616481236634939 + z * 0.0157685458139111;
	const b = x * 0.017639857445311 + y * -0.042770613257809 + z * 0.942103121235474;
	return [r, g, b];
}

export default rec2020Linear;
