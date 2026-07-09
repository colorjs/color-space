// GLSL chunk: CIE XYZ D65 0-100 <-> xyY (x,y 0-1 chromaticity, Y 0-100 luminance).
// Mirrors xyy.js: xyz.xyy guards sum===0 -> [0,0,Y]; xyy.xyz guards y===0 -> [0,0,0].
import xyz from './xyz.glsl.js'
export default {
	name: 'xyy',
	deps: [xyz],
	edges: { xyz: ['xyz_xyy', 'xyy_xyz'] },
	code: /* glsl */ `
vec3 xyz_xyy(vec3 c) {
	float sum = c.x + c.y + c.z;
	if (sum == 0.0) { return vec3(0.3127, 0.329, c.y); }   // achromatic: the D65 white's (x, y)
	return vec3(c.x / sum, c.y / sum, c.y);
}
vec3 xyy_xyz(vec3 c) {
	float x = c.x; float y = c.y; float Y = c.z;
	if (y == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float X = x * Y / y;
	float Z = (1.0 - x - y) * Y / y;
	return vec3(X, Y, Z);
}`,
}
