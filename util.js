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
