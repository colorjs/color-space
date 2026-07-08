// GLSL chunk: linear sRGB 0-1 <-> Oklab (native: L 0-1, a/b ±0.4), Ottosson 2020.
// Same constants as oklab.js / wasm/batch.js.
export default {
	name: 'oklab',
	edges: { lrgb: ['lrgb_oklab', 'oklab_lrgb'] },
	code: `
vec3 lrgb_oklab(vec3 c) {
	float l = cbrt_(0.4122214708 * c.x + 0.5363325363 * c.y + 0.0514459929 * c.z);
	float m = cbrt_(0.2119034982 * c.x + 0.6806995451 * c.y + 0.1073969566 * c.z);
	float s = cbrt_(0.0883024619 * c.x + 0.2817188376 * c.y + 0.6299787005 * c.z);
	return vec3(
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s);
}
vec3 oklab_lrgb(vec3 c) {
	float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
	float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
	float s_ = c.x - 0.0894841775 * c.y - 1.291485548 * c.z;
	float l3 = l_ * l_ * l_; float m3 = m_ * m_ * m_; float s3 = s_ * s_ * s_;
	return vec3(
		4.0767416621 * l3 - 3.307711591 * m3 + 0.2309699292 * s3,
		-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
		-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3);
}`,
}
