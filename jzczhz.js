import jzazbz from './jzazbz.js';

const jzczhz = {
	name: 'jzczhz',
	channel: ['Jz', 'Cz', 'hz']
};

jzczhz.jzazbz = function(Jz, Cz, hz) {
	let h = hz * Math.PI / 180;
	return [
		Jz,
		Cz * Math.cos(h),
		Cz * Math.sin(h)
	];
};

jzazbz.jzczhz = function(Jz, az, bz) {
	let h = Math.atan2(bz, az) * 180 / Math.PI;
	if (h < 0) {
		h += 360;
	}
	return [
		Jz,
		Math.sqrt(az * az + bz * bz),
		h
	];
};

export default jzczhz;
