// Pin the ICC exporter to published reference values and to the library itself.
//
// The colorant matrix is checked against Bruce Lindbloom's D50-adapted sRGB and
// ProPhoto matrices (the values the classic sRGB/ROMM .icc profiles carry), the
// TRC against the IEC 61966-2-1 formula, the PCS illuminant against the ICC
// spec's exact fixed-point D50 — and the structure by parsing the bytes back.
// CLUT profiles are verified differentially: the parsed mft2 lattice, applied the
// way a CMM applies it (trilinear), must reproduce the direct conversion routed
// through Lindbloom's D65→D50 Bradford and the CIE L*a*b* formula.
import test, { is } from 'tst'
import space from '../index.js'
import { profile, colorants, clut, kind } from '../icc.js'

// minimal ICC reader — headers + tag table + the tag types we emit
function parse(u8) {
	const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength)
	const four = (o) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3))
	const out = {
		size: v.getUint32(0), version: v.getUint32(8), class: four(12), space: four(16), pcs: four(20),
		magic: four(36), illuminant: [v.getInt32(68), v.getInt32(72), v.getInt32(76)], tags: {},
	}
	const n = v.getUint32(128)
	for (let i = 0; i < n; i++) {
		const sig = four(132 + 12 * i), off = v.getUint32(136 + 12 * i), size = v.getUint32(140 + 12 * i)
		const type = four(off)
		let val = null
		if (type === 'XYZ ') val = [v.getInt32(off + 8) / 65536, v.getInt32(off + 12) / 65536, v.getInt32(off + 16) / 65536]
		else if (type === 'sf32') val = Array.from({ length: 9 }, (_, k) => v.getInt32(off + 8 + 4 * k) / 65536)
		else if (type === 'curv') { const c = v.getUint32(off + 8); val = Array.from({ length: c }, (_, k) => v.getUint16(off + 12 + 2 * k) / 65535) }
		else if (type === 'desc') { const c = v.getUint32(off + 8); val = new TextDecoder().decode(u8.subarray(off + 12, off + 12 + c - 1)) }
		else if (type === 'text') val = new TextDecoder().decode(u8.subarray(off + 8, off + size - 1))
		else if (type === 'mft2') {
			const nin = v.getUint8(off + 8), nout = v.getUint8(off + 9), g = v.getUint8(off + 10)
			const nit = v.getUint16(off + 48), start = off + 52 + 2 * nit * nin
			const clut2 = new Float64Array(g ** nin * nout)
			for (let k = 0; k < clut2.length; k++) clut2[k] = v.getUint16(start + 2 * k)
			val = { nin, nout, g, clut: clut2 }
		}
		out.tags[sig] = { type, size, val }
	}
	return out
}
const near = (got, exp, tol, msg) => is(Math.abs(got - exp) <= tol, true, `${msg}: ${got} ≈ ${exp} (±${tol})`)
// apply an mft2 lattice the way a CMM does — multilinear over the grid, first
// input channel varying slowest (the ICC CLUT order)
const applyLUT = ({ nin, g, clut: c }, f) => {
	const i = [], fr = []
	for (let ch = 0; ch < nin; ch++) {
		const x = Math.min(0.999999, Math.max(0, f[ch])) * (g - 1), i0 = Math.min(g - 2, Math.floor(x))
		i.push(i0); fr.push(x - i0)
	}
	const out = [0, 0, 0]
	for (let m = 0; m < (1 << nin); m++) {
		let w = 1, idx = 0
		for (let ch = 0; ch < nin; ch++) { const b = (m >> ch) & 1; w *= b ? fr[ch] : 1 - fr[ch]; idx = idx * g + (i[ch] + b) }
		for (let o = 0; o < 3; o++) out[o] += w * c[idx * 3 + o]
	}
	return out
}
// the independent PCS route: device → xyz (the library) → Lindbloom's D65→D50
// Bradford → CIE L*a*b* — http://www.brucelindbloom.com/Eqn_ChromAdapt.html
const BFD = [1.0478112, 0.0228866, -0.0501270, 0.0295424, 0.9904844, -0.0170491, -0.0092345, 0.0150436, 0.7521316]
const D50W = [0.96420288, 1, 0.82490540]
const fCIE = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (t * 24389 / 27 + 16) / 116)
const labOf = (s, v) => {
	const w = s.xyz(...v).map((x) => x / 100)
	const [X, Y, Z] = [0, 1, 2].map((r) => BFD[r * 3] * w[0] + BFD[r * 3 + 1] * w[1] + BFD[r * 3 + 2] * w[2])
	const fx = fCIE(X / D50W[0]), fy = fCIE(Y / D50W[1]), fz = fCIE(Z / D50W[2])
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
const rnd = (s) => () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }

