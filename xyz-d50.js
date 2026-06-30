import xyz, { bradford, mat3 } from './xyz.js';

const xyzD50 = {
	name: 'xyz-d50',
	range: [[0, 100], [0, 100], [0, 100]]
};

xyzD50.xyz = (x, y, z) => mat3(bradford.D50_D65, x, y, z); // XYZ D50 -> D65
xyz['xyz-d50'] = (x, y, z) => mat3(bradford.D65_D50, x, y, z); // XYZ D65 -> D50

export default xyzD50;
