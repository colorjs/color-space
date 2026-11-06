// A log curve's footroom: the codes under its black decode to light below zero – sensor noise kept for the grade, no
// color (Samsung Log's code 0 is Y −5, ARRI LogC4's −1.8). Counted as reach, a log space reached past its own primaries:
// one negative channel at low light swings the chromaticity anywhere. A log space reaches what its non-negative light
// reaches – the triangle of its primaries. scRGB is no log curve: its negative range carries colors by design (IEC 61966-2-2).
//
// footroom(sp, m): for a 3-channel log space whose curve dips under black, { z, tri }: its black code (each channel's light
// 0 – one curve for all three) and its primaries' xy in the hub's XYZ, read from the conversion itself (no table to drift
// from); null where there is none to cut, or the space is no per-channel curve over one matrix (LogLuv)
export const footroom = (sp, m) => {
	if (m?.encoding !== 'log' || m.range?.length !== 3 || typeof sp?.xyz !== 'function') return null
	const X = (...c) => { try { const v = sp.xyz(...c); return v.every(isFinite) ? v : null } catch { return null } }
	const [lo, hi] = m.range[0]
	if (m.range.some(r => r[0] !== lo || r[1] !== hi)) return null
	const Y = t => X(t, t, t)?.[1]
	if (!(Y(lo) < 0) || !(Y(hi) > 0)) return null   // no code under black: nothing to cut
	let a = lo, b = hi
	for (let i = 0; i < 60; i++) { const md = (a + b) / 2; if (Y(md) < 0) a = md; else b = md }
	const z = (a + b) / 2, P = [0, 1, 2].map(k => { const c = [z, z, z]; c[k] = hi; return X(...c) })
	if (P.some(p => !p)) return null
	// one matrix over one curve: the primaries add up to the white, and a half code lies on its primary's line
	const W = X(hi, hi, hi), H = X((z + hi) / 2, z, z), n = W && Math.hypot(...W)
	if (!W || !H) return null
	if (Math.hypot(...W.map((w, k) => w - P[0][k] - P[1][k] - P[2][k])) > n * 1e-3) return null
	const cr = Math.hypot(H[1] * P[0][2] - H[2] * P[0][1], H[2] * P[0][0] - H[0] * P[0][2], H[0] * P[0][1] - H[1] * P[0][0])
	if (cr > Math.hypot(...H) * Math.hypot(...P[0]) * 1e-4) return null
	return { z, tri: P.map(p => { const s = p[0] + p[1] + p[2]; return [p[0] / s, p[1] / s] }) }
}
// a chromaticity inside the triangle (its barycentric weights non-negative, a hair's tolerance)
export const inTri = (tri, x, y, eps = 1e-4) => {
	const [[x1, y1], [x2, y2], [x3, y3]] = tri, d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
	const l1 = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d, l2 = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d
	return l1 >= -eps && l2 >= -eps && 1 - l1 - l2 >= -eps
}
