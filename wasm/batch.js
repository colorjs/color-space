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
// pinned by test/wasm-batch.js. Ranges match the scalar API.
//
// Regenerate ../wasm/binary.js via scripts/build-wasm.js after changes.

let buf
export let alloc = (n) => { buf = new Float64Array(n * 3); return buf }

// CIE 1976 companding (shared by lab/luv)
const eps = 216 / 24389, eps3 = 24 / 116, kappa = 24389 / 27
const labF = (t) => t > eps ? Math.cbrt(t) : (kappa * t + 16) / 116
const labFInv = (ft) => ft > eps3 ? ft * ft * ft : (116 * ft - 16) / kappa
// Oklab Lr toe (Björnsson)
const K1 = 0.206, K2 = 0.03, K3 = (1.0 + K1) / (1.0 + K2)

// ---- rgb / lrgb / xyz / oklab / oklrab (hub: lrgb, xyz) ----

export let rgb_lrgb = (r0, g0, b0) => {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255
  const ar = r < 0 ? -r : r, ag = g < 0 ? -g : g, ab = b < 0 ? -b : b
  const sr = r < 0 ? -1 : 1, sg = g < 0 ? -1 : 1, sb = b < 0 ? -1 : 1
  return [
    sr * (ar > 0.04045 ? ((ar + 0.055) / 1.055) ** 2.4 : ar / 12.92),
    sg * (ag > 0.04045 ? ((ag + 0.055) / 1.055) ** 2.4 : ag / 12.92),
    sb * (ab > 0.04045 ? ((ab + 0.055) / 1.055) ** 2.4 : ab / 12.92)
  ]
}
export let lrgb_rgb = (r, g, b) => {
  const ar = r < 0 ? -r : r, ag = g < 0 ? -g : g, ab = b < 0 ? -b : b
  const sr = r < 0 ? -1 : 1, sg = g < 0 ? -1 : 1, sb = b < 0 ? -1 : 1
  return [
    255 * (sr * (ar > 0.0031308 ? 1.055 * ar ** (1 / 2.4) - 0.055 : 12.92 * ar)),
    255 * (sg * (ag > 0.0031308 ? 1.055 * ag ** (1 / 2.4) - 0.055 : 12.92 * ag)),
    255 * (sb * (ab > 0.0031308 ? 1.055 * ab ** (1 / 2.4) - 0.055 : 12.92 * ab))
  ]
}
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
export let oklab_oklrab = (l, a, b) => {
  const kx = K3 * l - K1
  return [0.5 * (kx + Math.sqrt(kx * kx + 4 * K2 * K3 * l)), a, b]
}
export let oklrab_oklab = (l, a, b) => [(l * l + K1 * l) / (K3 * (l + K2)), a, b]

// ---- xyz <-> lab / lab-d65 / luv (hub: xyz) ----

export let xyz_lab = (X, Y, Z) => {
  const x1 = X / 100, y1 = Y / 100, z1 = Z / 100
  const x50 = 1.0479298208405488 * x1 + 0.022946793341019088 * y1 + (-0.05019222954313557) * z1
  const y50 = 0.029627815688159344 * x1 + 0.990434484573249 * y1 + (-0.01707382502938514) * z1
  const z50 = (-0.009243058152591178) * x1 + 0.015055144896577895 * y1 + 0.7518742899580008 * z1
  const fx = labF(x50 / 0.9642956764295677), fy = labF(y50), fz = labF(z50 / 0.8251046025104602)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
export let lab_xyz = (l, a, b) => {
  const fy = (l + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200
  const x50 = labFInv(fx) * 0.9642956764295677, y50 = labFInv(fy), z50 = labFInv(fz) * 0.8251046025104602
  return [
    (0.9554734527042182 * x50 + (-0.023098536874261423) * y50 + 0.0632593086610217 * z50) * 100,
    ((-0.028369706963208136) * x50 + 1.0099954580058226 * y50 + 0.021041398966943008 * z50) * 100,
    (0.012314001688319899 * x50 + (-0.020507696433477912) * y50 + 1.3303659366080753 * z50) * 100
  ]
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

// sign-extended power (shared by jzazbz + ipt); out-of-gamut safe
const spow = (a, e) => { const s = a < 0 ? -1 : 1, av = a < 0 ? -a : a; return s * av ** e }

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
export let xyz_lab_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_lab(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let lab_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = lab_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_labd65_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_labd65(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let labd65_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = labd65_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let xyz_luv_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = xyz_luv(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
export let luv_xyz_n = (n) => { for (let i = 0; i < n; i++) { const j = 3 * i; const [x, y, z] = luv_xyz(buf[j], buf[j + 1], buf[j + 2]); buf[j] = x; buf[j + 1] = y; buf[j + 2] = z } }
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
