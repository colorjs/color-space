// color-space WASM batch kernel — jz source (valid JS; compiles AOT to WASM via jz).
//
// PRIMITIVE EDGES, composed like the library's hub-spoke graph (see ../wasm.js BFS).
// Each edge is a tight in-place loop over an interleaved 3-channel Float64Array in
// WASM linear memory; a conversion = a sequence of edge calls on the same buffer
// (zero-copy). Splitting into small kernels lets jz vectorize cbrt/atan2 independently
// — measured 1.6× faster than one fused loop. Formulas mirror the scalar library and
// are pinned bit-for-bit by test/wasm-batch.js. Ranges match the scalar API.
//
// Edges are generated/validated against the scalar lib; regenerate via scripts/build-wasm.js.

let buf
export let alloc = (n) => { buf = new Float64Array(n * 3); return buf }

// CIE 1976 companding (shared by lab/luv)
const eps = 216 / 24389, eps3 = 24 / 116, kappa = 24389 / 27
const labF = (t) => t > eps ? Math.cbrt(t) : (kappa * t + 16) / 116
const labFInv = (ft) => ft > eps3 ? ft * ft * ft : (116 * ft - 16) / kappa
// Oklab Lr toe (Björnsson)
const K1 = 0.206, K2 = 0.03, K3 = (1.0 + K1) / (1.0 + K2)

// ---- rgb / lrgb / xyz / oklab / oklrab (hub: lrgb, xyz) ----

export let rgb_lrgb = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const r = buf[j] / 255, g = buf[j + 1] / 255, b = buf[j + 2] / 255
    const ar = r < 0 ? -r : r, ag = g < 0 ? -g : g, ab = b < 0 ? -b : b
    const sr = r < 0 ? -1 : 1, sg = g < 0 ? -1 : 1, sb = b < 0 ? -1 : 1
    buf[j]     = sr * (ar > 0.04045 ? ((ar + 0.055) / 1.055) ** 2.4 : ar / 12.92)
    buf[j + 1] = sg * (ag > 0.04045 ? ((ag + 0.055) / 1.055) ** 2.4 : ag / 12.92)
    buf[j + 2] = sb * (ab > 0.04045 ? ((ab + 0.055) / 1.055) ** 2.4 : ab / 12.92)
  }
}
export let lrgb_rgb = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const r = buf[j], g = buf[j + 1], b = buf[j + 2]
    const ar = r < 0 ? -r : r, ag = g < 0 ? -g : g, ab = b < 0 ? -b : b
    const sr = r < 0 ? -1 : 1, sg = g < 0 ? -1 : 1, sb = b < 0 ? -1 : 1
    buf[j]     = 255 * (sr * (ar > 0.0031308 ? 1.055 * ar ** (1 / 2.4) - 0.055 : 12.92 * ar))
    buf[j + 1] = 255 * (sg * (ag > 0.0031308 ? 1.055 * ag ** (1 / 2.4) - 0.055 : 12.92 * ag))
    buf[j + 2] = 255 * (sb * (ab > 0.0031308 ? 1.055 * ab ** (1 / 2.4) - 0.055 : 12.92 * ab))
  }
}
export let lrgb_xyz = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const r = buf[j], g = buf[j + 1], b = buf[j + 2]
    buf[j]     = 100 * (0.41239079926595 * r + 0.35758433938387 * g + 0.18048078840183 * b)
    buf[j + 1] = 100 * (0.21263900587151 * r + 0.71516867876775 * g + 0.072192315360733 * b)
    buf[j + 2] = 100 * (0.019330818715591 * r + 0.11919477979462 * g + 0.95053215224966 * b)
  }
}
export let xyz_lrgb = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const x = buf[j] / 100, y = buf[j + 1] / 100, z = buf[j + 2] / 100
    buf[j]     =  3.2409699419046056 * x - 1.537383177570116  * y - 0.4986107602930043  * z
    buf[j + 1] = -0.969243636280911  * x + 1.875967501507741  * y + 0.04155505740717699 * z
    buf[j + 2] =  0.055630079696992636 * x - 0.20397695888896836 * y + 1.0569715142428788 * z
  }
}
export let lrgb_oklab = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const r = buf[j], g = buf[j + 1], b = buf[j + 2]
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    buf[j]     = 0.2104542553 * l + 0.793617785  * m - 0.0040720468 * s
    buf[j + 1] = 1.9779984951 * l - 2.428592205  * m + 0.4505937099 * s
    buf[j + 2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766  * s
  }
}
export let oklab_lrgb = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const L = buf[j], a = buf[j + 1], b = buf[j + 2]
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b
    const s_ = L - 0.0894841775 * a - 1.291485548  * b
    const l3 = l_ * l_ * l_, m3 = m_ * m_ * m_, s3 = s_ * s_ * s_
    buf[j]     =  4.0767416621 * l3 - 3.307711591  * m3 + 0.2309699292 * s3
    buf[j + 1] = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
    buf[j + 2] = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701  * s3
  }
}
export let oklab_oklrab = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const x = buf[j], kx = K3 * x - K1
    buf[j] = 0.5 * (kx + Math.sqrt(kx * kx + 4 * K2 * K3 * x))
  }
}
export let oklrab_oklab = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const x = buf[j]
    buf[j] = (x * x + K1 * x) / (K3 * (x + K2))
  }
}

