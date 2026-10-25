/**
 * Shared numeric helpers (no color semantics) – the spaces' own; color-space/util re-exports them.
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
/**
 * Product of two 3×3 row-major matrices — A·B applies B first, then A.
 * Lets a space pre-combine a fixed pipeline of linear steps into one matrix.
 * @param {number[]} A row-major 3×3
 * @param {number[]} B row-major 3×3
 * @returns {number[]} row-major 3×3
 */
export const mul3 = (A, B) => [
	A[0] * B[0] + A[1] * B[3] + A[2] * B[6], A[0] * B[1] + A[1] * B[4] + A[2] * B[7], A[0] * B[2] + A[1] * B[5] + A[2] * B[8],
	A[3] * B[0] + A[4] * B[3] + A[5] * B[6], A[3] * B[1] + A[4] * B[4] + A[5] * B[7], A[3] * B[2] + A[4] * B[5] + A[5] * B[8],
	A[6] * B[0] + A[7] * B[3] + A[8] * B[6], A[6] * B[1] + A[7] * B[4] + A[8] * B[7], A[6] * B[2] + A[7] * B[5] + A[8] * B[8],
];

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

/** x held within [lo, hi] */
export const clamp = (x, lo, hi) => x < lo ? lo : x > hi ? hi : x;

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
 * Two coordinates `t` of the way from `a` to `b`, as CSS Color 4 interpolates them: every channel straight but the hue
 * `h`, an angle over [lo, lo + span), which goes `arc`'s way round – shorter, longer, increasing, decreasing
 * (#hue-interpolation, a full turn for `longer` between equal hues) – and, missing (NaN) at one end, takes the other's
 * (#interpolation-missing); missing at both, `lo`, as a missing component converts. h < 0: no hue.
 * @see https://drafts.csswg.org/css-color-4/#interpolation
 * @param {number[]} a @param {number[]} b
 * @param {number} t
 * @param {number} [h=-1] the hue channel's index
 * @param {'shorter'|'longer'|'increasing'|'decreasing'} [arc='shorter']
 * @returns {number[]}
 */
export const interpolate = (a, b, t, h = -1, arc = 'shorter', lo = 0, span = 360) => a.map((x, i) => {
	if (i !== h) return x + (b[i] - x) * t
	const w = v => (v % span + span) % span   // onto the wheel, counted from lo
	let p = Number.isNaN(x) ? b[i] : x, q = Number.isNaN(b[i]) ? x : b[i]
	if (Number.isNaN(p)) return lo
	p = w(p - lo); q = w(q - lo); const d = q - p, half = span / 2
	if (arc === 'longer') { if (d > 0 && d < half) p += span; else if (d > -half && d <= 0) q += span }
	else if (arc === 'increasing') { if (q < p) q += span }
	else if (arc === 'decreasing') { if (p < q) p += span }
	else if (d > half) p += span; else if (d < -half) q += span
	return w(p + (q - p) * t) + lo
});

/**
 * Cylindrical (chroma, hue°) -> Cartesian opponent pair (a,b); inverse of
 * {@link cartToPolar}. Lightness L passes through.
 * @returns {[number,number,number]} [l, a, b]
 */
export const polarToCart = (l, c, h) => {
	const hr = h * Math.PI / 180;
	return [l, c * Math.cos(hr), c * Math.sin(hr)];
};
