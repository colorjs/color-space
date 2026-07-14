// GLSL chunk: Rec.709 R'G'B' 0-1 <-> BT.709 limited-range Y'CbCr.
import rec709 from './rec709.glsl.js'
export default {
	name: 'ycbcr-bt709',
	deps: [rec709],
	edges: { rec709: ['rec709_ycbcrbt709', 'ycbcrbt709_rec709'] },
	code: /* glsl */ `
vec3 rec709_ycbcrbt709(vec3 c) {
	float y = 0.2126 * c.x + 0.7152 * c.y + 0.0722 * c.z;
	return vec3(16.0 + 219.0 * y, 128.0 + 112.0 * (c.z - y) / 0.9278, 128.0 + 112.0 * (c.x - y) / 0.7874);
}
vec3 ycbcrbt709_rec709(vec3 c) {
	float y = (c.x - 16.0) / 219.0;
	float pb = (c.y - 128.0) / 224.0;
	float pr = (c.z - 128.0) / 224.0;
	float r = y + 1.5748 * pr;
	float b = y + 1.8556 * pb;
	return vec3(r, (y - 0.2126 * r - 0.0722 * b) / 0.7152, b);
}`,
}
