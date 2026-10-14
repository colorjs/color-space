/**
 * HelmGen LCh is the cylindrical form of Helmlab's 2026 generation space: lightness,
 * chroma and hue over HelmGen's opponent plane, the form for hue-led gradients,
 * palette ramps and color-mix in design systems.
 *
 * @see {@link https://arxiv.org/abs/2602.23010}
 * @year 2026
 * @by Görkem Yıldız
 * @use Hue-led palettes and gradients in design systems; new, shipped in Color.js 0.7.
 * @channel {L} 0 1 Lightness
 * @channel {C} 0 0.65 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import helmgen from './helmgen.js';
import { cartToPolar, polarToCart } from '../util.js';

const helmgenlch = { name: 'helmgenlch', range: [[0, 1], [0, 0.65], [0, 360]] };

helmgenlch.helmgen = (l, c, h) => polarToCart(l, c, h);
helmgen.helmgenlch = (l, a, b) => cartToPolar(l, a, b);

export default helmgenlch;
