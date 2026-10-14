// GLSL chunk: sRGB 0-255 <-> oRGB (L′ 0-1, Cyb/Crg -1..1), Bratkova, Boulos & Shirley 2009.
// R′G′B′ -> L′C′1C′2 matrix (eq. 3), then the hue angle remap of eq. 5 (inverse eq. 7) applied
// in polar form. Mirrors orgb.js M and its derived inverse MI. Exact grays skip the angle:
// atan(0, 0) is undefined on GPUs (JS returns 0, which gives the same result).
export default {
	name: 'orgb',
	edges: { rgb: ['rgb_orgb', 'orgb_rgb'] },
	code: /* glsl */ `
float orgb_fwd_(float t) {
	float a = abs(t);
	if (a < 1.0471975511965976) { return 1.5 * t; }
	return sign(t) * (1.5707963267948966 + 0.75 * (a - 1.0471975511965976));
}
float orgb_inv_(float t) {
	float a = abs(t);
	if (a < 1.5707963267948966) { return t * 2.0 / 3.0; }
	return sign(t) * (1.0471975511965976 + 4.0 / 3.0 * (a - 1.5707963267948966));
}
vec3 rgb_orgb(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float l = 0.299 * r + 0.587 * g + 0.114 * b;
	float c1 = 0.5 * r + 0.5 * g - b;
	float c2 = 0.866 * r - 0.866 * g;
	float ch = sqrt(c1 * c1 + c2 * c2);
	if (ch == 0.0) { return vec3(l, 0.0, 0.0); }
	float t = orgb_fwd_(atan2_(c2, c1));
	return vec3(l, ch * cos(t), ch * sin(t));
}
vec3 orgb_rgb(vec3 c) {
	float l = c.x;
	float ch = sqrt(c.y * c.y + c.z * c.z);
	float c1 = 0.0; float c2 = 0.0;
	if (ch > 0.0) {
		float t = orgb_inv_(atan2_(c.z, c.y));
		c1 = ch * cos(t); c2 = ch * sin(t);
	}
	return vec3(
		255.0 * (l + 0.114 * c1 + 0.7436489607390301 * c2),
		255.0 * (l + 0.114 * c1 - 0.4110854503464203 * c2),
		255.0 * (l - 0.886 * c1 + 0.16628175519630484 * c2));
}`,
}
