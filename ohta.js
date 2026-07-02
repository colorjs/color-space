/**
 * Ohta I1I2I3 color space
 *
 * Yu-Ichi Ohta's decorrelated opponent space (1980 Kyoto thesis; Ohta, Kanade &
 * Sakai 1980), an approximate Karhunen-Loève transform of natural-image RGB used
 * widely in computer-vision segmentation (vegetation, fruit, flame, skin). An exact,
 * invertible linear transform of RGB: I1 = intensity, I2/I3 = opponent chroma.
 *
 * @see {@link https://doi.org/10.1016/0146-664X(80)90047-7} Ohta, Kanade & Sakai 1980
 * @channel {I1} 0 255 Intensity (R+G+B)/3
 * @channel {I2} -128 128 Opponent (R-B)/2
 * @channel {I3} -128 128 Opponent (2G-R-B)/4
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

const ohta = { name: 'ohta',
	range: [[0, 255], [-128, 128], [-128, 128]] };

rgb.ohta = (r, g, b) => [(r + g + b) / 3, (r - b) / 2, (2 * g - r - b) / 4];

// inverse: R = I1 + I2 - 2I3/3, G = I1 + 4I3/3, B = I1 - I2 - 2I3/3
ohta.rgb = (i1, i2, i3) => [i1 + i2 - 2 * i3 / 3, i1 + 4 * i3 / 3, i1 - i2 - 2 * i3 / 3];

export default ohta;
