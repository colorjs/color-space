// color-space WASM kernel — jz source (valid JS; compiles AOT to WASM via jz).
//
// PRIMITIVE EDGES in two forms, composed like the library's hub-spoke graph
// (see ../wasm.js BFS):
//
//   rgb_lrgb(r, g, b) → [r′, g′, b′]   scalar — the formula source, exported as
//                                      WASM multi-value (i64 f64-bit lanes,
//                                      unboxed by ../wasm.js)
//   rgb_lrgb_n(n)                      batch — in-place loop over the working
//                                      buffer, destructuring the scalar kernel
//                                      per pixel
//
// The destructured call lowers to multi-value locals (no heap), measured *faster*
// than hand-inlined loop bodies — so each formula exists exactly once. Splitting
// into small per-edge loops lets jz vectorize cbrt/atan2 independently — measured
// 1.6× faster than one fused loop. Formulas mirror the scalar library and are
// pinned by test/wasm-batch.js. Ranges match the scalar API. Where a space file
// composes another's formula (p3 → p3-linear, logc3 → awg3), the kernel calls the
// same edge, destructuring its lanes and returning them: jz 0.9.2 compiles a bare
// `return f(…)` or `c ? […] : […]` to a boxed array, not a multi-value return.
// Constants the library derives at load with transcendentals or a matrix inverse
// (inv3 matrices, the CAM16/HCT viewing conditions, the HLG scale) are its own
// values printed as literals, not re-derived here.
//
// Regenerate ../wasm/binary.js via scripts/build-wasm.js after changes.

let buf
export let alloc = (n) => { buf = new Float64Array(n * 3); return buf }

// CIE 1976 companding (shared by lab/luv/hct)
const eps = 216 / 24389, eps3 = 24 / 116, kappa = 24389 / 27
const labF = (t) => t > eps ? Math.cbrt(t) : (kappa * t + 16) / 116
const labFInv = (ft) => ft > eps3 ? ft * ft * ft : (116 * ft - 16) / kappa
// Oklab Lr toe (Björnsson)
const K1 = 0.206, K2 = 0.03, K3 = (1.0 + K1) / (1.0 + K2)
const toe = (x) => { const kx = K3 * x - K1; return 0.5 * (kx + Math.sqrt(kx * kx + 4 * K2 * K3 * x)) }
const toeInv = (x) => (x * x + K1 * x) / (K3 * (x + K2))
// sign-extended power (shared by jzazbz, ipt, a98rgb, cam16); out-of-gamut safe
const spow = (a, e) => { const s = a < 0 ? -1 : 1, av = a < 0 ? -a : a; return s * av ** e }
const sgn = (v) => v < 0 ? -1 : 1

// ---- 1-D transfers (../transfers.js), sign-extended so out-of-gamut survives ----

// x^(1/2.4) by exact identity: 1/2.4 = 5/12 and x^(1/12) = sqrt(sqrt(cbrt(x))) — two native
// f64.sqrt instructions instead of the software pow path (which ran ~2× slower than V8's)
const srgbInv = (x) => { const t = Math.sqrt(Math.sqrt(Math.cbrt(x))); const t2 = t * t; return t2 * t2 * t }
// sRGB / IEC 61966-2-1 (also Display P3)
const srgbDec = (v) => { const a = Math.abs(v); return sgn(v) * (a > 0.04045 ? ((a + 0.055) / 1.055) ** 2.4 : a / 12.92) }
const srgbEnc = (v) => { const a = Math.abs(v); return sgn(v) * (a > 0.0031308 ? 1.055 * srgbInv(a) - 0.055 : a * 12.92) }
// ITU-R BT.709 OETF
const bt709Enc = (v) => { const a = Math.abs(v); return sgn(v) * (a < 0.018 ? 4.5 * a : 1.099 * Math.pow(a, 0.45) - 0.099) }
const bt709Dec = (v) => { const a = Math.abs(v); return sgn(v) * (a < 0.081 ? a / 4.5 : Math.pow((a + 0.099) / 1.099, 1 / 0.45)) }
// ITU-R BT.2020 OETF (Table 4, full-precision constants)
const A2020 = 1.09929682680944, B2020 = 0.018053968510807
const bt2020Enc = (v) => { const a = Math.abs(v); return sgn(v) * (a < B2020 ? 4.5 * a : A2020 * Math.pow(a, 0.45) - (A2020 - 1)) }
const bt2020Dec = (v) => { const a = Math.abs(v); return sgn(v) * (a < B2020 * 4.5 ? a / 4.5 : Math.pow((a + (A2020 - 1)) / A2020, 1 / 0.45)) }
// ITU-R BT.2100 HLG OETF (Note 5c's rounded a, b, c); diffuse white 1.0 at signal 0.75:
// HLG_S = 12 / (exp((0.75 − c) / a) + b)
const HLG_A = 0.17883277, HLG_B = 0.28466892, HLG_C = 0.55991073, HLG_S = 3.774118127505075
const hlgEnc = (v) => { const e = Math.abs(v) / HLG_S; return sgn(v) * (e <= 1 / 12 ? Math.sqrt(3 * e) : HLG_A * Math.log(12 * e - HLG_B) + HLG_C) }
const hlgDec = (v) => { const p = Math.abs(v); return sgn(v) * HLG_S * (p <= 0.5 ? p * p / 3 : (Math.exp((p - HLG_C) / HLG_A) + HLG_B) / 12) }

// ---- rgb / lrgb / xyz / oklab / oklrab (hub: lrgb, xyz) ----

export let rgb_lrgb = (r, g, b) => [srgbDec(r / 255), srgbDec(g / 255), srgbDec(b / 255)]
export let lrgb_rgb = (r, g, b) => [255 * srgbEnc(r), 255 * srgbEnc(g), 255 * srgbEnc(b)]
export let lrgb_xyz = (r, g, b) => [
  100 * (0.41239079926595 * r + 0.35758433938387 * g + 0.18048078840183 * b),
  100 * (0.21263900587151 * r + 0.71516867876775 * g + 0.072192315360733 * b),
  100 * (0.019330818715591 * r + 0.11919477979462 * g + 0.95053215224966 * b)
]
export let xyz_lrgb = (x0, y0, z0) => {
  const x = x0 / 100, y = y0 / 100, z = z0 / 100
  return [
    3.2409699419046056 * x - 1.537383177570116 * y - 0.4986107602930043 * z,
    -0.969243636280911 * x + 1.875967501507741 * y + 0.04155505740717699 * z,
    0.055630079696992636 * x - 0.20397695888896836 * y + 1.0569715142428788 * z
  ]
}
export let lrgb_oklab = (r, g, b) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ]
}
export let oklab_lrgb = (L, a, b) => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l3 = l_ * l_ * l_, m3 = m_ * m_ * m_, s3 = s_ * s_ * s_
  return [
    4.0767416621 * l3 - 3.307711591 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
  ]
}
export let oklab_oklrab = (l, a, b) => [toe(l), a, b]
export let oklrab_oklab = (l, a, b) => [toeInv(l), a, b]

// ---- rgb <-> hsl / hsv / hwb (Smith 1978/1996), every direct edge the library defines ----

