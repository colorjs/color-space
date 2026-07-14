/**
 * The Ohta color space, introduced by Yu-Ichi Ohta, Takeo Kanade and Toshiyuki Sakai
 * in 1980, decorrelates RGB into three opponent channels — an intensity channel and
 * two chroma channels — chosen empirically to approximate the Karhunen-Loève
 * transform (the statistically optimal decorrelation) of typical natural images,
 * rather than being derived from any display or broadcast standard. Because it is a
 * simple, exact and invertible linear transform of RGB, it is cheap to compute in
 * both directions while still concentrating most of an image's variance into a
 * single channel. It has been used widely in computer-vision segmentation tasks —
 * isolating vegetation, fruit, flames, and skin regions — where that decorrelation
 * makes thresholding more reliable than working directly in RGB.
 *
 * @see {@link https://doi.org/10.1016/0146-664X(80)90047-7} Ohta, Kanade & Sakai 1980
 * @year 1980
 * @by Ohta, Kanade & Sakai
 * @use Decorrelated RGB for computer-vision segmentation (vegetation, skin, flame); niche, still referenced in CV literature.
 * @channel {I1} 0 255 Intensity/3
 * @channel {I2} -128 128 Opponent/2
 * @channel {I3} -128 128 Opponent/4
 * @method opponent
 * @encoding gamma
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
