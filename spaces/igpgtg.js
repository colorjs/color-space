/**
 * IgPgTg is a color space Hellwig and Fairchild proposed in 2020 for hue linearity, where
 * colors of one perceived hue share one hue angle. It follows IPT: a lightness signal from LMS
 * cone responses plus two opponent channels, protan and tritan, named for the color-vision
 * deficiencies their axes roughly align with. Where IPT was fit to visual hue data, IgPgTg was
 * optimized so Gaussian-shaped spectra with one peak wavelength share one hue; it did well in
 * the authors' hue-linearity experiment but poorly on existing visual data.
 *
 * @see {@link https://doi.org/10.2352/J.Percept.Imaging.2020.3.2.020401}
 * @year 2020
 * @by Luke Hellwig & Mark Fairchild
 * @use Hue-linearity research; academic, not widely deployed.
 * @channel {Ig} 0 1 Intensity
 * @channel {Pg} -1 1 Protan
 * @channel {Tg} -1 1 Tritan
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// XYZ -> bespoke LMS, per-cone scaling [18.36, 21.46, 19435], signed power 0.427,
// then a fixed opponent matrix to Ig/Pg/Tg.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const igpgtg = { name: 'igpgtg', range: [[0, 1], [-1, 1], [-1, 1]] };

const M1 = [2.968, 2.741, -0.649, 1.237, 5.969, -0.173, -0.318, 0.387, 2.311];
const M1I = inv3(M1);
const M2 = [0.117, 1.464, 0.130, 8.285, -8.361, 21.400, -1.208, 2.412, -36.530];
const M2I = inv3(M2);
const SC = [18.36, 21.46, 19435];
const spow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);

xyz.igpgtg = (x, y, z) =>
	mat3(M2, ...mat3(M1, x / 100, y / 100, z / 100).map((v, i) => spow(v / SC[i], 0.427)));

igpgtg.xyz = (ig, pg, tg) =>
	mat3(M1I, ...mat3(M2I, ig, pg, tg).map((v, i) => spow(v, 1 / 0.427) * SC[i])).map(v => v * 100);

export default igpgtg;
