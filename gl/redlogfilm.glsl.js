// GLSL chunk: REDLogFilm <-> CIE XYZ D65 0-100. Same REDcolor matrix as redlog.js;
// mirrors redlogfilm.js decode/encode (Cineon-matched curve, black 95/white 685 over
// 10 bits) and M/inv3(M).
export default {
	name: 'redlogfilm',
	edges: { xyz: ['xyz_redlogfilm', 'redlogfilm_xyz'] },
	code: /* glsl */ `
float redlogfilm_dec_(float y) {
	float bo = pow(10.0, (95.0 - 685.0) / 300.0);
	return (pow(10.0, (1023.0 * y - 685.0) / 300.0) - bo) / (1.0 - bo);
}
float redlogfilm_enc_(float x) {
	float bo = pow(10.0, (95.0 - 685.0) / 300.0);
	return (685.0 + 300.0 * (log(x * (1.0 - bo) + bo) / log(10.0))) / 1023.0;
}
vec3 redlogfilm_xyz(vec3 c) {
	float r = redlogfilm_dec_(c.x); float g = redlogfilm_dec_(c.y); float b = redlogfilm_dec_(c.z);
	return vec3(
		100.0 * (0.4230233052164921 * r + 0.3621073093271542 * g + 0.1653253125080252 * b),
		100.0 * (0.1992333523893298 * r + 0.7575963171907274 * g + 0.0431703304199426 * b),
		100.0 * (-0.0188501414613622 * r + 0.0921223263657989 * g + 1.0157855658554418 * b));
}
vec3 xyz_redlogfilm(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.9943363453148284 * x - 1.3790653425991255 * y - 0.42873702892781007 * z;
	float g = -0.7947266269791027 * x + 1.6928386458924696 * y + 0.057401902756748495 * z;
	float b = 0.12764084640743337 * x - 0.17911635794979525 * y + 0.9712977647052142 * z;
	return vec3(redlogfilm_enc_(r), redlogfilm_enc_(g), redlogfilm_enc_(b));
}`,
}
