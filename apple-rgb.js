/**
 * Apple RGB color space
 *
 * The classic Mac OS working space (~1998-2009) modelling the original Apple
 * Trinitron CRT, still selectable in Photoshop's colour settings and embedded in
 * millions of legacy files. D65 white, γ1.8 (Apple's historic default — the only
 * use of that exponent here). Matrix derived from the primaries.
 *
 * @see {@link http://www.brucelindbloom.com/WorkingSpaceInfo.html}
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
import { gammaEncode, gammaDecode } from './transfers.js';

const appleRgb = { name: 'apple-rgb', range: [[0, 1], [0, 1], [0, 1]] };

// Apple RGB (D65) -> XYZ (Y 0..1)
const M = [
	0.44966162, 0.31625612, 0.18453819,
	0.24461592, 0.67204425, 0.08333983,
	0.02518105, 0.14118577, 0.92269093
];
const MI = inv3(M);
const dec = v => gammaDecode(v, 1.8), enc = v => gammaEncode(v, 1.8);

appleRgb.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz['apple-rgb'] = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default appleRgb;