test('icc: sRGB profile — header, D50 PCS, Lindbloom colorants, IEC TRC', () => {
	const p = parse(profile(space.rgb))
	is(p.magic, 'acsp', 'signature')
	is([p.class, p.space, p.pcs], ['mntr', 'RGB ', 'XYZ '], 'display RGB→XYZ profile')
	is(p.illuminant, [0x0000f6d6, 0x00010000, 0x0000d32d], 'PCS illuminant = the ICC spec exact D50 words')
	// Bradford D65→D50 sRGB colorants — http://www.brucelindbloom.com/Eqn_RGB_XYZ_Matrix.html
	// (sRGB D50): rXYZ [0.4360747, 0.2225045, 0.0139322], gXYZ [0.3850649, 0.7168786, 0.0971045], bXYZ [0.1430804, 0.0606169, 0.7141733]
	const tol = 2e-3
	;[['rXYZ', [0.4360747, 0.2225045, 0.0139322]], ['gXYZ', [0.3850649, 0.7168786, 0.0971045]], ['bXYZ', [0.1430804, 0.0606169, 0.7141733]]]
		.forEach(([t2, exp]) => exp.forEach((e, i) => near(p.tags[t2].val[i], e, tol, `${t2}[${i}] (Lindbloom)`)))
	// colorant rows sum to the white point (matrix maps [1,1,1] → D50)
	for (let i = 0; i < 3; i++)
		near(p.tags.rXYZ.val[i] + p.tags.gXYZ.val[i] + p.tags.bXYZ.val[i], p.tags.wtpt.val[i], 3e-3, `column sum → wtpt[${i}]`)
	// TRC = sRGB EOTF (IEC 61966-2-1): decode(0.5) = ((0.5+0.055)/1.055)^2.4
	const trc = p.tags.rTRC.val
	is(trc.length, 1024, '1024-point curve')
	near(trc[512], ((512 / 1023 + 0.055) / 1.055) ** 2.4, 2e-3, 'TRC mid = IEC 61966-2-1 decode')
	near(trc[10], (10 / 1023) / 12.92, 1e-3, 'TRC toe = linear segment /12.92')
	is(p.tags.rTRC.val.length === p.tags.bTRC.val.length, true, 'shared transfer across channels')
	is(/public domain/.test(p.tags.cprt.val), true, 'copyright text')
})

