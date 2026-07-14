// GLSL chunk: Rec.2020 R'G'B' 0-1 <-> BT.2020 non-constant-luminance limited Y'CbCr.
import rec2020 from './rec2020.glsl.js'
export default {
	name: 'ycbcr-bt2020',
	deps: [rec2020],
	edges: { rec2020: ['rec2020_ycbcrbt2020', 'ycbcrbt2020_rec2020'] },
	code: /* glsl */ `
vec3 rec2020_ycbcrbt2020(vec3 c) {
	float y = 0.2627 * c.x + 0.6780 * c.y + 0.0593 * c.z;
	return vec3(16.0 + 219.0 * y, 128.0 + 112.0 * (c.z - y) / 0.9407, 128.0 + 112.0 * (c.x - y) / 0.7373);
}
vec3 ycbcrbt2020_rec2020(vec3 c) {
	float y = (c.x - 16.0) / 219.0;
	float pb = (c.y - 128.0) / 224.0;
	float pr = (c.z - 128.0) / 224.0;
	float r = y + 1.4746 * pr;
	float b = y + 1.8814 * pb;
	return vec3(r, (y - 0.2627 * r - 0.0593 * b) / 0.6780, b);
}`,
}
