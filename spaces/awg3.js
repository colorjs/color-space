/**
 * ARRI Wide Gamut 3 – the camera RGB primaries of ARRI's third color-science
 * generation, published by ARRI in 2011 as ALEXA Wide Gamut RGB and renamed ARRI Wide
 * Gamut 3 in the LogC4 specification. The primaries are virtual, placed to hold the
 * colors the ALEXA sensor records rather than to match any display. This is the
 * scene-linear form: decoded LogC3 data, scaled so a white diffusing reflector reads
 * 1.0, with highlights above it. It is the gamut of the ALEXA Classic, XT, SXT, Mini,
 * LF, Mini LF and 65 and the AMIRA.
 *
 * @see {@link https://www.arri.com/resource/blob/31918/66f56e6abb6e5b6553929edf9aa7483e/2017-03-alexa-logc-curve-in-vfx-data.pdf}
 * @year 2011
 * @by ARRI
 * @use Scene-linear camera gamut beneath LogC3 for ALEXA/AMIRA footage in VFX and grading; still active, succeeded by AWG4 on the ALEXA 35.
 * @aka ALEXA Wide Gamut RGB
 * @successor awg4 ARRI's fourth color-science generation, with the ALEXA 35, moved to ARRI Wide Gamut 4
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut awg3
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Primaries R(0.6840, 0.3130) G(0.2210, 0.8480) B(0.0861, -0.1020), white D65 (0.3127,
// 0.3290): ARRI "ALEXA Log C Curve – Usage in VFX" (rev. 2017-03), appendix "ALEXA Wide
// Gamut RGB". M is their normalized primary matrix to 10 decimals (within 4e-11 of the
// exact one); ARRI prints it to 6 (0.638008 …), the form colour-science 0.4.7
// RGB_COLOURSPACES['ARRI Wide Gamut 3'] carries – the two agree to 5e-7. MI = inv3(M).
// The single owner of this matrix: logc3.js composes its curve with these edges.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const awg3 = {
	name: 'awg3',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = a white diffusing reflector; scene-linear values run above it
	// (highlights) and below 0 (noise, out-of-gamut), like acescg
};

// AWG3 linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.6380076193, 0.2147038563, 0.0977444514,
	0.2919537790, 0.8238410415, -0.1157948205,
	0.0027982790, -0.0670342357, 1.1532937074
];
const MI = inv3(M);

awg3.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.awg3 = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default awg3;
