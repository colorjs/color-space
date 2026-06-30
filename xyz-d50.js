import xyz, { bradford } from './xyz.js';
import { mat3 } from './util.js';

const xyzD50 = {
	name: 'xyz-d50',
	range: [[0, 100], [0, 100], [0, 100]]
};

xyzD50.xyz = (x, y, z) => mat3(bradford.D50_D65, x, y, z); // XYZ D50 -> D65
xyz[xyzD50.name] = (x, y, z) => mat3(bradford.D65_D50, x, y, z); // XYZ D65 -> D50

export default xyzD50;
