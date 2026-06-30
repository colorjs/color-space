/**
 * Shared numeric helpers (no color semantics).
 */

/**
 * 3×3 matrix (row-major, 9 elements) times a 3-vector.
 * @param {number[]} m row-major [m00,m01,m02, m10,m11,m12, m20,m21,m22]
 * @returns {[number,number,number]}
 */
export const mat3 = (m, x, y, z) => [
	x * m[0] + y * m[1] + z * m[2],
	x * m[3] + y * m[4] + z * m[5],
	x * m[6] + y * m[7] + z * m[8]
];

/**
 * Inverse of a 3×3 matrix (row-major). Lets a color space declare one forward
 * matrix as the single source of truth and derive its exact inverse, so the
 * round-trip is bit-exact (no transcription drift from a separately-rounded inverse).
 * @param {number[]} m row-major 9-element matrix
 * @returns {number[]} row-major inverse
 */
export const inv3 = (m) => {
	const [a, b, c, d, e, f, g, h, i] = m;
	const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g;
	const det = a * A + b * B + c * C;
	return [
		A / det, (c * h - b * i) / det, (b * f - c * e) / det,
		B / det, (a * i - c * g) / det, (c * d - a * f) / det,
		C / det, (b * g - a * h) / det, (a * e - b * d) / det
	];
};

/**
 * Signed power: keeps the sign, raises the magnitude. The standard way every
 * appearance model / gamma curve extends a fractional exponent to negative
 * (out-of-gamut) inputs without producing NaN.
 * @returns {number} sign(a)·|a|^b
 */
export const spow = (a, b) => Math.sign(a) * Math.abs(a) ** b;

/**
 * Cartesian opponent pair (a,b) -> cylindrical (chroma, hue°). The lightness L
 * passes straight through. Below `t` the colour is achromatic and the hue is
 * undefined → 0 (avoids a ghost hue from float-noise residuals, and atan2(-0,-0)).
 * @returns {[number,number,number]} [l, c, h] with h in [0,360)
 */
export const cartToPolar = (l, a, b, t = 1e-8) => {
	const c = Math.sqrt(a * a + b * b);
	const h = c < t ? 0 : Math.atan2(b, a) * 180 / Math.PI;
	return [l, c, h < 0 ? h + 360 : h];
};

/**
 * Cylindrical (chroma, hue°) -> Cartesian opponent pair (a,b); inverse of
 * {@link cartToPolar}. Lightness L passes through.
 * @returns {[number,number,number]} [l, a, b]
 */
export const polarToCart = (l, c, h) => {
	const hr = h * Math.PI / 180;
	return [l, c * Math.cos(hr), c * Math.sin(hr)];
};
