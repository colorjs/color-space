/**
 * Cubehelix is a color scheme designed by the astronomer Dave Green in 2011 for
 * displaying astronomical intensity images, where a single continuous scalar value
 * needs a color mapping that stays visually ordered from black to white even when
 * printed in grayscale or viewed by someone with color-vision deficiency. Rather than
 * picking colors freehand, it walks a spiral path — a "cube helix" — through RGB
 * space as it rises from black to white, letting perceived brightness increase
 * smoothly and monotonically while hue rotates around it. It is now widely used well
 * beyond its original astronomical purpose, as a colorblind-safe, print-safe
 * alternative to rainbow colormaps in scientific visualization generally.
 *
 * @see {@link https://www.mrao.cam.ac.uk/~dag/CUBEHELIX/}
 * @year 2011
 * @by Dave Green
 * @use Scalar colormap for scientific visualization; current standard colorblind-safe alternative to rainbow colormaps.
 * @channel {fraction} 0 1 Interpolation fraction along helix
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

var defaults = {
	// 0..3
	start: 0,
	// -10..10
	rotation: 0.5,
	// 0..1+
	hue: 1,
	// 0..2
	gamma: 1
};

var cubehelix = {
	name: 'cubehelix',
	channel: ['fraction'],
	range: [[0, 1]],
	defaults
};

// the helix at `fraction`, clamped RGB 0-1 (the raw curve cubehelix.rgb scales to 0-255)
function helix(fraction, o) {
	var start = o.start, rotation = o.rotation, gamma = o.gamma, hue = o.hue;
	var angle = 2 * Math.PI * (start / 3 + 1.0 + rotation * fraction);
	var f = Math.pow(fraction, gamma);
	var amp = hue * f * (1 - f) / 2.0;
	var r = f + amp * (-0.14861 * Math.cos(angle) + 1.78277 * Math.sin(angle));
	var g = f + amp * (-0.29227 * Math.cos(angle) - 0.90649 * Math.sin(angle));
	var b = f + amp * (+1.97294 * Math.cos(angle));
	return [Math.max(0, Math.min(r, 1)), Math.max(0, Math.min(g, 1)), Math.max(0, Math.min(b, 1))];
}

/**
 * Transform cubehelix level to RGB
 *
 * @param {number} fraction 0..1 cubehelix level
 * @param {Object<string, number>} options Mapping options, overrides defaults
 * @return {Array<number>} rgb tuple 0-255
 */
cubehelix.rgb = function (fraction, options = {}) {
	return helix(fraction, { ...defaults, ...options }).map(v => v * 255);
};

/**
 * RGB to cubehelix — the nearest point on the (default-parameter) helix: the fraction
 * whose colour is closest to the input. Colours actually on the helix recover their
 * fraction exactly (so cubehelix → rgb → cubehelix round-trips); off-helix colours
 * project onto it, the way conversions into `rgb` clamp to the sRGB gamut. Custom
 * `options` used on the forward can't be recovered from a single colour, so the inverse
 * always assumes the defaults.
 */
rgb.cubehelix = function (r, g, b) {
	var t = [r / 255, g / 255, b / 255];
	var d2 = f => { var c = helix(f, defaults); return (c[0] - t[0]) ** 2 + (c[1] - t[1]) ** 2 + (c[2] - t[2]) ** 2; };
	// coarse scan for the basin, then golden-section refine (the +fraction term makes
	// brightness monotonic in the fraction, so the nearest point is a single minimum)
	var N = 256, best = 0, bd = Infinity;
	for (var i = 0; i <= N; i++) { var f = i / N, d = d2(f); if (d < bd) { bd = d; best = f; } }
	var a = Math.max(0, best - 1 / N), c = Math.min(1, best + 1 / N);
	var gr = (Math.sqrt(5) - 1) / 2, x1 = c - gr * (c - a), x2 = a + gr * (c - a), f1 = d2(x1), f2 = d2(x2);
	for (var k = 0; k < 60; k++) {
		if (f1 < f2) { c = x2; x2 = x1; f2 = f1; x1 = c - gr * (c - a); f1 = d2(x1); }
		else { a = x1; x1 = x2; f1 = f2; x2 = a + gr * (c - a); f2 = d2(x2); }
	}
	return [(a + c) / 2];
};


export default cubehelix;
