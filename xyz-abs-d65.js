import xyz from './xyz.js';

const xyzAbsD65 = {
	name: 'xyz-abs-d65',
	channel: ['x', 'y', 'z']
};

const Yw = 203; // nits

xyzAbsD65.xyz = (x, y, z) => {
	// Abs -> Relative
	return [x / Yw, y / Yw, z / Yw];
}

xyz.xyzAbsD65 = (x, y, z) => {
	// Relative -> Abs
	return [x * Yw, y * Yw, z * Yw];
}

export default xyzAbsD65;