// ---- xyz <-> lab / lab-d65 / luv (hub: xyz) ----

export let xyz_lab = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const x1 = buf[j] / 100, y1 = buf[j + 1] / 100, z1 = buf[j + 2] / 100
    const x50 = 1.0479298208405488 * x1 + 0.022946793341019088 * y1 + (-0.05019222954313557) * z1
    const y50 = 0.029627815688159344 * x1 + 0.990434484573249 * y1 + (-0.01707382502938514) * z1
    const z50 = (-0.009243058152591178) * x1 + 0.015055144896577895 * y1 + 0.7518742899580008 * z1
    const fx = labF(x50 / 0.9642956764295677), fy = labF(y50), fz = labF(z50 / 0.8251046025104602)
    buf[j] = 116 * fy - 16; buf[j + 1] = 500 * (fx - fy); buf[j + 2] = 200 * (fy - fz)
  }
}
export let lab_xyz = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const l = buf[j], a = buf[j + 1], b = buf[j + 2]
    const fy = (l + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200
    const x50 = labFInv(fx) * 0.9642956764295677, y50 = labFInv(fy), z50 = labFInv(fz) * 0.8251046025104602
    buf[j]     = (0.9554734527042182 * x50 + (-0.023098536874261423) * y50 + 0.0632593086610217 * z50) * 100
    buf[j + 1] = ((-0.028369706963208136) * x50 + 1.0099954580058226 * y50 + 0.021041398966943008 * z50) * 100
    buf[j + 2] = (0.012314001688319899 * x50 + (-0.020507696433477912) * y50 + 1.3303659366080753 * z50) * 100
  }
}
export let xyz_labd65 = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const fx = labF(buf[j] / 100 / 0.9504559270516716), fy = labF(buf[j + 1] / 100), fz = labF(buf[j + 2] / 100 / 1.0890577507598784)
    buf[j] = 116 * fy - 16; buf[j + 1] = 500 * (fx - fy); buf[j + 2] = 200 * (fy - fz)
  }
}
export let labd65_xyz = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const l = buf[j], a = buf[j + 1], b = buf[j + 2]
    const fy = (l + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200
    buf[j] = labFInv(fx) * 0.9504559270516716 * 100; buf[j + 1] = labFInv(fy) * 100; buf[j + 2] = labFInv(fz) * 1.0890577507598784 * 100
  }
}
export let xyz_luv = (n) => {
  const xn = 95.04559270516717, yn = 100, zn = 108.90577507598783
  const dn = xn + 15 * yn + 3 * zn, un = 4 * xn / dn, vn = 9 * yn / dn
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const x = buf[j], y = buf[j + 1], z = buf[j + 2]
    const denom = x + 15 * y + 3 * z
    const _u = denom === 0 ? 0 : (4 * x) / denom, _v = denom === 0 ? 0 : (9 * y) / denom
    const l = 116 * labF(y / yn) - 16
    buf[j] = l; buf[j + 1] = 13 * l * (_u - un); buf[j + 2] = 13 * l * (_v - vn)
  }
}
export let luv_xyz = (n) => {
  const xn = 95.04559270516717, yn = 100, zn = 108.90577507598783
  const dn = xn + 15 * yn + 3 * zn, un = 4 * xn / dn, vn = 9 * yn / dn
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const l = buf[j], u = buf[j + 1], v = buf[j + 2]
    if (l === 0) { buf[j] = 0; buf[j + 1] = 0; buf[j + 2] = 0 }
    else {
      const _u = u / (13 * l) + un, _v = v / (13 * l) + vn
      const y = yn * labFInv((l + 16) / 116)
      buf[j] = y * 9 * _u / (4 * _v); buf[j + 1] = y; buf[j + 2] = y * (12 - 3 * _u - 20 * _v) / (4 * _v)
    }
  }
}

