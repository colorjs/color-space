import xyz from './xyz.js';

const labh = {
	name: 'labh',
	channel: ['lightness', 'a', 'b'],
	range: [[0, 100], [-100, 100], [-100, 100]]
};

labh.xyz = (l, a, b) => {
	// Input: L 0-100, a/b ±100
	// Normalize L to 0-10 for calculation (since sqrt(100) = 10)
	let _y = l / 10;
	let _x = a / 17.5 * _y;
	let _z = b / 7 * _y;

	let y = _y * _y;
	let x = (_x + y) / 1.02;
	let z = -(_z - y) / 0.847;

	// Return XYZ in 0-100 range
	return [x, y, z];
}

xyz.labh = (x, y, z) => {
	// XYZ in 0-100 range
	let _y12 = Math.sqrt(y);
	// Scale to 0-100 range (sqrt(100) = 10, so multiply by 10)
	let l = _y12 * 10;
	let a = y === 0 ? 0 : 17.5 * (((1.02 * x) - y) / _y12);
	let b = y === 0 ? 0 : 7 * ((y - (0.847 * z)) / _y12);

	return [l, a, b];
};

export default labh;
