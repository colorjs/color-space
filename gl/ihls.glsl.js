// GLSL chunk: sRGB 0-255 <-> IHLS (H 0-360, Y 0-1, S 0-1), Hanbury 2003. Rec. 709 luma and
// the C1/C2 chromatic plane (eq. 59, 63), hue = atan2(−C2, C1) (eq. 65; achromatic → 0),
// S = max − min (eq. 60); inverse via C = √3·S / (2 sin(120° − H*)) (eq. 67-70) and the
// derived inverse matrix. Mirrors ihls.js M and MI.
export default {
	name: 'ihls',
	edges: { rgb: ['rgb_ihls', 'ihls_rgb'] },
	code: /* glsl */ `
vec3 rgb_ihls(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	float c1 = r - 0.5 * g - 0.5 * b;
	float c2 = -0.8660254037844386 * g + 0.8660254037844386 * b;
	float h = 0.0;
	if (abs(c1) + abs(c2) > 0.0) { h = atan2_(-c2, c1) * 57.29577951308232; }
	if (h < 0.0) { h = h + 360.0; }
	return vec3(h, y, max(r, max(g, b)) - min(r, min(g, b)));
}
vec3 ihls_rgb(vec3 c) {
	float h = c.x; float y = c.y; float s = c.z;
	float hs = h - 60.0 * floor(h / 60.0);
	float hr = h * 0.017453292519943295;
	float ch = 1.7320508075688772 * s / (2.0 * sin((120.0 - hs) * 0.017453292519943295));
	float c1 = ch * cos(hr);
	float c2 = -ch * sin(hr);
	return vec3(
		255.0 * (y + 0.7873999999999999 * c1 + 0.37123622308892934 * c2),
		255.0 * (y - 0.2126 * c1 - 0.2061140461006964 * c2),
		255.0 * (y - 0.2126 * c1 + 0.9485864922785551 * c2));
}`,
}