test('icc: prophoto — ROMM D50 colorants; linear spaces — identity curve', () => {
	// ProPhoto is D50-native: hub D65 → Bradford back to D50 must land on the ROMM matrix
	// http://www.brucelindbloom.com/Eqn_RGB_XYZ_Matrix.html — ProPhoto D50 RGB→XYZ:
	// [0.7976749 0.1351917 0.0313534 / 0.2880402 0.7118741 0.0000857 / 0 0 0.8252100]
	const p = parse(profile(space.prophoto))
	near(p.tags.rXYZ.val[0], 0.7976749, 3e-3, 'ROMM rX (Lindbloom)')
	near(p.tags.gXYZ.val[1], 0.7118741, 3e-3, 'ROMM gY (Lindbloom)')
	near(p.tags.bXYZ.val[2], 0.8252100, 3e-3, 'ROMM bZ (Lindbloom)')
	near(p.tags.rXYZ.val[2], 0.0, 3e-3, 'ROMM rZ = 0 (Lindbloom)')
	// linear working spaces carry the identity TRC (curv count 0 per ICC spec)
	const lin = parse(profile(space['rec2020-linear']))
	is(lin.tags.rTRC.val.length, 0, 'linear space → identity curve')
	// dci-p3: pure gamma 2.6 (SMPTE RP 431-2)
	const dci = parse(profile(space['dci-p3']))
	near(dci.tags.rTRC.val[512], (512 / 1023) ** 2.6, 2e-3, 'DCI TRC = gamma 2.6')
})

test('icc: the matrix gate refuses spaces a matrix/TRC profile would lie about', () => {
	const throws = (fn, re, msg) => { let e = null; try { fn() } catch (err) { e = err } is(re.test(e?.message || ''), true, `${msg} (got: ${e?.message})`) }
	throws(() => colorants(space.oklab), /0-based bounded/, 'oklab — signed domain')
	throws(() => colorants(space.cmyk), /3-channel/, 'cmyk — four channels')
	throws(() => colorants(space.yuv), /0-based bounded/, 'yuv — signed chroma')
	throws(() => colorants(space.hsl), /matrix×transfer|not monotone/, 'hsl — not matrix×transfer')
	throws(() => colorants(space.xyy), /matrix×transfer|not monotone/, 'xyy — chromaticity, not additive RGB')
})

test('icc: CLUT — non-matrix spaces ship as mft2 profiles, classed by their inverse', () => {
	// a hue wheel: forward table only — a lattice cannot interpolate a device hue
	// across the 360→0 seam, so no reverse table rather than a wrong one
	const p = parse(profile(space.hsl, { xyz: space.xyz }))
	is([p.class, p.space, p.pcs], ['scnr', 'HLS ', 'Lab '], 'hsl: input class, ICC HLS signature, Lab PCS')
	is(p.tags.A2B0.val.nin, 3, 'hsl: device→PCS lattice, 3 inputs')
	is('B2A0' in p.tags, false, 'hsl: no reverse table — the hue seam')
	is(kind(space.hsl, { xyz: space.xyz }), 'scnr', 'kind agrees: input profile')
	// a continuous inverse: both tables, colour-space conversion class
	const q = parse(profile(space.oklab, { xyz: space.xyz }))
	is([q.class, q.space, q.pcs], ['spac', '3CLR', 'Lab '], 'oklab: colour-space class, N-colour signature')
	is(!!q.tags.A2B0.val && !!q.tags.B2A0.val, true, 'oklab: A2B and B2A lattices present')
	is(kind(space.oklab, { xyz: space.xyz }), 'spac', 'kind agrees: colour-space conversion')
	// the measured dataset the matrix gate refuses; its hue wraps 100→0 like a wheel
	is(kind(space.munsell, { xyz: space.xyz }), 'scnr', 'munsell: CLUT input profile')
	// 1- and 4-channel scales ride the same mechanism
	const k = parse(profile(space.kelvin))
	is([k.class, k.space, k.tags.A2B0.val.nin], ['scnr', 'GRAY', 1], 'kelvin: 1-channel GRAY lattice')
	const c = parse(profile(space.cmyk))
	is([c.class, c.space, c.tags.A2B0.val.nin], ['scnr', 'CMYK', 4], 'cmyk: 4-channel CMYK lattice')
	is(kind(space.rgb), 'mntr', 'true RGB stays a matrix display profile')
})

