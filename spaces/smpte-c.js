/**
 * SMPTE-C is the RGB primary set the Society of Motion Picture and Television Engineers
 * standardized (SMPTE 170M) for 525-line NTSC broadcast in North America. It replaced the 1953
 * FCC/NTSC primaries with phosphors that picture tubes of the time could actually produce,
 * with a D65 white. As an RGB space it shares its transfer curve with Rec. 709 and BT.601
 * video.
 *
 * @see {@link https://ieeexplore.ieee.org/document/7289701} SMPTE RP 145-2004
 * @see {@link https://pub.smpte.org/latest/eg27/eg0027-2004_stable2010.pdf} SMPTE EG 27-2004
 * @wiki {@link https://en.wikipedia.org/wiki/NTSC#SMPTE_C}
 * @year 1987
 * @by SMPTE
 * @use NTSC broadcast in North America (RP 145); a historical analog reference.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut smpte-c
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';
import { bt709Encode as encode, bt709Decode as decode } from '../transfers.js';

const smpteC = {
	name: 'smpte-c',
	range: [[0, 1], [0, 1], [0, 1]]
};

// BT.601 OETF (identical curve to BT.709); SMPTE-C linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.39352090365939, 0.365258076717604, 0.191676946674678,
	0.212376360705067, 0.701059856925723, 0.086563782369210,
	0.018739090650447, 0.111933926736040, 0.958384733373392
];
const MI = inv3(M);

smpteC.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, decode(r), decode(g), decode(b));
	return [x * 100, y * 100, z * 100];
};

xyz[smpteC.name] = (x, y, z) => {
	const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100);
	return [encode(r), encode(g), encode(b)];
};

export default smpteC;