// one channel of hsl → rgb at hue offset t
const hslCh = (t, t1, t2) => {
  const t3 = t < 0 ? t + 1 : t > 1 ? t - 1 : t
  return 6 * t3 < 1 ? t1 + (t2 - t1) * 6 * t3 : 2 * t3 < 1 ? t2 : 3 * t3 < 2 ? t1 + (t2 - t1) * (2 / 3 - t3) * 6 : t1
}
export let hsl_rgb = (h0, s0, l0) => {
  const h = h0 / 360, s = s0 / 100, l = l0 / 100
  if (s === 0) { const v = l * 255; return [v, v, v] }
  const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s, t1 = 2 * l - t2
  return [hslCh(h + 1 / 3, t1, t2) * 255, hslCh(h, t1, t2) * 255, hslCh(h - 1 / 3, t1, t2) * 255]
}
// hue of an rgb triple (0-1), shared by rgb→hsl and rgb→hsv
const rgbHue = (r, g, b, min, max, delta) => {
  let h = 0
  if (max === min) h = 0
  else if (r === max) h = (g - b) / delta
  else if (g === max) h = 2 + (b - r) / delta
  else if (b === max) h = 4 + (r - g) / delta
  h = Math.min(h / 6, 1)
  return h < 0 ? h + 1 : h
}
export let rgb_hsl = (r0, g0, b0) => {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255
  const min = Math.min(r, g, b), max = Math.max(r, g, b), delta = max - min
  const h = rgbHue(r, g, b, min, max, delta), l = (min + max) / 2
  const s = max === min ? 0 : l <= 0.5 ? delta / (max + min) : delta / (2 - max - min)
  return [h * 360, s * 100, l * 100]
}
// rgb→hsl's hue in degrees, for rgb→hwb: a scalar rather than rgb_hsl's first lane, since
// jz 0.9.2 boxes a partly destructured export on the heap per call (pinned by test/wasm-batch.js)
const rgbHueDeg = (r0, g0, b0) => {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255, min = Math.min(r, g, b), max = Math.max(r, g, b)
  return rgbHue(r, g, b, min, max, max - min) * 360
}
export let hsv_rgb = (h0, s0, v0) => {
  const h = (h0 / 360) * 6, s = s0 / 100, v = v0 / 100
  const hi = Math.floor(h) % 6
  const f = h - Math.floor(h), p = v * (1 - s), q = v * (1 - (s * f)), t = v * (1 - (s * (1 - f)))
  if (hi === 0) return [v * 255, t * 255, p * 255]
  if (hi === 1) return [q * 255, v * 255, p * 255]
  if (hi === 2) return [p * 255, v * 255, t * 255]
  if (hi === 3) return [p * 255, q * 255, v * 255]
  if (hi === 4) return [t * 255, p * 255, v * 255]
  if (hi === 5) return [v * 255, p * 255, q * 255]
  return [NaN, NaN, NaN] // negative or NaN hue: no sector (the scalar switch leaves its result undefined)
}
export let rgb_hsv = (r0, g0, b0) => {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255
  const min = Math.min(r, g, b), max = Math.max(r, g, b), delta = max - min
  const s = max === 0 ? 0 : delta / max
  return [rgbHue(r, g, b, min, max, delta) * 360, s * 100, max * 100]
}
export let hsv_hsl = (h, s0, v0) => {
  const s = s0 / 100, v = v0 / 100
  let l = (2 - s) * v, sl = s * v
  sl /= (l <= 1) ? l : 2 - l
  sl = sl || 0
  l /= 2
  return [h, sl * 100, l * 100]
}
export let hsl_hsv = (h, s0, l0) => {
  const s = s0 / 100, l = l0 / 100
  const l2 = l * 2, s2 = s * (l2 <= 1 ? l2 : 2 - l2)
  return [h, (2 * s2) / (l2 + s2) * 100, (l2 + s2) / 2 * 100]
}
export let hwb_rgb = (h0, w0, b0) => {
  const h = h0 / 360, wh = w0 / 100, bl = b0 / 100
  const ratio = wh + bl
  // white + black ≥ 1 is achromatic: the exact gray white / (white + black) (CSS Color 4)
  if (ratio >= 1) { const gray = wh / ratio * 255; return [gray, gray, gray] }
  const i = Math.floor(6 * h), v = 1 - bl
  let f = 6 * h - i
  if ((i & 0x01) !== 0) f = 1 - f
  const n = wh + f * (v - wh)
  if (i === 1) return [n * 255, v * 255, wh * 255]
  if (i === 2) return [wh * 255, v * 255, n * 255]
  if (i === 3) return [wh * 255, n * 255, v * 255]
  if (i === 4) return [n * 255, wh * 255, v * 255]
  if (i === 5) return [v * 255, wh * 255, n * 255]
  return [v * 255, n * 255, wh * 255] // 0, 6 and any other sector
}
export let rgb_hwb = (r0, g0, b0) => {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255
  return [rgbHueDeg(r * 255, g * 255, b * 255), Math.min(r, Math.min(g, b)) * 100, (1 - Math.max(r, Math.max(g, b))) * 100]
}
export let hwb_hsv = (h, w0, b0) => {
  const w = w0 / 100, b = b0 / 100
  if (w + b >= 1) return [h, 0, w / (w + b) * 100]
  return [h, (1 - (w / (1 - b))) * 100, (1 - b) * 100]
}
// keeps hue on zero value (an rgb round-trip would lose it)
export let hsv_hwb = (h, s0, v0) => {
  const s = s0 / 100, v = v0 / 100
  return [h, (v === 0 ? 0 : (v * (1 - s))) * 100, (1 - v) * 100]
}
export let hsl_hwb = (h, s, l) => { const [a, b, c] = hsl_hsv(h, s, l); const [x, y, z] = hsv_hwb(a, b, c); return [x, y, z] }
export let hwb_hsl = (h, w, b) => { const [a, c, d] = hwb_hsv(h, w, b); const [x, y, z] = hsv_hsl(a, c, d); return [x, y, z] }

// ---- rgb <-> ryb (Itten chromatic-circle cube, meodai/rybitten RYB_ITTEN) ----
// corner k = r + 2y + 4b at [3k, 3k+3): white red yellow orange blue violet green black, RGB 0-1
const RYB = [
  0.9921568627450981, 0.9647058823529412, 0.9294117647058824,
  0.8901960784313725, 0.1411764705882353, 0.12941176470588237,
  0.9529411764705882, 0.9019607843137255, 0,
  0.9411764705882353, 0.5568627450980392, 0.10980392156862745,
  0.08627450980392157, 0.6, 0.8549019607843137,
  0.47058823529411764, 0.13333333333333333, 0.6666666666666666,
  0, 0.5568627450980392, 0.3568627450980392,
  0.11372549019607843, 0.10980392156862745, 0.10980392156862745
]
const lerp = (a, b, t) => a + t * (b - a)
const smooth = (n) => n * n * (3 - 2 * n)
// one rgb channel of the trilinear cube blend at factors (fr, fy, fb)
const rybCh = (c, fr, fy, fb) => {
  const c00 = lerp(RYB[c], RYB[3 + c], fr), c10 = lerp(RYB[6 + c], RYB[9 + c], fr)
  const c01 = lerp(RYB[12 + c], RYB[15 + c], fr), c11 = lerp(RYB[18 + c], RYB[21 + c], fr)
  return lerp(lerp(c00, c10, fy), lerp(c01, c11, fy), fb)
}
const rybBlend = (fr, fy, fb) => [rybCh(0, fr, fy, fb), rybCh(1, fr, fy, fb), rybCh(2, fr, fy, fb)]
export let ryb_rgb = (r, y, b) => {
  const [R, G, B] = rybBlend(smooth(r / 255), smooth(y / 255), smooth(b / 255))
  return [R * 255, G * 255, B * 255]
}
// column c of the numeric Jacobian df/dq_c (step h forward, backward at the cube face)
const rybCol = (c, q0, q1, q2, f0, f1, f2) => {
  const qc = c === 0 ? q0 : c === 1 ? q1 : q2, step = qc + 1e-6 <= 1 ? 1e-6 : -1e-6
  const [p0, p1, p2] = rybBlend(c === 0 ? qc + step : q0, c === 1 ? qc + step : q1, c === 2 ? qc + step : q2)
  return [(p0 - f0) / step, (p1 - f1) / step, (p2 - f2) / step]
}
// mat3(inv3(M), x, y, z), with ../util.js's inv3 cofactor arithmetic
const inv3mul = (a, b, c, d, e, f, g, h, i, x, y, z) => {
  const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g
  const det = a * A + b * B + c * C
  return [
    x * (A / det) + y * ((c * h - b * i) / det) + z * ((b * f - c * e) / det),
    x * (B / det) + y * ((a * i - c * g) / det) + z * ((c * d - a * f) / det),
    x * (C / det) + y * ((b * g - a * h) / det) + z * ((a * e - b * d) / det)
  ]
}
// smoothstep inverse per channel, in closed form: n = ½ − sin(asin(1 − 2q) / 3)
const unsmooth = (q) => (0.5 - Math.sin(Math.asin(1 - 2 * q) / 3)) * 255
// Newton on the plain trilinear in q = smooth(p) space (its Jacobian never degenerates at
// corners), backtracking until the residual shrinks; 60 steps, as spaces/ryb.js
export let rgb_ryb = (R, G, B) => {
  const t0 = R / 255, t1 = G / 255, t2 = B / 255
  let q0 = 0.5, q1 = 0.5, q2 = 0.5, b0 = q0, b1 = q1, b2 = q2, bestE = Infinity
  for (let it = 0; it < 60; it++) {
    const [f0, f1, f2] = rybBlend(q0, q1, q2), e0 = f0 - t0, e1 = f1 - t1, e2 = f2 - t2
    const err = Math.hypot(e0, e1, e2)
    if (err < bestE) { bestE = err; b0 = q0; b1 = q1; b2 = q2 }
    if (err < 1e-12) break
    const [j00, j10, j20] = rybCol(0, q0, q1, q2, f0, f1, f2)
    const [j01, j11, j21] = rybCol(1, q0, q1, q2, f0, f1, f2)
    const [j02, j12, j22] = rybCol(2, q0, q1, q2, f0, f1, f2)
    const [d0, d1, d2] = inv3mul(j00, j01, j02, j10, j11, j12, j20, j21, j22, -e0, -e1, -e2)
    if (!(Number.isFinite(d0) && Number.isFinite(d1) && Number.isFinite(d2))) break
    let lam = 1, moved = false, n0 = q0, n1 = q1, n2 = q2
    for (let s = 0; s < 10; s++) {
      const c0 = Math.min(1, Math.max(0, q0 + lam * d0)), c1 = Math.min(1, Math.max(0, q1 + lam * d1)), c2 = Math.min(1, Math.max(0, q2 + lam * d2))
      const [g0, g1, g2] = rybBlend(c0, c1, c2)
      if (Math.hypot(g0 - t0, g1 - t1, g2 - t2) < err) { n0 = c0; n1 = c1; n2 = c2; moved = true; break }
      lam /= 2
    }
    if (!moved) break // stationary: out-of-cube target, keep the best fit
    q0 = n0; q1 = n1; q2 = n2
  }
  return [unsmooth(b0), unsmooth(b1), unsmooth(b2)]
}

// ---- xyz <-> xyz-d50 (Bradford, CSS Color 4 full precision; shared by lab and prophoto) ----

export let xyz_xyzd50 = (x, y, z) => [
  1.0479298208405488 * x + 0.022946793341019088 * y - 0.05019222954313557 * z,
  0.029627815688159344 * x + 0.990434484573249 * y - 0.01707382502938514 * z,
  -0.009243058152591178 * x + 0.015055144896577895 * y + 0.7518742899580008 * z
]
export let xyzd50_xyz = (x, y, z) => [
  0.9554734527042182 * x - 0.023098536874261423 * y + 0.0632593086610217 * z,
  -0.028369706963208136 * x + 1.0099954580058226 * y + 0.021041398966943008 * z,
  0.012314001688319899 * x - 0.020507696433477912 * y + 1.3303659366080753 * z
]

// ---- xyz <-> lab / lab-d65 / luv (hub: xyz) ----

