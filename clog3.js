/**
 * Canon Log 3 / Cinema Gamut color space
 *
 * Canon Log 3 (v1.2 constants) over Cinema Gamut (same matrix as `clog2`). A
 * three-piece curve — shadow log, linear midtone, highlight log — with the ÷0.9
 * reflection convention; 18% grey → 0.3434. Per-channel to scene-linear, then
 * Cinema Gamut→XYZ(D65).
 *
 * @see {@link https://downloads.canon.com/nw/learn/white-papers/cinema-eos/white-paper-canon-log-gamma-curves.pdf}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const clog3 = { name: 'clog3', range: [[0, 1], [0, 1], [0, 1]] };

const a = 0.36726845, s = 14.98325, sl = 1.9754798, li = 0.12512219, so = 0.12783901, ho = 0.12240537, lc = 0.097465473, uc = 0.15277891;
const enc = x => {
	const xn = x / 0.9;
	return xn < -0.014 ? -a * Math.log10(1 - s * xn) + so : xn <= 0.014 ? sl * xn + li : a * Math.log10(s * xn + 1) + ho;
};
const dec = y => {
	const xn = y < lc ? -(Math.pow(10, (so - y) / a) - 1) / s : y <= uc ? (y - li) / sl : (Math.pow(10, (y - ho) / a) - 1) / s;
	return xn * 0.9;
};

// Cinema Gamut linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.716049646551520, 0.129683477875740, 0.104722802624412,
	0.261261357525555, 0.869642145754960, -0.130903503280514,
	-0.009676346575021, -0.236481636126349, 1.335215733461248
];
const MI = inv3(M);

clog3.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.clog3 = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default clog3;
