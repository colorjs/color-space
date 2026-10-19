/**
 * LogC3 — ARRI's third-generation logarithmic encoding, used across the ALEXA camera line
 * until LogC4 arrived with the ALEXA 35. Referenced to EI 800, it compresses the sensor's
 * scene-linear exposure into a curve that keeps shadow detail and highlight headroom for
 * grading, on the ALEXA Wide Gamut 3 primaries. For over a decade it was the dominant
 * scene-referred camera space in digital cinema production.
 *
 * @see {@link https://www.arri.com/resource/blob/31918/66f56e6abb6e5b6553929edf9aa7483e/2017-03-alexa-logc-curve-in-vfx-data.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2010
 * @by ARRI
 * @use Footage from the original ARRI ALEXA line; still widely supported in post.
 * @successor logc4 The ALEXA 35's wider dynamic range needed a new curve
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut awg3
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// 18% grey → 0.3910. Gamut: ARRI Wide Gamut 3, matrix in awg3.js.
import xyz from './xyz.js';
import awg3 from './awg3.js';

const logc3 = { name: 'logc3', range: [[0, 1], [0, 1], [0, 1]] };

const cut = 0.010591, a = 5.555556, b = 0.052272, c = 0.247190, d = 0.385537, e = 5.367655, f = 0.092809;
const enc = x => x > cut ? c * Math.log10(a * x + b) + d : e * x + f;
const dec = y => y > e * cut + f ? (Math.pow(10, (y - d) / c) - b) / a : (y - f) / e;

logc3.xyz = (r, g, b) => awg3.xyz(dec(r), dec(g), dec(b));
xyz.logc3 = (x, y, z) => { const [r, g, b] = xyz.awg3(x, y, z); return [enc(r), enc(g), enc(b)]; };

export default logc3;