// ---- generic cartesian <-> cylindrical (serves every LCh-family space) ----

export let polar_fwd = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const a = buf[j + 1], b = buf[j + 2]
    const c = Math.sqrt(a * a + b * b)
    const hr = Math.atan2(b, a) * 180 / Math.PI
    buf[j + 1] = c
    buf[j + 2] = c < 1e-8 ? 0 : (hr < 0 ? hr + 360 : hr)
  }
}
export let polar_inv = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const c = buf[j + 1], hr = buf[j + 2] * Math.PI / 180
    buf[j + 1] = c * Math.cos(hr)
    buf[j + 2] = c * Math.sin(hr)
  }
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
export let lchuv_hsluv = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const l = buf[j], c = buf[j + 1], h = buf[j + 2]
    if (l > 99.9999999) { buf[j] = h; buf[j + 1] = 0; buf[j + 2] = 100 }
    else if (l < 1e-8) { buf[j] = h; buf[j + 1] = 0; buf[j + 2] = 0 }
    else { buf[j] = h; buf[j + 1] = c / maxChromaForLH(l, h) * 100; buf[j + 2] = l }
  }
}
export let hsluv_lchuv = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const h = buf[j], s = buf[j + 1], l = buf[j + 2]
    if (l > 99.9999999) { buf[j] = 100; buf[j + 1] = 0; buf[j + 2] = h }
    else if (l < 1e-8) { buf[j] = 0; buf[j + 1] = 0; buf[j + 2] = h }
    else { buf[j] = l; buf[j + 1] = maxChromaForLH(l, h) / 100 * s; buf[j + 2] = h }
  }
}
export let lchuv_hpluv = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const l = buf[j], c = buf[j + 1], h = buf[j + 2]
    if (l > 99.9999999) { buf[j] = h; buf[j + 1] = 0; buf[j + 2] = 100 }
    else if (l < 1e-8) { buf[j] = h; buf[j + 1] = 0; buf[j + 2] = 0 }
    else { buf[j] = h; buf[j + 1] = c / maxSafeChromaForL(l) * 100; buf[j + 2] = l }
  }
}
export let hpluv_lchuv = (n) => {
  for (let i = 0; i < n; i++) {
    const j = 3 * i
    const h = buf[j], s = buf[j + 1], l = buf[j + 2]
    if (l > 99.9999999) { buf[j] = 100; buf[j + 1] = 0; buf[j + 2] = h }
    else if (l < 1e-8) { buf[j] = 0; buf[j + 1] = 0; buf[j + 2] = h }
    else { buf[j] = l; buf[j + 1] = maxSafeChromaForL(l) / 100 * s; buf[j + 2] = h }
  }
}
