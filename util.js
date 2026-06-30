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
