// GLSL chunk: Oklab <-> OKLrab — Ottosson's Lr toe applied to L only (a/b pass
// through untouched). Mirrors oklrab.js toe/toeInv (same constants as
// wasm/batch.js oklab_oklrab/oklrab_oklab).
export default {
	name: 'oklrab',
	edges: { oklab: ['oklab_oklrab', 'oklrab_oklab'] },
	code: `
const float OKLRAB_K1_ = 0.206;
const float OKLRAB_K2_ = 0.03;
const float OKLRAB_K3_ = (1.0 + OKLRAB_K1_) / (1.0 + OKLRAB_K2_);
float oklrab_toe_(float x) {
	float k = OKLRAB_K3_ * x - OKLRAB_K1_;
	return 0.5 * (k + sqrt(k * k + 4.0 * OKLRAB_K2_ * OKLRAB_K3_ * x));
}
float oklrab_toeinv_(float x) {
	return (x * x + OKLRAB_K1_ * x) / (OKLRAB_K3_ * (x + OKLRAB_K2_));
}
vec3 oklab_oklrab(vec3 c) {
	return vec3(oklrab_toe_(c.x), c.y, c.z);
}
vec3 oklrab_oklab(vec3 c) {
	return vec3(oklrab_toeinv_(c.x), c.y, c.z);
}`,
}
