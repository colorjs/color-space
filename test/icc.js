// Pin the ICC exporter to published reference values and to the library itself.
//
// The colorant matrix is checked against Bruce Lindbloom's D50-adapted sRGB and
// ProPhoto matrices (the values the classic sRGB/ROMM .icc profiles carry), the
// TRC against the IEC 61966-2-1 formula, the PCS illuminant against the ICC
// spec's exact fixed-point D50 — and the structure by parsing the bytes back.
import test, { is } from 'tst'
import space from '../index.js'
import { profile, colorants } from '../icc.js'

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
		out.tags[sig] = { type, size, val }
	}
	return out
}
const near = (got, exp, tol, msg) => is(Math.abs(got - exp) <= tol, true, `${msg}: ${got} ≈ ${exp} (±${tol})`)

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

test('icc: refuses spaces a matrix/TRC profile would lie about', () => {
	const throws = (fn, re, msg) => { let e = null; try { fn() } catch (err) { e = err } is(re.test(e?.message || ''), true, `${msg} (got: ${e?.message})`) }
	throws(() => profile(space.oklab), /0-based bounded/, 'oklab — signed domain')
	throws(() => profile(space.cmyk), /3-channel/, 'cmyk — four channels')
	throws(() => profile(space.yuv), /0-based bounded/, 'yuv — signed chroma')
	throws(() => profile(space.hsl), /matrix×transfer|not monotone/, 'hsl — not matrix×transfer')
	throws(() => profile(space.xyy), /matrix×transfer|not monotone/, 'xyy — chromaticity, not additive RGB')
})

test('icc: deterministic bytes; every RGB working space with a gamut builds', async () => {
	const a = profile(space.p3), b = profile(space.p3)
	is(a.length === b.length && a.every((x, i) => x === b[i]), true, 'reproducible byte-for-byte')
	const meta = (await import('../data.json', { with: { type: 'json' } })).default.spaces
	const gamutSpaces = Object.keys(meta).filter((n) => meta[n].gamut && !/pq|hlg/.test(n) && n !== 'scrgb')
	const built = gamutSpaces.filter((n) => { try { profile(space[n]); return true } catch { return false } })
	is(built.length, gamutSpaces.length, `all ${gamutSpaces.length} SDR gamut spaces build: ${built.length}`)
})