test('icc: CLUT lattice ≈ the direct conversion — differential, in Lab ΔE', () => {
	// trilinear over the parsed bytes (what a CMM computes) vs the direct route
	// through Lindbloom's Bradford; samples limited to the Lab16-encodable box,
	// where the encoding is not saturating by design
	const dE = (s, n = 300) => {
		const t = parse(profile(space[s], { xyz: space.xyz })).tags.A2B0.val
		const r = space[s].range, R = rnd(0xdecade), es = []
		for (let k2 = 0; k2 < n * 10 && es.length < n; k2++) {
			const f = r.map(() => R())
			let want
			try { want = labOf(space[s], f.map((x, c) => r[c][0] + x * (r[c][1] - r[c][0]))) } catch { continue }
			if (!want.every(isFinite) || want[0] < 0 || want[0] > 100 || Math.abs(want[1]) > 127 || Math.abs(want[2]) > 127) continue
			const g = applyLUT(t, f), got = [g[0] / 652.8, g[1] / 256 - 128, g[2] / 256 - 128]
			es.push(Math.hypot(want[0] - got[0], want[1] - got[1], want[2] - got[2]))
		}
		es.sort((a, b) => a - b)
		return { med: es[es.length >> 1], p95: es[Math.floor(es.length * 0.95)], max: es[es.length - 1] }
	}
	const lab = dE('lab')
	is(lab.max < 0.5, true, `lab: near-identity lattice (max ΔE ${lab.max.toFixed(3)} < 0.5)`)
	const hsl = dE('hsl')
	is(hsl.med < 0.2 && hsl.p95 < 2, true, `hsl: med ΔE ${hsl.med.toFixed(3)} < 0.2, p95 ${hsl.p95.toFixed(2)} < 2`)
	const mun = dE('munsell')
	is(mun.med < 1.5 && mun.p95 < 8, true, `munsell: med ΔE ${mun.med.toFixed(3)} < 1.5, p95 ${mun.p95.toFixed(2)} < 8 (renotation lattice)`)
	const okl = dE('oklch')
	is(okl.med < 1 && okl.p95 < 4, true, `oklch: med ΔE ${okl.med.toFixed(3)} < 1, p95 ${okl.p95.toFixed(2)} < 4`)
	// B2A roundtrip: PCS Lab of a device colour, read back through the reverse lattice
	const t2 = parse(profile(space.oklab, { xyz: space.xyz })).tags.B2A0.val
	const r2 = space.oklab.range, R2 = rnd(0x0b2a), ds = []
	for (let k2 = 0; k2 < 2000 && ds.length < 600; k2++) {
		const f = r2.map(() => R2())
		let L
		try { L = labOf(space.oklab, f.map((x, c) => r2[c][0] + x * (r2[c][1] - r2[c][0]))) } catch { continue }
		const pf = [L[0] * 652.8 / 65535, (L[1] + 128) * 256 / 65535, (L[2] + 128) * 256 / 65535]
		if (pf.some((x) => x < 0 || x > 1)) continue
		const dv = applyLUT(t2, pf)
		for (let c = 0; c < 3; c++) ds.push(Math.abs(dv[c] / 65535 - f[c]))
	}
	ds.sort((a, b) => a - b)
	is(ds[ds.length >> 1] < 0.01, true, `oklab B2A: device roundtrip median ${ds[ds.length >> 1].toFixed(4)} < 1% of range`)
})

test('icc: deterministic bytes; every RGB working space with a gamut builds', async () => {
	const a = profile(space.p3), b = profile(space.p3)
	is(a.length === b.length && a.every((x, i) => x === b[i]), true, 'reproducible byte-for-byte')
	const meta = (await import('../data.json', { with: { type: 'json' } })).default.spaces
	const gamutSpaces = Object.keys(meta).filter((n) => meta[n].gamut && !/pq|hlg/.test(n) && n !== 'scrgb')
	const built = gamutSpaces.filter((n) => { try { profile(space[n]); return true } catch { return false } })
	is(built.length, gamutSpaces.length, `all ${gamutSpaces.length} SDR gamut spaces build: ${built.length}`)
})
