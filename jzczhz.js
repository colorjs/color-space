import jzazbz from './jzazbz.js';

const jzczhz = {
	name: 'jzczhz',
	channel: ['Jz', 'Cz', 'hz']
};

jzczhz.jzazbz = function(Jz, Cz, hz) {
	let h = hz * 2 * Math.PI;
	return [
		Jz,
		Cz * Math.cos(h),
		Cz * Math.sin(h)
	];
};

jzazbz.jzczhz = function(Jz, az, bz) {
	let h = Math.atan2(bz, az) / (2 * Math.PI);
	if (h < 0) {
		h += 1;
	}
	return [
		Jz,
		Math.sqrt(az * az + bz * bz),
		h
	];
};

export default jzczhz;
