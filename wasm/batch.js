// color-space WASM batch kernel — jz source (valid JS; compiles AOT to WASM via jz).
//
// Whole-buffer color conversion: the per-pixel formulas mirror the scalar library
// exactly (pinned by test), but run as a tight in-place loop over an interleaved
// 3-channel Float64Array held in WASM linear memory — the shape jz compiles to
// near-native, transcendentals included (jz ≥0.8.1 fast cbrt/pow).
//
// Layout: one buffer, n pixels × 3 channels interleaved [c0,c1,c2, c0,c1,c2, …].
// `alloc(n)` returns a zero-copy view; each `from_to(n)` converts it in place.
// Ranges match the scalar API (rgb 0-255, oklab native L0-1/ab±0.4, xyz 0-100).

let buf

export let alloc = (n) => { buf = new Float64Array(n * 3); return buf }

// sRGB transfer (transfers.js, in-gamut form — batch rgb is 0-255 so ≥0)
const lin = (c) => c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92
// sign-extended inverse (linear may go slightly negative for out-of-gamut inputs)
const gam = (v) => {
	const a = v < 0 ? -v : v
	const e = a > 0.0031308 ? 1.055 * a ** (1 / 2.4) - 0.055 : a * 12.92
	return v < 0 ? -e : e
}

// sRGB 0-255 → Oklab (native): lrgb transfer → M1 → cbrt → M2
export let rgb_oklab = (n) => {
	for (let i = 0; i < n; i++) {
		const j = 3 * i
		const lr = lin(buf[j] / 255), lg = lin(buf[j + 1] / 255), lb = lin(buf[j + 2] / 255)
		const L = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
		const M = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
		const S = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
		buf[j] = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S
		buf[j + 1] = 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S
		buf[j + 2] = 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S
	}
}

// Oklab (native) → sRGB 0-255: M1' → cube → M1inv → gamma → ×255
export let oklab_rgb = (n) => {
	for (let i = 0; i < n; i++) {
		const j = 3 * i
		const l = buf[j], a = buf[j + 1], b = buf[j + 2]
		const l_ = l + 0.3963377774 * a + 0.2158037573 * b
		const m_ = l - 0.1055613458 * a - 0.0638541728 * b
		const s_ = l - 0.0894841775 * a - 1.291485548 * b
		const l3 = l_ * l_ * l_, m3 = m_ * m_ * m_, s3 = s_ * s_ * s_
		buf[j] = gam(4.0767416621 * l3 - 3.307711591 * m3 + 0.2309699292 * s3) * 255
		buf[j + 1] = gam(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3) * 255
		buf[j + 2] = gam(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3) * 255
	}
}

// sRGB 0-255 → XYZ 0-100 (matrix-only class): lrgb transfer → M_LRGB → ×100
export let rgb_xyz = (n) => {
	for (let i = 0; i < n; i++) {
		const j = 3 * i
		const lr = lin(buf[j] / 255), lg = lin(buf[j + 1] / 255), lb = lin(buf[j + 2] / 255)
		buf[j] = (0.41239079926595 * lr + 0.35758433938387 * lg + 0.18048078840183 * lb) * 100
		buf[j + 1] = (0.21263900587151 * lr + 0.71516867876775 * lg + 0.072192315360733 * lb) * 100
		buf[j + 2] = (0.019330818715591 * lr + 0.11919477979462 * lg + 0.95053215224966 * lb) * 100
	}
}

// XYZ 0-100 → sRGB 0-255: ÷100 → M_LRGB_INV → gamma → ×255
export let xyz_rgb = (n) => {
	for (let i = 0; i < n; i++) {
		const j = 3 * i
		const x = buf[j] / 100, y = buf[j + 1] / 100, z = buf[j + 2] / 100
		buf[j] = gam(3.2409699419045213 * x - 1.5373831775700935 * y - 0.4986107602930033 * z) * 255
		buf[j + 1] = gam(-0.9692436362808798 * x + 1.8759675015077206 * y + 0.04155505740717561 * z) * 255
		buf[j + 2] = gam(0.05563007969699361 * x - 0.20397695888897657 * y + 1.0569715142428786 * z) * 255
	}
}