export let xyz_lab = (X, Y, Z) => {
  const [x50, y50, z50] = xyz_xyzd50(X / 100, Y / 100, Z / 100)
  const fx = labF(x50 / 0.9642956764295677), fy = labF(y50), fz = labF(z50 / 0.8251046025104602)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
export let lab_xyz = (l, a, b) => {
  const fy = (l + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200
  const [x, y, z] = xyzd50_xyz(labFInv(fx) * 0.9642956764295677, labFInv(fy), labFInv(fz) * 0.8251046025104602)
  return [x * 100, y * 100, z * 100]
}
export let xyz_labd65 = (X, Y, Z) => {
  const fx = labF(X / 100 / 0.9504559270516716), fy = labF(Y / 100), fz = labF(Z / 100 / 1.0890577507598784)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
export let labd65_xyz = (l, a, b) => {
  const fy = (l + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200
  return [labFInv(fx) * 0.9504559270516716 * 100, labFInv(fy) * 100, labFInv(fz) * 1.0890577507598784 * 100]
}
// D65 chromaticity shared by luv (u′v′ of the reference white)
const luv_xn = 95.04559270516717, luv_yn = 100, luv_zn = 108.90577507598783
const luv_dn = luv_xn + 15 * luv_yn + 3 * luv_zn, luv_un = 4 * luv_xn / luv_dn, luv_vn = 9 * luv_yn / luv_dn
export let xyz_luv = (x, y, z) => {
  const denom = x + 15 * y + 3 * z
  const _u = denom === 0 ? 0 : (4 * x) / denom, _v = denom === 0 ? 0 : (9 * y) / denom
  const l = 116 * labF(y / luv_yn) - 16
  return [l, 13 * l * (_u - luv_un), 13 * l * (_v - luv_vn)]
}
export let luv_xyz = (l, u, v) => {
  if (l === 0) return [0, 0, 0]
  const _u = u / (13 * l) + luv_un, _v = v / (13 * l) + luv_vn
  const y = luv_yn * labFInv((l + 16) / 116)
  return [y * 9 * _u / (4 * _v), y, y * (12 - 3 * _u - 20 * _v) / (4 * _v)]
}

// ---- xyz <-> xyy <-> munsell; xyz <-> lms ----

// black has no chromaticity: it sits at the D65 white's (x, y) (../whitepoints.js D65)
export let xyz_xyy = (X, Y, Z) => {
  const sum = X + Y + Z
  if (sum === 0) return [0.3127, 0.329, Y]
  return [X / sum, Y / sum, Y]
}
export let xyy_xyz = (x, y, Y) => {
  if (y === 0) return [0, 0, 0]
  return [x * Y / y, Y, (1 - x - y) * Y / y]
}
// 1943 Munsell renotation (RIT MCSL "real", 2734 colors, Illuminant C): MUNSELL_COUNTS /
// MUNSELL_PACK are spaces/munsell.js's own strings, injected by scripts/build-wasm.js
// (define) and decoded at load, below the heap's reset mark — durable across _clear
const mu_cnt = new Uint8Array(360), mu_off = new Int32Array(361)
for (let i = 0; i < 360; i++) { mu_cnt[i] = MUNSELL_COUNTS.charCodeAt(i) - 48; mu_off[i + 1] = mu_off[i] + mu_cnt[i] }
const mu_bin = atob(MUNSELL_PACK), mu_xy = new Uint16Array(mu_bin.length >> 1)
for (let i = 0; i < mu_xy.length; i++) mu_xy[i] = mu_bin.charCodeAt(i * 2) | (mu_bin.charCodeAt(i * 2 + 1) << 8)
const mu_wx = 0.31006, mu_wy = 0.31616 // Illuminant C 2° white chromaticity
const muAt = (hi, vi, ci) => { const o = (mu_off[hi * 9 + vi] + ci) * 2; return [mu_xy[o] / 1e4, mu_xy[o + 1] / 1e4] }
// chroma-interpolated xy at fractional chroma C in cell (hi, vi), clamped to its gamut (cellXY)
const muCell = (hi, vi, C) => {
  const n = mu_cnt[hi * 9 + vi]
  if (C <= 0) return [mu_wx, mu_wy]
  const ci = C / 2 - 1, c0 = Math.floor(ci)
  if (c0 < 0) { const [x, y] = muAt(hi, vi, 0), t = C / 2; return [mu_wx + (x - mu_wx) * t, mu_wy + (y - mu_wy) * t] }
  if (c0 >= n - 1) { const [x, y] = muAt(hi, vi, n - 1); return [x, y] }
  const [x0, y0] = muAt(hi, vi, c0), [x1, y1] = muAt(hi, vi, c0 + 1), t = ci - c0
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]
}
// an empty cell falls back to its hue neighbour, then to white (toXyY's corner)
const muCorner = (hi, vi, C, alt) => {
  const k = mu_cnt[hi * 9 + vi] ? hi : mu_cnt[alt * 9 + vi] ? alt : -1
  if (k < 0) return [mu_wx, mu_wy]
  const [x, y] = muCell(k, vi, C)
  return [x, y]
}
// Newhall 1943 value function V → Y (the renotation table's Y column), and its Newton inverse
const muY = (V) => 1.2219 * V - 0.23111 * V ** 2 + 0.23951 * V ** 3 - 0.021009 * V ** 4 + 0.0008404 * V ** 5
const muV = (Y) => {
  let V = 10 * Math.cbrt(Math.max(Y, 0) / 100)
  for (let i = 0; i < 40; i++) {
    const f = muY(V) - Y
    const d = 1.2219 - 0.46222 * V + 0.71853 * V ** 2 - 0.084036 * V ** 3 + 0.004202 * V ** 4
    V -= f / d; if (Math.abs(f) < 1e-9) break
  }
  return V
}
// the forward lives in a local helper the export wraps: xyy→munsell reads two of its lanes, and
// jz 0.9.2 boxes a partly destructured export on the heap per call (pinned by test/wasm-batch.js)
const muXyY = (H, V, C) => {
  const Y = muY(V)
  if (C <= 0) return [mu_wx, mu_wy, Y]
  const vi0 = Math.max(0, Math.min(8, Math.floor(V) - 1)), vi1 = Math.min(8, vi0 + 1)
  const tv = Math.max(0, Math.min(1, (V - 1) - vi0))
  const hf = ((((H - 1e-9) % 100) + 100) % 100) / 2.5 - 1
  const h0 = ((Math.floor(hf) % 40) + 40) % 40, h1 = (h0 + 1) % 40, th = hf - Math.floor(hf)
  const [ax, ay] = muCorner(h0, vi0, C, h1), [bx, by] = muCorner(h1, vi0, C, h0)
  const [cx, cy] = muCorner(h0, vi1, C, h1), [dx, dy] = muCorner(h1, vi1, C, h0)
  const x0 = ax + (bx - ax) * th, y0 = ay + (by - ay) * th, x1 = cx + (dx - cx) * th, y1 = cy + (dy - cy) * th
  return [x0 + (x1 - x0) * tv, y0 + (y1 - y0) * tv, Y]
}
export let munsell_xyy = (H, V, C) => { const [x, y, Y] = muXyY(H, V, C); return [x, y, Y] }
// coarse search over the renotation's hue × chroma nodes at this value, then 2-D Newton on (H, C)
export let xyy_munsell = (x, y, Y) => {
  const V = muV(Y)
  if (Math.hypot(x - mu_wx, y - mu_wy) < 1e-4) return [0, V, 0]
  let H = 0, C = 0, bd = 0, seen = false
  for (let hi = 0; hi < 40; hi++) for (let c = 2; c <= 38; c += 2) {
    const [fx, fy, fY] = muXyY(2.5 * (hi + 1), V, c), d = (fx - x) ** 2 + (fy - y) ** 2
    if (!seen || d < bd) { H = 2.5 * (hi + 1); C = c; bd = d; seen = true }
  }
  for (let it = 0; it < 60; it++) {
    const [fx, fy, fY] = muXyY(H, V, C), ex = fx - x, ey = fy - y
    if (Math.hypot(ex, ey) < 1e-8) break
    const [hx, hy, hY] = muXyY(H + 0.05, V, C), [kx, ky, kY] = muXyY(H, V, C + 0.05)
    const j00 = (hx - fx) / 0.05, j01 = (kx - fx) / 0.05
    const j10 = (hy - fy) / 0.05, j11 = (ky - fy) / 0.05
    const det = j00 * j11 - j01 * j10; if (Math.abs(det) < 1e-12) break
    const sH = (j11 * -ex - j01 * -ey) / det, sC = (-j10 * -ex + j00 * -ey) / det
    H = ((H + Math.max(-5, Math.min(5, sH))) % 100 + 100) % 100
    C = Math.max(0, C + Math.max(-5, Math.min(5, sC)))
  }
  return [H, V, C]
}
// CAT02 cone response and its inverse, the library's default lms matrices
export let xyz_lms = (x, y, z) => [
  0.7328 * x + 0.4296 * y - 0.1624 * z,
  -0.7036 * x + 1.6975 * y + 0.0061 * z,
  0.0030 * x + 0.0136 * y + 0.9834 * z
]
export let lms_xyz = (l, m, s) => [
  1.096123820835514 * l - 0.278869000218287 * m + 0.182745179382773 * s,
  0.454369041975359 * l + 0.473533154307412 * m + 0.072097803717229 * s,
  -0.009627608738429 * l - 0.005698031216113 * m + 1.015325639954543 * s
]

// ---- xyz <-> RGB working spaces: linear = primaries matrix (Y 0-1); encoded = transfer ∘ linear ----

export let p3linear_xyz = (r, g, b) => [
  100 * (0.4865709486482162 * r + 0.26566769316909306 * g + 0.1982172852343625 * b),
  100 * (0.2289745640697488 * r + 0.6917385218365064 * g + 0.079286914093745 * b),
  100 * (0.04511338185890264 * g + 1.043944368900976 * b)
]
export let xyz_p3linear = (x0, y0, z0) => {
  const x = x0 / 100, y = y0 / 100, z = z0 / 100
  return [
    2.493496911941425 * x - 0.9313836179191237 * y - 0.4027107844507168 * z,
    -0.8294889695615747 * x + 1.7626640603183459 * y + 0.023624685841943584 * z,
    0.03584583024378436 * x - 0.07617238926804176 * y + 0.9568845240076871 * z
  ]
}
export let p3_xyz = (r, g, b) => { const [x, y, z] = p3linear_xyz(srgbDec(r), srgbDec(g), srgbDec(b)); return [x, y, z] }
export let xyz_p3 = (x, y, z) => { const [r, g, b] = xyz_p3linear(x, y, z); return [srgbEnc(r), srgbEnc(g), srgbEnc(b)] }
export let rec2020linear_xyz = (r, g, b) => [
  100 * (0.6369580483012914 * r + 0.14461690358620832 * g + 0.1688809751641721 * b),
  100 * (0.2627002120112671 * r + 0.6779980715188708 * g + 0.05930171646986196 * b),
  100 * (0.028072693049087428 * g + 1.060985057710791 * b)
]
export let xyz_rec2020linear = (x0, y0, z0) => {
  const x = x0 / 100, y = y0 / 100, z = z0 / 100
  return [
    1.7166511879712671 * x - 0.3556707837763923 * y - 0.2533662813736597 * z,
    -0.6666843518324891 * x + 1.6164812366349393 * y + 0.015768545813911145 * z,
    0.017639857445310863 * x - 0.04277061325780853 * y + 0.9421031212354736 * z
  ]
}
export let rec2020_xyz = (r, g, b) => { const [x, y, z] = rec2020linear_xyz(bt2020Dec(r), bt2020Dec(g), bt2020Dec(b)); return [x, y, z] }
export let xyz_rec2020 = (x, y, z) => { const [r, g, b] = xyz_rec2020linear(x, y, z); return [bt2020Enc(r), bt2020Enc(g), bt2020Enc(b)] }
export let a98rgblinear_xyz = (r, g, b) => [
  100 * (0.5766690429101305 * r + 0.1855582379065463 * g + 0.1882286462349947 * b),
  100 * (0.29734497525053605 * r + 0.6273635662554661 * g + 0.07529145849399788 * b),
  100 * (0.02703136138641234 * r + 0.07068885253582723 * g + 0.9913375368376388 * b)
]
export let xyz_a98rgblinear = (x0, y0, z0) => {
  const x = x0 / 100, y = y0 / 100, z = z0 / 100
  return [
    2.0415879038107465 * x - 0.5650069742788597 * y - 0.34473135077832956 * z,
    -0.9692436362808796 * x + 1.8759675015077202 * y + 0.04155505740717559 * z,
    0.013444280632031149 * x - 0.11836239223101837 * y + 1.0151749943912054 * z
  ]
}
// Adobe RGB (1998) pure gamma 563/256
export let a98rgb_xyz = (r, g, b) => { const [x, y, z] = a98rgblinear_xyz(spow(r, 563 / 256), spow(g, 563 / 256), spow(b, 563 / 256)); return [x, y, z] }
export let xyz_a98rgb = (x, y, z) => { const [r, g, b] = xyz_a98rgblinear(x, y, z); return [spow(r, 256 / 563), spow(g, 256 / 563), spow(b, 256 / 563)] }
// ProPhoto (ROMM) is D50-referred: primaries to XYZ D50, then Bradford to D65
export let prophotolinear_xyz = (r, g, b) => {
  const [x, y, z] = xyzd50_xyz(
    0.79776664490064230 * r + 0.13518129740053308 * g + 0.03134773412839220 * b,
    0.28807482881940130 * r + 0.71183523424187300 * g + 0.00008993693872564 * b,
    0.82510460251046020 * b)
  return [x * 100, y * 100, z * 100]
}
export let xyz_prophotolinear = (x0, y0, z0) => {
  const [x, y, z] = xyz_xyzd50(x0 / 100, y0 / 100, z0 / 100)
  return [
    1.34578688164715830 * x - 0.25557208737979464 * y - 0.05110186497554526 * z,
    -0.54463070512490190 * x + 1.50824774284514680 * y + 0.02052744743642139 * z,
    1.21196754563894520 * z
  ]
}
// ROMM transfer: γ 1.8 with a linear segment (Et = 1/512, 16·Et = 1/32)
const ppDec = (v) => { const a = Math.abs(v); return a < 16 / 512 ? v / 16 : sgn(v) * Math.pow(a, 1.8) }
const ppEnc = (v) => { const a = Math.abs(v); return a >= 1 / 512 ? sgn(v) * Math.pow(a, 1 / 1.8) : 16 * v }
export let prophoto_xyz = (r, g, b) => { const [x, y, z] = prophotolinear_xyz(ppDec(r), ppDec(g), ppDec(b)); return [x, y, z] }
export let xyz_prophoto = (x, y, z) => { const [r, g, b] = xyz_prophotolinear(x, y, z); return [ppEnc(r), ppEnc(g), ppEnc(b)] }
// BT.709 shares sRGB primaries and white: linear light is lrgb, only the OETF differs
export let rec709_lrgb = (r, g, b) => [bt709Dec(r), bt709Dec(g), bt709Dec(b)]
export let lrgb_rec709 = (r, g, b) => [bt709Enc(r), bt709Enc(g), bt709Enc(b)]
// studio-range Y′CbCr (8-bit legal codes Y′ 16-235, Cb/Cr 16-240) over the encoded RGB
const yccFwd = (r, g, b, Kr, Kb) => {
  const y = Kr * r + (1 - Kr - Kb) * g + Kb * b
  return [16 + 219 * y, 128 + 112 * (b - y) / (1 - Kb), 128 + 112 * (r - y) / (1 - Kr)]
}
const yccInv = (y, cb, cr, Kr, Kb) => {
  const Y = (y - 16) / 219, Pb = (cb - 128) / 224, Pr = (cr - 128) / 224
  const r = Y + 2 * (1 - Kr) * Pr, b = Y + 2 * (1 - Kb) * Pb
  return [r, (Y - Kr * r - Kb * b) / (1 - Kr - Kb), b]
}
export let rec709_ycbcrbt709 = (r, g, b) => { const [y, cb, cr] = yccFwd(r, g, b, 0.2126, 0.0722); return [y, cb, cr] }
export let ycbcrbt709_rec709 = (y, cb, cr) => { const [r, g, b] = yccInv(y, cb, cr, 0.2126, 0.0722); return [r, g, b] }
export let rec2020_ycbcrbt2020 = (r, g, b) => { const [y, cb, cr] = yccFwd(r, g, b, 0.2627, 0.0593); return [y, cb, cr] }
export let ycbcrbt2020_rec2020 = (y, cb, cr) => { const [r, g, b] = yccInv(y, cb, cr, 0.2627, 0.0593); return [r, g, b] }
// ICtCp-HLG (BT.2100-3 Table 7, HLG column) over Rec.2020 scene-linear RGB
export let rec2020linear_ictcphlg = (r, g, b) => {
  const l = hlgEnc(1688 / 4096 * r + 2146 / 4096 * g + 262 / 4096 * b)
  const m = hlgEnc(683 / 4096 * r + 2951 / 4096 * g + 462 / 4096 * b)
  const s = hlgEnc(99 / 4096 * r + 309 / 4096 * g + 3688 / 4096 * b)
  return [2048 / 4096 * l + 2048 / 4096 * m, 3625 / 4096 * l - 7465 / 4096 * m + 3840 / 4096 * s, 9500 / 4096 * l - 9212 / 4096 * m - 288 / 4096 * s]
}
export let ictcphlg_rec2020linear = (i, ct, cp) => {
  const l = hlgDec(i + 0.015718580108730413 * ct + 0.2095810681164055 * cp)
  const m = hlgDec(i - 0.015718580108730413 * ct - 0.2095810681164055 * cp)
  const s = hlgDec(i + 1.0212710798422342 * ct - 0.6052744909924315 * cp)
  return [
    3.4366066943330784 * l - 2.50645211865627 * m + 0.06984542432319148 * s,
    -0.7913295555989287 * l + 1.9836004517922907 * m - 0.192270896193362 * s,
    -0.025949899690592672 * l - 0.09891371471172644 * m + 1.1248636144023192 * s
  ]
}

// ---- xyz <-> ACES (AP1 under the ACES white; Bradford D65 <-> ACES white, derived in acescg.js) ----

export let acescg_xyz = (r, g, b) => {
  const x = 0.6624541811085053 * r + 0.13400420645643313 * g + 0.1561876870049078 * b
  const y = 0.27222871678091454 * r + 0.6740817658111484 * g + 0.05368951740793705 * b
  const z = -0.005574649490394108 * r + 0.004060733528982826 * g + 1.0103391003129971 * b
  return [
    (0.9872240087030176 * x - 0.006113228606856944 * y + 0.015953288335912686 * z) * 100,
    (-0.007598371811662375 * x + 1.001861484739654 * y + 0.005330035791388962 * z) * 100,
    (0.003072577058531532 * x - 0.005095961511130591 * y + 1.0816806030657953 * z) * 100
  ]
}
export let xyz_acescg = (x0, y0, z0) => {
  const x = x0 / 100, y = y0 / 100, z = z0 / 100
  const xa = 1.013034914649986 * x + 0.006105257823207226 * y - 0.014970943626587574 * z
  const ya = 0.007698230125415045 * x + 0.9981633521182773 * y - 0.005032038535111895 * z
  const za = -0.0028413174324390736 * x + 0.00468515672253722 * y + 0.9245061374576632 * z
  return [
    1.6410233796943261 * xa - 0.3248032941847900 * ya - 0.2364246952376123 * za,
    -0.6636628587229831 * xa + 1.6153315916573381 * ya + 0.0167563476855301 * za,
    0.0117218943283754 * xa - 0.0082844419962374 * ya + 0.9883948585390218 * za
  ]
}
// ACEScct (S-2016-001): log2 with a linear toe; log2 as ln/LN2, as the spec CTL
const cctEnc = (lin) => lin <= 0.0078125 ? 10.5402377416545 * lin + 0.0729055341958355 : (Math.log(lin) / Math.LN2 + 9.72) / 17.52
const cctDec = (cct) => cct <= 0.155251141552511 ? (cct - 0.0729055341958355) / 10.5402377416545 : Math.pow(2, cct * 17.52 - 9.72)
export let acescct_acescg = (r, g, b) => [cctDec(r), cctDec(g), cctDec(b)]
export let acescg_acescct = (r, g, b) => [cctEnc(r), cctEnc(g), cctEnc(b)]
// ACEScc (S-2014-003): pure log2, clamped at 2^-16 below and half-float max above
const cc_eps = 2 ** -16, cc_low = (9.72 - 15) / 17.52
const ccDec = (v) => v <= cc_low ? (Math.pow(2, v * 17.52 - 9.72) - cc_eps) * 2 : v < 1.468 ? Math.pow(2, v * 17.52 - 9.72) : 65504
const ccEnc = (v) => v <= 0 ? (Math.log2(cc_eps) + 9.72) / 17.52 : v < cc_eps ? (Math.log2(cc_eps + v * 0.5) + 9.72) / 17.52 : (Math.log2(v) + 9.72) / 17.52
export let acescc_xyz = (r, g, b) => { const [x, y, z] = acescg_xyz(ccDec(r), ccDec(g), ccDec(b)); return [x, y, z] }
export let xyz_acescc = (x, y, z) => { const [r, g, b] = xyz_acescg(x, y, z); return [ccEnc(r), ccEnc(g), ccEnc(b)] }

// ---- xyz <-> ARRI Wide Gamut 3 / LogC3 (EI 800); logc3 composes awg3's matrix ----

export let awg3_xyz = (r, g, b) => [
  (0.6380076193 * r + 0.2147038563 * g + 0.0977444514 * b) * 100,
  (0.2919537790 * r + 0.8238410415 * g - 0.1157948205 * b) * 100,
  (0.0027982790 * r - 0.0670342357 * g + 1.1532937074 * b) * 100
]
export let xyz_awg3 = (x0, y0, z0) => {
  const x = x0 / 100, y = y0 / 100, z = z0 / 100
  return [
    1.789065550870615 * x - 0.4825338636668761 * y - 0.20007579286733604 * z,
    -0.6398486598670743 * x + 1.3963999568410177 * y + 0.19443229174628007 * z,
    -0.04153154580758554 * x + 0.08233537355363747 * y + 0.8788684803000081 * z
  ]
}
const lc3_cut = 0.010591, lc3_a = 5.555556, lc3_b = 0.052272, lc3_c = 0.247190, lc3_d = 0.385537, lc3_e = 5.367655, lc3_f = 0.092809
const lc3Enc = (x) => x > lc3_cut ? lc3_c * Math.log10(lc3_a * x + lc3_b) + lc3_d : lc3_e * x + lc3_f
const lc3Dec = (y) => y > lc3_e * lc3_cut + lc3_f ? (Math.pow(10, (y - lc3_d) / lc3_c) - lc3_b) / lc3_a : (y - lc3_f) / lc3_e
export let logc3_xyz = (r, g, b) => { const [x, y, z] = awg3_xyz(lc3Dec(r), lc3Dec(g), lc3Dec(b)); return [x, y, z] }
export let xyz_logc3 = (x, y, z) => { const [r, g, b] = xyz_awg3(x, y, z); return [lc3Enc(r), lc3Enc(g), lc3Enc(b)] }

// ---- xyz <-> cam16 (J, M, h) / hct (Li et al. 2017; spaces/cam16.js, spaces/hct.js) ----
// Viewing conditions are the library's environment() values: CAM16 = D65 [0.95047, 1, 1.08883],
// La = 64/π·0.2, Yb = 20, average, no discounting; HCT = precise D65, La = 200/π·Y(L*50),
// Yb = Y(L*50). ak / aki = (1.64 − 0.29^n)^±0.73, uk = (100/fl)·27.13^(1/0.42).
const CAM16 = { fl: 0.2731305366732074, flRoot: 0.7229238694926879, n: 0.2, z: 1.9272135954999579, nbb: 1.0003040045593807, ncb: 1.0003040045593807, c: 0.69, nc: 1, aW: 25.51850208110783, dR: 1.0208410446152913, dG: 0.9865253929974012, dB: 0.9350103262350229, dRi: 0.9795844370431389, dGi: 1.013658651970081, dBi: 1.0695069048345904, ak: 0.8952178848134279, aki: 1.1170464944502418, uk: 947557.2118517241 }
const HCT = { fl: 0.3884814537800353, flRoot: 0.7894826179304937, n: 0.18418651851244416, z: 1.909169568483652, nbb: 1.0169191804458755, ncb: 1.0169191804458755, c: 0.69, nc: 1, aW: 29.980990887425254, dR: 1.0211931250282207, dG: 0.98629630699647, dB: 0.9338046211456175, dRi: 0.9792467022066614, dGi: 1.0138940933939633, dBi: 1.0708878253067244, ak: 0.8834525670408592, aki: 1.1319226830134397, uk: 666201.197723509 }
const tau = 2 * Math.PI
const copySign = (a, b) => Math.sign(b) * Math.abs(a)
const zdiv = (a, b) => b === 0 ? 0 : a / b
const hue360 = (h) => { const r = h % 360; return r < 0 ? r + 360 : r }
const camAdapt = (c, fl) => { const x = spow(fl * Math.abs(c) * 0.01, 0.42); return (400 * copySign(x, c)) / (x + 27.13) }
const camUnadapt = (c, uk) => { const cabs = Math.abs(c); return copySign(uk * spow(cabs / (400 - cabs), 1 / 0.42), c) }
// XYZ (0-100) → [J, C, h°] under viewing conditions E (toCam16)
const toCam16 = (x, y, z, E) => {
  const ra = camAdapt((0.401288 * x + 0.650173 * y - 0.051461 * z) * E.dR, E.fl)
  const ga = camAdapt((-0.250268 * x + 1.204414 * y + 0.045854 * z) * E.dG, E.fl)
  const ba = camAdapt((-0.002079 * x + 0.048952 * y + 0.953127 * z) * E.dB, E.fl)
  const a = ra + (-12 * ga + ba) / 11, b = (ra + ga - 2 * ba) / 9
  const hRad = ((Math.atan2(b, a) % tau) + tau) % tau
  const et = 0.25 * (Math.cos(hRad + 2) + 3.8)
  const t = (5e4 / 13) * E.nc * E.ncb * zdiv(et * Math.sqrt(a * a + b * b), ra + ga + 1.05 * ba + 0.305)
  const alpha = spow(t, 0.9) * E.ak
  const A = E.nbb * (2 * ra + ga + 0.05 * ba)
  const Jroot = spow(A / E.aW, 0.5 * E.c * E.z)
  return [100 * spow(Jroot, 2), alpha * Jroot, hue360(hRad * (180 / Math.PI))]
}
// [J, C, h°] → XYZ (0-100) under viewing conditions E (fromCam16); J = 0 is black, not NaN
const fromCam16 = (J, C, h, E) => {
  const hRad = hue360(h) * (Math.PI / 180), cosh = Math.cos(hRad), sinh = Math.sin(hRad)
  const Jroot = spow(J, 1 / 2) * 0.1
  const t = spow(zdiv(C, Jroot) * E.aki, 10 / 9)
  const et = 0.25 * (Math.cos(hRad + 2) + 3.8)
  const A = E.aW * spow(Jroot, 2 / E.c / E.z)
  const p1 = (5e4 / 13) * E.nc * E.ncb * et, p2 = A / E.nbb
  const r = 23 * (p2 + 0.305) * zdiv(t, 23 * p1 + t * (11 * cosh + 108 * sinh))
  const a = r * cosh, b = r * sinh
  const rc = camUnadapt((460 * p2 + 451 * a + 288 * b) / 1403, E.uk) * E.dRi
  const gc = camUnadapt((460 * p2 - 891 * a - 261 * b) / 1403, E.uk) * E.dGi
  const bc = camUnadapt((460 * p2 - 220 * a - 6300 * b) / 1403, E.uk) * E.dBi
  return [
    1.8620678550872327 * rc - 1.0112546305316843 * gc + 0.14918677544445175 * bc,
    0.38752654323613717 * rc + 0.6214474419314753 * gc - 0.008973985167612518 * bc,
    -0.015841498849333856 * rc - 0.03412293802851557 * gc + 1.0499644368778496 * bc
  ]
}
export let xyz_cam16 = (x, y, z) => { const [J, C, h] = toCam16(x, y, z, CAM16); return [J, C * CAM16.flRoot, h] }
export let cam16_xyz = (J, M, h) => { const [x, y, z] = fromCam16(J, M / CAM16.flRoot, h, CAM16); return [x, y, z] }
// HCT: CAM16 hue and chroma, CIELAB L* as tone; the inverse Newton-solves J for the tone
export let xyz_hct = (x, y, z) => {
  const t = 116 * labF(y / 100) - 16
  if (t === 0) return [0, 0, 0]
  const [J, C, h] = toCam16(x, y, z, HCT)
  return [hue360(h), C, t]
}
export let hct_xyz = (h, c, t) => {
  if (t === 0) return [0, 0, 0]
  const y = labFInv((t + 16) / 116) * 100
  let j = t > 0 ? 0.00379058511492914 * t * t + 0.608983189401032 * t + 0.9155088574762233 : 9.514440756550361e-6 * t * t + 0.08693057439788597 * t - 21.928975842194614
  let last = Infinity, best = j
  for (let attempt = 0; attempt <= 15; attempt++) {
    const [X, Y, Z] = fromCam16(j, c, h, HCT)
    const delta = Math.abs(Y - y)
    if (delta < last) {
      if (delta <= 2e-12) return [X, Y, Z]
      best = j; last = delta
    }
    if (Y === 0) break
    j = j - ((Y - y) * j) / (2 * Y)
  }
  // no J reaches the tone at this chroma/hue: the coordinate names no color
  if (last > 1e-3) return [NaN, NaN, NaN]
  const [X, Y, Z] = fromCam16(best, c, h, HCT)
  return [X, Y, Z]
}

// ---- generic cartesian <-> cylindrical (serves every LCh-family space) ----

export let polar_fwd = (l, a, b) => {
  const c = Math.sqrt(a * a + b * b)
  const hr = Math.atan2(b, a) * 180 / Math.PI
  return [l, c, c < 1e-8 ? 0 : (hr < 0 ? hr + 360 : hr)]
}
export let polar_inv = (l, c, h) => {
  const hr = h * Math.PI / 180
  return [l, c * Math.cos(hr), c * Math.sin(hr)]
}

// ---- lchuv <-> hsluv / hpluv (gamut-bound rescale; getBounds unrolled over 6 lines) ----
// shared sub2 + the six sRGB-gamut boundary lines at lightness L (M_LRGB_INV literals)
const HM = [
  3.2409699419046056, -1.537383177570116, -0.4986107602930043,
  -0.969243636280911, 1.875967501507741, 0.04155505740717699,
  0.055630079696992636, -0.20397695888896836, 1.0569715142428788
]
const maxChromaForLH = (l, h) => {
  const sub1 = (l + 16) * (l + 16) * (l + 16) / 1560896
  const sub2 = sub1 > eps ? sub1 : l / kappa
  const hrad = h / 360 * 2 * Math.PI, sinh = Math.sin(hrad), cosh = Math.cos(hrad)
  let maxC = 1e300
  for (let c = 0; c < 3; c++) {
    const m1 = HM[c * 3], m2 = HM[c * 3 + 1], m3 = HM[c * 3 + 2]
    const top1 = (284517 * m1 - 94839 * m3) * sub2
    const base2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * l * sub2
    const baseB = (632260 * m3 - 126452 * m2) * sub2
    let len = base2 / baseB / (sinh - (top1 / baseB) * cosh)
    if (len >= 0 && len < maxC) maxC = len
    len = (base2 - 769860 * l) / (baseB + 126452) / (sinh - (top1 / (baseB + 126452)) * cosh)
    if (len >= 0 && len < maxC) maxC = len
  }
  return maxC
}
const maxSafeChromaForL = (l) => {
  const sub1 = (l + 16) * (l + 16) * (l + 16) / 1560896
  const sub2 = sub1 > eps ? sub1 : l / kappa
  let minDist = 1e300
  for (let c = 0; c < 3; c++) {
    const m1 = HM[c * 3], m2 = HM[c * 3 + 1], m3 = HM[c * 3 + 2]
    const top1 = (284517 * m1 - 94839 * m3) * sub2
    const base2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * l * sub2
    const baseB = (632260 * m3 - 126452 * m2) * sub2
    let slope = top1 / baseB, intercept = base2 / baseB
    let dist = Math.abs(intercept) / Math.sqrt(slope * slope + 1)
    if (dist < minDist) minDist = dist
    slope = top1 / (baseB + 126452); intercept = (base2 - 769860 * l) / (baseB + 126452)
    dist = Math.abs(intercept) / Math.sqrt(slope * slope + 1)
    if (dist < minDist) minDist = dist
  }
  return minDist
}
export let lchuv_hsluv = (l, c, h) => {
  if (l > 99.9999999) return [h, 0, 100]
  if (l < 1e-8) return [h, 0, 0]
  return [h, c / maxChromaForLH(l, h) * 100, l]
}
export let hsluv_lchuv = (h, s, l) => {
  if (l > 99.9999999) return [100, 0, h]
  if (l < 1e-8) return [0, 0, h]
  return [l, maxChromaForLH(l, h) / 100 * s, h]
}
export let lchuv_hpluv = (l, c, h) => {
  if (l > 99.9999999) return [h, 0, 100]
  if (l < 1e-8) return [h, 0, 0]
  return [h, c / maxSafeChromaForL(l) * 100, l]
}
export let hpluv_lchuv = (h, s, l) => {
  if (l > 99.9999999) return [100, 0, h]
  if (l < 1e-8) return [0, 0, h]
  return [l, maxSafeChromaForL(l) / 100 * s, h]
}

// ---- xyz <-> jzazbz (HDR; modified ST 2084 PQ, p = 1.7·m2) ----
const Yw_jz = 203, b_param = 1.15, g_param = 0.66, d = -0.56, d0 = 1.6295499532821566e-11
const n_val = 2610 / 16384, ninv = 16384 / 2610, c1 = 3424 / 4096, c2 = 2413 / 128, c3 = 2392 / 128
const p = 1.7 * 2523 / 32, pinv = 32 / (1.7 * 2523)
const xc00 = 0.41478972, xc01 = 0.579999, xc02 = 0.0146480, xc10 = -0.2015100, xc11 = 1.120649, xc12 = 0.0531008, xc20 = -0.0166008, xc21 = 0.264800, xc22 = 0.6684799
const cx00 = 1.9242264357876067, cx01 = -1.0047923125953657, cx02 = 0.037651404030618, cx10 = 0.35031676209499907, cx11 = 0.7264811939316552, cx12 = -0.06538442294808501, cx20 = -0.09098281098284752, cx21 = -0.3127282905230739, cx22 = 1.5227665613052603
const ci00 = 0.5, ci01 = 0.5, ci02 = 0, ci10 = 3.524000, ci11 = -4.066708, ci12 = 0.542708, ci20 = 0.199076, ci21 = 1.096799, ci22 = -1.295875
const ic00 = 1, ic01 = 0.13860504327153927, ic02 = 0.05804731615611883, ic10 = 1, ic11 = -0.1386050432715393, ic12 = -0.058047316156118904, ic20 = 1, ic21 = -0.09601924202631895, ic22 = -0.811891896056039
export let xyz_jzazbz = (X, Y, Z) => {
  const Xa = X / 100 * Yw_jz, Ya = Y / 100 * Yw_jz, Za = Z / 100 * Yw_jz
  const Xm = b_param * Xa - (b_param - 1) * Za, Ym = g_param * Ya - (g_param - 1) * Xa
  const L = xc00 * Xm + xc01 * Ym + xc02 * Za, M = xc10 * Xm + xc11 * Ym + xc12 * Za, S = xc20 * Xm + xc21 * Ym + xc22 * Za
  const PL = spow((c1 + c2 * spow(L / 10000, n_val)) / (1 + c3 * spow(L / 10000, n_val)), p)
  const PM = spow((c1 + c2 * spow(M / 10000, n_val)) / (1 + c3 * spow(M / 10000, n_val)), p)
  const PS = spow((c1 + c2 * spow(S / 10000, n_val)) / (1 + c3 * spow(S / 10000, n_val)), p)
  const Iz = ci00 * PL + ci01 * PM + ci02 * PS
  return [((1 + d) * Iz) / (1 + d * Iz) - d0, ci10 * PL + ci11 * PM + ci12 * PS, ci20 * PL + ci21 * PM + ci22 * PS]
}
export let jzazbz_xyz = (Jz, az, bz) => {
  const Iz = (Jz + d0) / (1 + d - d * (Jz + d0))
  const PL = ic00 * Iz + ic01 * az + ic02 * bz, PM = ic10 * Iz + ic11 * az + ic12 * bz, PS = ic20 * Iz + ic21 * az + ic22 * bz
  const pL = spow(PL, pinv), L = spow((c1 - pL) / (c3 * pL - c2), ninv) * 10000
  const pM = spow(PM, pinv), M = spow((c1 - pM) / (c3 * pM - c2), ninv) * 10000
  const pS = spow(PS, pinv), S = spow((c1 - pS) / (c3 * pS - c2), ninv) * 10000
  const Xm = cx00 * L + cx01 * M + cx02 * S, Ym = cx10 * L + cx11 * M + cx12 * S, Za = cx20 * L + cx21 * M + cx22 * S
  const Xa = (Xm + (b_param - 1) * Za) / b_param, Ya = (Ym + (g_param - 1) * Xa) / g_param
  return [Xa / Yw_jz * 100, Ya / Yw_jz * 100, Za / Yw_jz * 100]
}

// ---- xyz <-> ictcp (HDR; standard ST 2084 PQ) ----
const Yw_ict = 203, PQ_M1 = 2610 / 16384, PQ_M2 = 2523 / 32, PQ_C1 = 3424 / 4096, PQ_C2 = 2413 / 128, PQ_C3 = 2392 / 128
const xml00 = 0.3592832590121217, xml01 = 0.6976051147779502, xml02 = -0.035891593232029, xml10 = -0.1920808463704993, xml11 = 1.1004767970374321, xml12 = 0.0753748658519118, xml20 = 0.0070797844607479, xml21 = 0.0748396662186362, xml22 = 0.8433265453898765
const lmx00 = 2.0701522183894223, lmx01 = -1.3263473389671563, lmx02 = 0.2066510476294053, lmx10 = 0.3647385209748072, lmx11 = 0.6805660249472273, lmx12 = -0.0453045459220347, lmx20 = -0.0497472075358123, lmx21 = -0.0492609666966131, lmx22 = 1.1880659249923042
const lip00 = 2048 / 4096, lip01 = 2048 / 4096, lip02 = 0, lip10 = 6610 / 4096, lip11 = -13613 / 4096, lip12 = 7003 / 4096, lip20 = 17933 / 4096, lip21 = -17390 / 4096, lip22 = -543 / 4096
const ipl00 = 1, ipl01 = 0.0086090370379328, ipl02 = 0.111029625003026, ipl10 = 1, ipl11 = -0.0086090370379328, ipl12 = -0.1110296250030259, ipl20 = 1, ipl21 = 0.5600313357106791, ipl22 = -0.3206271749873188
const pqEnc = (v) => { const x = v / 10000 > 0 ? v / 10000 : 0, vp = x ** PQ_M1; return ((PQ_C1 + PQ_C2 * vp) / (1 + PQ_C3 * vp)) ** PQ_M2 }
const pqDec = (s) => { const vp = s ** (1 / PQ_M2), nm = vp - PQ_C1 > 0 ? vp - PQ_C1 : 0; return 10000 * (nm / (PQ_C2 - PQ_C3 * vp)) ** (1 / PQ_M1) }
export let xyz_ictcp = (X, Y, Z) => {
  const xa = X / 100 * Yw_ict, ya = Y / 100 * Yw_ict, za = Z / 100 * Yw_ict
  const pl = pqEnc(xml00 * xa + xml01 * ya + xml02 * za), pm = pqEnc(xml10 * xa + xml11 * ya + xml12 * za), ps = pqEnc(xml20 * xa + xml21 * ya + xml22 * za)
  return [lip00 * pl + lip01 * pm + lip02 * ps, lip10 * pl + lip11 * pm + lip12 * ps, lip20 * pl + lip21 * pm + lip22 * ps]
}
export let ictcp_xyz = (I, Ct, Cp) => {
  const l = pqDec(ipl00 * I + ipl01 * Ct + ipl02 * Cp), m = pqDec(ipl10 * I + ipl11 * Ct + ipl12 * Cp), s = pqDec(ipl20 * I + ipl21 * Ct + ipl22 * Cp)
  return [
    (lmx00 * l + lmx01 * m + lmx02 * s) / Yw_ict * 100,
    (lmx10 * l + lmx11 * m + lmx12 * s) / Yw_ict * 100,
    (lmx20 * l + lmx21 * m + lmx22 * s) / Yw_ict * 100
  ]
}

// ---- xyz <-> camera logs (log/pow transfer + gamut matrix); literals precomputed ----
const lc4_a = 2231.8263090676883, lc4_b = 0.9071358748778103, lc4_c = 0.09286412512218964, lc4_s = 0.1135972086105891, lc4_t = -0.01805699611991131
const lc4_decode = (v) => v >= 0 ? (Math.pow(2, 14 * (v - lc4_c) / lc4_b + 6) - 64) / lc4_a : v * lc4_s + lc4_t
const lc4_encode = (v) => v >= lc4_t ? (Math.log2(lc4_a * v + 64) - 6) / 14 * lc4_b + lc4_c : (v - lc4_t) / lc4_s
export let logc4_xyz = (r0, g0, b0) => {
  const r = lc4_decode(r0), g = lc4_decode(g0), b = lc4_decode(b0)
  return [
    (0.704858320407232064 * r + 0.129760295170463003 * g + 0.115837311473976537 * b) * 100,
    (0.254524176404027025 * r + 0.781477732712002049 * g - 0.036001909116029039 * b) * 100,
    1.089057750759878429 * b * 100
  ]
}
export let xyz_logc4 = (X, Y, Z) => {
  const x = X / 100, y = Y / 100, z = Z / 100
  return [
    lc4_encode(1.509215472242109 * x - 0.25059734520438 * y - 0.1688114752940731 * z),
    lc4_encode(-0.4915454516606189 * x + 1.3612455459293507 * y + 0.09728294201372903 * z),
    lc4_encode(0.9182249511582473 * z)
  ]
}
const sl3_decode = (v) => v >= 171.2102946929 / 1023 ? Math.pow(10, (v * 1023 - 420) / 261.5) * 0.19 - 0.01 : (v * 1023 - 95) * 0.01125 / (171.2102946929 - 95)
const sl3_encode = (l) => l >= 0.01125 ? (420 + Math.log10((l + 0.01) / 0.19) * 261.5) / 1023 : (l * (171.2102946929 - 95) / 0.01125 + 95) / 1023
export let slog3_xyz = (r0, g0, b0) => {
  const r = sl3_decode(r0), g = sl3_decode(g0), b = sl3_decode(b0)
  return [
    (0.7064827132 * r + 0.1288010498 * g + 0.1151721641 * b) * 100,
    (0.2709796708 * r + 0.7866064112 * g - 0.057586082 * b) * 100,
    (-0.0096778454 * r + 0.0046000375 * g + 1.0941355587 * b) * 100
  ]
}
export let xyz_slog3 = (X, Y, Z) => {
  const x = X / 100, y = Y / 100, z = Z / 100
  return [
    sl3_encode(1.5073998990431192 * x - 0.24582213740524175 * y - 0.17161168084331915 * z),
    sl3_encode(-0.5181517270645519 * x + 1.3553912409400366 * y + 0.12587866812835696 * z),
    sl3_encode(0.01551169817958099 * x - 0.007872771439249991 * y + 0.9119163655330013 * z)
  ]
}
const vl_decode = (v) => v < 0.181 ? (v - 0.125) / 5.6 : Math.pow(10, (v - 0.598206) / 0.241514) - 0.00873
const vl_encode = (l) => l < 0.01 ? 5.6 * l + 0.125 : 0.241514 * Math.log10(l + 0.00873) + 0.598206
export let vlog_xyz = (r0, g0, b0) => {
  const r = vl_decode(r0), g = vl_decode(g0), b = vl_decode(b0)
  return [
    (0.6796444698784739 * r + 0.1522114124397545 * g + 0.118600044733443 * b) * 100,
    (0.2606855500903736 * r + 0.7748944633296593 * g - 0.0355800134200329 * b) * 100,
    (-0.0093101982175133 * r - 0.0046124670436289 * g + 1.1029804160210204 * b) * 100
  ]
}
export let xyz_vlog = (X, Y, Z) => {
  const x = X / 100, y = Y / 100, z = Z / 100
  return [
    vl_encode(1.5890117738723923 * x - 0.31320448446022 * y - 0.18096485152800618 * z),
    vl_encode(-0.5340529104491584 * x + 1.3960114333501836 * y + 0.10245767101658204 * z),
    vl_encode(0.011179448842977967 * x + 0.003194128240850844 * y + 0.9055353562812193 * z)
  ]
}
const l3_decode = (v) => v >= 0 ? (Math.pow(10, v / 0.224282) - 1) / 155.975327 - 0.01 : v / 15.1927 - 0.01
const l3_encode = (l) => { const x = l + 0.01; return x < 0 ? x * 15.1927 : 0.224282 * Math.log10(x * 155.975327 + 1) }
export let log3g10_xyz = (r0, g0, b0) => {
  const r = l3_decode(r0), g = l3_decode(g0), b = l3_decode(b0)
  return [
    (0.7352752459058587 * r + 0.068609410613961 * g + 0.146571270531852 * b) * 100,
    (0.2866940994999349 * r + 0.8429791340169754 * g - 0.1296732335169103 * b) * 100,
    (-0.0796808568783677 * r - 0.3473432169944297 * g + 1.5160818246326759 * b) * 100
  ]
}
export let xyz_log3g10 = (X, Y, Z) => {
  const x = X / 100, y = Y / 100, z = Z / 100
  return [
    l3_encode(1.4128064803693583 * x - 0.17752320098966512 * y - 0.15177073202874272 * z),
    l3_encode(-0.48620327686049064 * x + 1.2906964267981604 * y + 0.15740061472978117 * z),
    l3_encode(-0.037139010852832395 * x + 0.28637599977945394 * y + 0.6876797788619603 * z)
  ]
}
const cl2_decode = (v) => v >= 0.092864125 ? (Math.pow(10, (v - 0.092864125) / 0.24136077) - 1) / 87.09937546 * 0.9 : -((Math.pow(10, (0.092864125 - v) / 0.24136077) - 1) / 87.09937546) * 0.9
const cl2_encode = (l) => { const s = l / 0.9; return s >= 0 ? 0.24136077 * Math.log10(s * 87.09937546 + 1) + 0.092864125 : 0.092864125 - 0.24136077 * Math.log10(-s * 87.09937546 + 1) }
export let clog2_xyz = (r0, g0, b0) => {
  const r = cl2_decode(r0), g = cl2_decode(g0), b = cl2_decode(b0)
  return [
    (0.71604964655152 * r + 0.12968347787574 * g + 0.104722802624412 * b) * 100,
    (0.261261357525555 * r + 0.86964214575496 * g - 0.130903503280514 * b) * 100,
    (-0.009676346575021 * r - 0.236481636126349 * g + 1.335215733461248 * b) * 100
  ]
}
export let xyz_clog2 = (X, Y, Z) => {
  const x = X / 100, y = Y / 100, z = Z / 100
  return [
    cl2_encode(1.4898182749321844 * x - 0.2608959021837425 * y - 0.1424265217774013 * z),
    cl2_encode(-0.45816657446927334 * x + 1.2616277830502276 * y + 0.15962363162996496 * z),
    cl2_encode(-0.07034966772250137 * x + 0.22155766722563822 * y + 0.7761816036271035 * z)
  ]
}

// ---- xyz <-> ipt (Ebner & Fairchild 1998) ----
const M1_00 = 0.4002, M1_01 = 0.7075, M1_02 = -0.0807, M1_10 = -0.228, M1_11 = 1.15, M1_12 = 0.0612, M1_20 = 0, M1_21 = 0, M1_22 = 0.9184
const M2_00 = 0.4, M2_01 = 0.4, M2_02 = 0.2, M2_10 = 4.455, M2_11 = -4.851, M2_12 = 0.396, M2_20 = 0.8056, M2_21 = 0.3572, M2_22 = -1.1628
const M2I_00 = 1, M2I_01 = 0.09756893051461392, M2I_02 = 0.2052264331645916, M2I_10 = 1.0000000000000002, M2I_11 = -0.11387648547314712, M2I_12 = 0.13321715836999806, M2I_20 = 0.9999999999999999, M2I_21 = 0.03261510991706641, M2I_22 = -0.6768871830691794
const M1I_00 = 1.8502429449432056, M1I_01 = -1.138301637867233, M1I_02 = 0.23843495850870133, M1I_10 = 0.3668307751713486, M1I_11 = 0.6438845448402355, M1I_12 = -0.010673443584379992, M1I_20 = 0, M1I_21 = 0, M1I_22 = 1.088850174216028
export let xyz_ipt = (X, Y, Z) => {
  const xn = X / 100, yn = Y / 100, zn = Z / 100
  const lp = spow(M1_00 * xn + M1_01 * yn + M1_02 * zn, 0.43), mp = spow(M1_10 * xn + M1_11 * yn + M1_12 * zn, 0.43), sp = spow(M1_20 * xn + M1_21 * yn + M1_22 * zn, 0.43)
  return [M2_00 * lp + M2_01 * mp + M2_02 * sp, M2_10 * lp + M2_11 * mp + M2_12 * sp, M2_20 * lp + M2_21 * mp + M2_22 * sp]
}
export let ipt_xyz = (ip, pp, tt) => {
  const l = spow(M2I_00 * ip + M2I_01 * pp + M2I_02 * tt, 1 / 0.43), m = spow(M2I_10 * ip + M2I_11 * pp + M2I_12 * tt, 1 / 0.43), s = spow(M2I_20 * ip + M2I_21 * pp + M2I_22 * tt, 1 / 0.43)
  return [
    (M1I_00 * l + M1I_01 * m + M1I_02 * s) * 100,
    (M1I_10 * l + M1I_11 * m + M1I_12 * s) * 100,
    (M1I_20 * l + M1I_21 * m + M1I_22 * s) * 100
  ]
}

// ---- xyz <-> din99d (Cui 2002; θ=50° literals) ----
const c1d = 325.22, c2d = 0.0036, c5d = 22.5, c6d = 0.06, scaled = 1.14
const cosθd = 0.6427876096865394, sinθd = 0.766044443118978, θd = 0.8726646259971648
const Xw = 95.04559270516716, Yw = 100, Zw = 108.90577507598784, Xcw = 93.38237082066868
export let xyz_din99d = (X, Y, Z) => {
  const fx = labF((1.12 * X - 0.12 * Z) / Xcw), fy = labF(Y / Yw), fz = labF(Z / Zw)
  const a = 500 * (fx - fy), b = 200 * (fy - fz)
  const e = a * cosθd + b * sinθd, f = scaled * (b * cosθd - a * sinθd)
  const G = Math.sqrt(e * e + f * f), L99 = c1d * Math.log1p(c2d * (116 * fy - 16))
  if (G === 0) return [L99, 0, 0]
  const h = Math.atan2(f, e) + θd, C99 = c5d * Math.log1p(c6d * G)
  return [L99, C99 * Math.cos(h), C99 * Math.sin(h)]
}
export let din99d_xyz = (L99, a99, b99) => {
  const L = Math.expm1(L99 / c1d) / c2d, C99 = Math.sqrt(a99 * a99 + b99 * b99), fy = (L + 16) / 116
  if (C99 === 0) { const yr = labFInv(fy); return [yr * Xw, yr * Yw, yr * Zw] }
  const h = Math.atan2(b99, a99) - θd, G = Math.expm1(C99 / c5d) / c6d
  const e = G * Math.cos(h), fv = G * Math.sin(h)
  const a = e * cosθd - (fv / scaled) * sinθd, b = e * sinθd + (fv / scaled) * cosθd
  const fx = a / 500 + fy, fz = fy - b / 200
  const xr = labFInv(fx), yr = labFInv(fy), zr = labFInv(fz)
  const Z2 = zr * Zw
  return [(xr * Xcw + 0.12 * Z2) / 1.12, yr * Yw, Z2]
}

// ---- lab-d65 <-> din99o-lab (DIN 6176; θ=26° literals) ----
const cosθo = 0.898794046299167, sinθo = 0.4383711467890774, θo = 0.4537856055185257, dfactor = 303.67100547050995
export let labd65_din99olab = (l, a, b) => {
  const e = a * cosθo + b * sinθo, f = 0.83 * (b * cosθo - a * sinθo)
  const G = Math.sqrt(e * e + f * f), L = dfactor * Math.log(1 + 0.0039 * l), c = Math.log(1 + 0.075 * G) / 0.0435
  if (c === 0) return [L, 0, 0]
  const h = Math.atan2(f, e) + θo
  return [L, c * Math.cos(h), c * Math.sin(h)]
}
export let din99olab_labd65 = (l, a, b) => {
  const L = (Math.exp(l / dfactor) - 1) / 0.0039, cv = Math.sqrt(a * a + b * b)
  if (cv === 0) return [L, 0, 0]
  const h = Math.atan2(b, a), G = (Math.exp(0.0435 * cv) - 1) / 0.075
  const e = G * Math.cos(h - θo), ff = G * Math.sin(h - θo)
  return [L, e * cosθo - (ff / 0.83) * sinθo, e * sinθo + (ff / 0.83) * cosθo]
}

// ---- batch loops: destructure the scalar kernel per pixel, in place ----

export let rgb_lrgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rgb_lrgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lrgb_rgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lrgb_rgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lrgb_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lrgb_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_lrgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_lrgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lrgb_oklab_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lrgb_oklab(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let oklab_lrgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = oklab_lrgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let oklab_oklrab_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = oklab_oklrab(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let oklrab_oklab_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = oklrab_oklab(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hsl_rgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hsl_rgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rgb_hsl_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rgb_hsl(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hsv_rgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hsv_rgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rgb_hsv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rgb_hsv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hsv_hsl_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hsv_hsl(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hsl_hsv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hsl_hsv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hwb_rgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hwb_rgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rgb_hwb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rgb_hwb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hwb_hsv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hwb_hsv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hsv_hwb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hsv_hwb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hsl_hwb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hsl_hwb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hwb_hsl_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hwb_hsl(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let ryb_rgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = ryb_rgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rgb_ryb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rgb_ryb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_xyzd50_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_xyzd50(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyzd50_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyzd50_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_lab_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_lab(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lab_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lab_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_labd65_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_labd65(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let labd65_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = labd65_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_luv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_luv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let luv_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = luv_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_xyy_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_xyy(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyy_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyy_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let munsell_xyy_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = munsell_xyy(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyy_munsell_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyy_munsell(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_lms_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_lms(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lms_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lms_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let p3linear_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = p3linear_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_p3linear_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_p3linear(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let p3_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = p3_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_p3_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_p3(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rec2020linear_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rec2020linear_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_rec2020linear_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_rec2020linear(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rec2020_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rec2020_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_rec2020_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_rec2020(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let a98rgblinear_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = a98rgblinear_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_a98rgblinear_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_a98rgblinear(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let a98rgb_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = a98rgb_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_a98rgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_a98rgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let prophotolinear_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = prophotolinear_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_prophotolinear_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_prophotolinear(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let prophoto_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = prophoto_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_prophoto_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_prophoto(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rec709_lrgb_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rec709_lrgb(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lrgb_rec709_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lrgb_rec709(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rec709_ycbcrbt709_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rec709_ycbcrbt709(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let ycbcrbt709_rec709_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = ycbcrbt709_rec709(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rec2020_ycbcrbt2020_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rec2020_ycbcrbt2020(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let ycbcrbt2020_rec2020_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = ycbcrbt2020_rec2020(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let rec2020linear_ictcphlg_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = rec2020linear_ictcphlg(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let ictcphlg_rec2020linear_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = ictcphlg_rec2020linear(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let acescg_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = acescg_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_acescg_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_acescg(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let acescct_acescg_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = acescct_acescg(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let acescg_acescct_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = acescg_acescct(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let acescc_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = acescc_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_acescc_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_acescc(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let awg3_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = awg3_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_awg3_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_awg3(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let logc3_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = logc3_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_logc3_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_logc3(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_cam16_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_cam16(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let cam16_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = cam16_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_hct_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_hct(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hct_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hct_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let polar_fwd_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = polar_fwd(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let polar_inv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = polar_inv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lchuv_hsluv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lchuv_hsluv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hsluv_lchuv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hsluv_lchuv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lchuv_hpluv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lchuv_hpluv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let hpluv_lchuv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = hpluv_lchuv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_jzazbz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_jzazbz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let jzazbz_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = jzazbz_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_ictcp_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_ictcp(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let ictcp_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = ictcp_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let logc4_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = logc4_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_logc4_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_logc4(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let slog3_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = slog3_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_slog3_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_slog3(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let vlog_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = vlog_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_vlog_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_vlog(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let log3g10_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = log3g10_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_log3g10_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_log3g10(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let clog2_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = clog2_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_clog2_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_clog2(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_ipt_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_ipt(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let ipt_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = ipt_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_din99d_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_din99d(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let din99d_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = din99d_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let labd65_din99olab_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = labd65_din99olab(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let din99olab_labd65_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = din99olab_labd65(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
