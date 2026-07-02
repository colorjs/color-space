/**
 * hdr-IPT — Fairchild & Wyble's 2010/2011 extension of IPT to high-dynamic-range
 * imagery. IPT's fixed power-law lightness response only holds over a narrow luminance
 * range, so hdr-IPT replaces it with a Michaelis-Menten response whose exponent adapts
 * to the scene's own luminance, echoing how the eye itself adapts. It keeps IPT's I/P/T
 * lightness, red-green and yellow-blue structure while extending its hue-linear behavior
 * across HDR's much larger dynamic range.
 *
 * @see {@link https://library.imaging.org/cic/articles/18/1/art00057} Fairchild & Wyble 2010
 * @channel {I} 0 100 Lightness
 * @channel {P} -100 100 Red-Green
 * @channel {T} -100 100 Yellow-Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Implementation notes:
// Same IPT cone matrices; the fixed 0.43 power is replaced by a Michaelis-Menten
// lightness whose exponent adapts to scene luminance. Baked to the standard surround
// Y_s=0.2 / Y_abs=100 cd/m² (Fairchild 2011), giving ε=0.4820209.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const hdrIpt = { name: 'hdr-ipt', range: [[0, 100], [-100, 100], [-100, 100]] };

const M1 = [0.4002, 0.7075, -0.0807, -0.2280, 1.1500, 0.0612, 0, 0, 0.9184];
const M1i = inv3(M1);
const M2 = [0.4000, 0.4000, 0.2000, 4.4550, -4.8510, 0.3960, 0.8056, 0.3572, -1.1628];
const M2i = inv3(M2);

const e = 0.59 / (1.25 - 0.25 * (0.2 / 0.184)) / (Math.log(318) / Math.log(100)); // 0.4820 (Fairchild 2011)
const ke = Math.pow(2, e);
// Michaelis-Menten lightness; Vmax=247 (colour-science's default — its hdr-IPT call omits the method arg)
const light = v => 247 * Math.pow(Math.abs(v), e) / (Math.pow(Math.abs(v), e) + ke) * Math.sign(v);
const lightInv = L => Math.sign(L) * Math.pow(Math.abs(L) * ke / (247 - Math.abs(L)), 1 / e);

xyz['hdr-ipt'] = (X, Y, Z) => mat3(M2, ...mat3(M1, X / 100, Y / 100, Z / 100).map(light));
hdrIpt.xyz = (I, p, t) => mat3(M1i, ...mat3(M2i, I, p, t).map(lightInv)).map(v => v * 100);

export default hdrIpt;
