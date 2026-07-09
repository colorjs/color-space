/**
 * Canon Log — Canon's first cinema log gamma, introduced with the EOS C300 in 2011
 * to extend the dynamic range Cinema EOS cameras could capture ahead of grading. Its
 * curve is symmetric around black, encoding a bit of below-black signal rather than
 * clipping at zero. In this library it pairs with Canon's wide Cinema Gamut
 * primaries, the same matrix shared with the later Canon Log 2 and Canon Log 3
 * curves.
 *
 * @see {@link https://downloads.canon.com/nw/learn/white-papers/cinema-eos/white-paper-canon-log-gamma-curves.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2011
 * @by Canon
 * @use Cinema EOS camera log capture; largely superseded by Canon Log 2/3 but still supported for compatibility.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// v1.2 constants. ÷0.9 reflection convention. 18% grey → 0.3434.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const clog = { name: 'clog', range: [[0, 1], [0, 1], [0, 1]] };

const a = 0.45310179, s = 10.1596, o = 0.12512248;
const enc = x => { const xn = x / 0.9; return xn >= 0 ? a * Math.log10(s * xn + 1) + o : -(a * Math.log10(1 - s * xn) - o); };
const dec = y => (y >= o ? (Math.pow(10, (y - o) / a) - 1) / s : -(Math.pow(10, (o - y) / a) - 1) / s) * 0.9;

// Cinema Gamut linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.716049646551520, 0.129683477875740, 0.104722802624412,
	0.261261357525555, 0.869642145754960, -0.130903503280514,
	-0.009676346575021, -0.236481636126349, 1.335215733461248
];
const MI = inv3(M);

clog.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.clog = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default clog;
