// GLSL chunk: PAL/EBU R'G'B' 0-1 <-> BT.601 625-line limited-range Y'CbCr.
import pal from './pal.glsl.js'
export default {
	name: 'ycbcr-bt601-625',
	deps: [pal],
	edges: { pal: ['pal_ycbcrbt601625', 'ycbcrbt601625_pal'] },
	code: /* glsl */ `
vec3 pal_ycbcrbt601625(vec3 c) {
	float y = 0.299 * c.x + 0.587 * c.y + 0.114 * c.z;
	return vec3(16.0 + 219.0 * y, 128.0 + 112.0 * (c.z - y) / 0.886, 128.0 + 112.0 * (c.x - y) / 0.701);
}
vec3 ycbcrbt601625_pal(vec3 c) {
	float y = (c.x - 16.0) / 219.0;
	float pb = (c.y - 128.0) / 224.0;
	float pr = (c.z - 128.0) / 224.0;
	float r = y + 1.402 * pr;
	float b = y + 1.772 * pb;
	return vec3(r, (y - 0.299 * r - 0.114 * b) / 0.587, b);
}`,
}
