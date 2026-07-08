// GLSL chunk: REDLog <-> CIE XYZ D65 0-100. Matrix is REDcolor linear -> XYZ;
// mirrors redlog.js decode/encode (10-bit, black offset 10^(-1023/511)) and M/inv3(M).
export default {
	name: 'redlog',
	edges: { xyz: ['xyz_redlog', 'redlog_xyz'] },
	code: /* glsl */ `
float redlog_dec_(float y) {
	float bo = pow(10.0, -1023.0 / 511.0);
	return (pow(10.0, (1023.0 * y - 1023.0) / 511.0) - bo) / (1.0 - bo);
}
float redlog_enc_(float x) {
	float bo = pow(10.0, -1023.0 / 511.0);
	return (1023.0 + 511.0 * (log(x * (1.0 - bo) + bo) / log(10.0))) / 1023.0;
}
vec3 redlog_xyz(vec3 c) {
	float r = redlog_dec_(c.x); float g = redlog_dec_(c.y); float b = redlog_dec_(c.z);
	return vec3(
		100.0 * (0.4230233052164921 * r + 0.3621073093271542 * g + 0.1653253125080252 * b),
		100.0 * (0.1992333523893298 * r + 0.7575963171907274 * g + 0.0431703304199426 * b),
		100.0 * (-0.0188501414613622 * r + 0.0921223263657989 * g + 1.0157855658554418 * b));
}
vec3 xyz_redlog(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.9943363453148284 * x - 1.3790653425991255 * y - 0.42873702892781007 * z;
	float g = -0.7947266269791027 * x + 1.6928386458924696 * y + 0.057401902756748495 * z;
	float b = 0.12764084640743337 * x - 0.17911635794979525 * y + 0.9712977647052142 * z;
	return vec3(redlog_enc_(r), redlog_enc_(g), redlog_enc_(b));
}`,
}
