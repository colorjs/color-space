import xyz from './xyz.js';

const xyzAbsD65 = {
	name: 'xyz-abs-d65',
	channel: ['x', 'y', 'z'],
	range: [[0, 10000], [0, 10000], [0, 10000]]
};

const Yw = 203; // nits

xyzAbsD65.xyz = (x, y, z) => {
	// Abs (nits) -> Relative (0-100)
	return [x / Yw * 100, y / Yw * 100, z / Yw * 100];
}

xyz.xyzAbsD65 = (x, y, z) => {
	// Relative (0-100) -> Abs (nits)
	return [x / 100 * Yw, y / 100 * Yw, z / 100 * Yw];
}

export default xyzAbsD65;
