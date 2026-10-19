/**
 * Rec. 2100 Linear — the linear-light RGB of ITU-R BT.2100 before either HDR curve is applied:
 * display light under PQ, scene light under HLG. It has Rec. 2020's wide primaries and white
 * point, with headroom above reference white for specular highlights.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2100}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._2100}
 * @year 2016
 * @by ITU-R
 * @use Linear-light HDR grading and gamut mapping, beneath Rec. 2100's PQ (display light) and HLG (scene light).
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut rec2020
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Implementation notes:
// BT.2100 shares BT.2020's primaries, white point, and matrix exactly, so in value this
// is identical to rec2020-linear; the distinction is semantic (1.0 = 203 cd/m² HDR
// reference white, with values above 1.0 valid for specular highlights).
import rec2020Linear from './rec2020-linear.js';

const rec2100Linear = {
	name: 'rec2100-linear',
	range: [[0, 1], [0, 1], [0, 1]]
	// no fixed range: linear HDR is unbounded above (1.0 = 203 cd/m² reference white,
	// specular highlights exceed it) — matching its twin rec2020-linear
};

rec2100Linear[rec2020Linear.name] = (r, g, b) => [r, g, b];
rec2020Linear[rec2100Linear.name] = (r, g, b) => [r, g, b];

export default rec2100Linear;
