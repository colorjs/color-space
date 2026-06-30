/**
 * hdr-CIELAB color space
 *
 * Fairchild & Wyble (2010/2011) HDR extension of CIELAB: the L* cube root is replaced
 * by a Michaelis-Menten lightness adapting to scene luminance, applied to X/Xn, Y/Yn,
 * Z/Zn. Baked to the standard surround Y_s=0.2 / Y_abs=100 cd/m² (Fairchild 2011),
 * giving ε=0.4738510. D65.
 *
 * @see {@link https://library.imaging.org/cic/articles/18/1/art00057} Fairchild & Wyble 2010
 * @channel {L} 0 100 Lightness
 * @channel {a} -100 100 Red-Green
 * @channel {b} -100 100 Yellow-Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import xyz from './xyz.js';

const hdrLab = { name: 'hdr-cie-lab', range: [[0, 100], [-100, 100], [-100, 100]] };

const Wn = [95.0456, 100, 108.9058]; // D65 (0-100)
const e = 0.58 / (1.25 - 0.25 * (0.2 / 0.184)) / (Math.log(318) / Math.log(100)); // 0.4739 (Fairchild 2011)
const ke = Math.pow(2, e);
const light = v => 247 * Math.pow(v, e) / (Math.pow(v, e) + ke);
const lightInv = L => Math.pow(L * ke / (247 - L), 1 / e);

xyz['hdr-cie-lab'] = (X, Y, Z) => {
	const L = light(Y / Wn[1]);
	return [L, 5 * (light(X / Wn[0]) - L), 2 * (L - light(Z / Wn[2]))];
};

hdrLab.xyz = (L, a, b) => [Wn[0] * lightInv(L + a / 5), Wn[1] * lightInv(L), Wn[2] * lightInv(L - b / 2)];

export default hdrLab;
