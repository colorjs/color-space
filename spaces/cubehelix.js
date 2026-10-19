/**
 * Cubehelix is a hue, saturation, lightness model of RGB built on Dave Green's 2011 color
 * scheme for astronomical images. Green's scheme spirals around the gray diagonal of the RGB
 * cube from black to white, keeping its deviation from gray in a plane of constant NTSC luma
 * so that brightness rises steadily. d3-color reads the spiral's parameters as coordinates:
 * L is the luma 0.30R′ + 0.59G′ + 0.11B′, S scales the deviation from gray, H is its angle.
 * Every RGB color has one (H, S, L) and converts back exactly, so it is a color space; a
 * Cubehelix colormap is a path through it at fixed S from L = 0 to L = 1.
 *
 * @see {@link https://arxiv.org/abs/1108.5083} Green 2011, eq. 2
 * @see {@link https://github.com/d3/d3-color/blob/v3.1.0/src/cubehelix.js} the (h, s, l) space and its inverse
 * @year 2011
 * @by Dave Green; Mike Bostock & Jason Davies (d3-color)
 * @use Colormaps and hue-rotating interpolation in d3 (interpolateCubehelix) and culori.
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 4.6144 Saturation
 * @channel {L} 0 1 Lightness (luma)
 * @method cylindrical
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Green's eq. 2: RGB = L + a·[A B; C D; E 0]·(cos φ, sin φ), with A..E = −0.14861, +1.78277,
// −0.29227, −0.90649, +1.97294; d3 sets a = S·L·(1 − L) (Green's hue parameter is 2S) and
// φ = H + 120°. The inverse is d3-color's cubehelixConvert, solved from the same three rows:
// L is the luma whose plane holds both columns (weights 0.300, 0.590, 0.110 to 1e-6, as A..E
// are rounded). On gamma-encoded sRGB, like HSL. S reaches 4.6144 at pure blue, the sRGB
// cube's maximum (culori declares 4.614, coloraide 4.614386868039719). Grays have no angle:
// H = S = 0, where d3 returns NaN and culori undefined; off the gray axis at L = 0 or 1 (only
// outside the cube) the deviation has no amplitude and reads as gray too. Not the one-channel
// colormap removed in v3: this one is three channels and invertible.
import rgb from './rgb.js';

const cubehelix = { name: 'cubehelix', range: [[0, 360], [0, 4.6144], [0, 1]] };

const A = -0.14861, B = +1.78277, C = -0.29227, D = -0.90649, E = +1.97294;
const ED = E * D, EB = E * B, BC_DA = B * C - D * A;

cubehelix.rgb = (h, s, l) => {
	const t = (h + 120) * Math.PI / 180, a = s * l * (1 - l), c = Math.cos(t), n = Math.sin(t);
	return [255 * (l + a * (A * c + B * n)), 255 * (l + a * (C * c + D * n)), 255 * (l + a * (E * c))];
};

rgb.cubehelix = (r, g, b) => {
	r /= 255, g /= 255, b /= 255;
	if (r === g && g === b) return [0, 0, r];
	const l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB), x = b - l, y = (E * (g - l) - C * x) / D;
	const k = E * l * (1 - l), s = Math.sqrt(x * x + y * y) / k;
	if (!k || !s) return [0, 0, l];
	const h = Math.atan2(y, x) * 180 / Math.PI - 120;
	return [h < 0 ? h + 360 : h, s, l];
};

export default cubehelix;
