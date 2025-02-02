import xyz from './xyz.js';

const labh = {
	name: 'labh',
	channel: ['lightness', 'a', 'b'],
};

labh.xyz = (l, a, b) => {
	let _y = l / 10;
	let _x = a / 17.5 * l / 10;
	let _z = b / 7 * l / 10;

	let y = _y * _y;
	let x = (_x + y) / 1.02;
	let z = -(_z - y) / 0.847;

	return [x, y, z];
}

xyz.labh = (x, y, z) => {
	let _y12 = Math.sqrt(y);
	let l = 10 * _y12;
	let a = y === 0 ? 0 : 17.5 * (((1.02 * x) - y) / _y12);
	let b = y === 0 ? 0 : 7 * ((y - (0.847 * z)) / _y12);

	return [l, a, b];
};

export default labh;
