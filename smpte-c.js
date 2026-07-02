/**
 * SMPTE-C is the RGB primary set standardized by the Society of Motion Picture and
 * Television Engineers (SMPTE 170M) for 525-line NTSC broadcast in North America and
 * Japan. It replaced the original 1953 FCC/NTSC primaries with phosphors that were
 * actually achievable by contemporary picture tubes, paired with a D65 white point.
 * As an RGB working space it shares its transfer curve with Rec. 709/BT.601 video,
 * and remains the reference gamut for describing legacy analog NTSC color.
 *
 * @see {@link https://en.wikipedia.org/wiki/SMPTE_C}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';
import { bt709Encode as encode, bt709Decode as decode } from './transfers.js';

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
