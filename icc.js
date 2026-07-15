/**
 * color-space/icc — any space as an ICC profile.
 *
 * The color-management analog of the LUT exporter. Everything is derived
 * mechanically from the space's own conversions — no hand-kept primaries table:
 *
 *     import space from 'color-space'
 *     import { profile } from 'color-space/icc'
 *
 *     profile(space.p3)         // → Uint8Array, a Display P3 .icc (matrix + TRC)
 *     profile(space.prophoto)   // ROMM RGB, D50-native
 *     profile(space.munsell)    // measured dataset → CLUT input profile
 *     profile(space.lab, { xyz: space.xyz })   // CLUT both ways — colour-space class
 *
 * Two mechanisms, picked per space:
 *
 * MATRIX + TRC (class 'mntr', PCS XYZ) — Photoshop, macOS/Windows color management,
 * browsers and printers read it. Colorant columns are XYZ of the full-intensity
 * primaries via the library's D65 hub, Bradford-adapted to the ICC D50 PCS; the TRC
 * is the space's own decode, sampled from the neutral diagonal; linear spaces emit
 * the identity curve. A space qualifies only if it empirically IS matrix×transfer —
 * xyz(r,g,b) must equal M·[t(r),t(g),t(b)] at random probes — so a matrix profile
 * never lies.
 *
 * CLUT (lut16Type 'mft2', PCS Lab) — everything a matrix must refuse: cylinders,
 * luma/chroma, opponent and appearance models, measured datasets like Munsell, even
 * 1-, 2- and 4-channel scales. The A2B0 tag samples device→Lab(D50) on a dense
 * lattice — the ICC container made for measured transforms (lcms, ArgyllCMS,
 * ImageMagick, ColorSync all interpolate it). Spaces whose inverse is continuous
 * also get the B2A0 (Lab→device) table and ship class 'spac' (colour-space
 * conversion); one-way spaces and hue wheels — a lattice cannot interpolate a
 * device value across the 360→0 seam — ship class 'scnr' (input) with the forward
 * table only: no reverse table rather than a wrong one.
 *
 * @see {@link https://www.color.org/specification/ICC1v43_2010-12.pdf} ICC.1:2010 (v4.3, v2 layout compatible)
 * @see {@link http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html} colorant math cross-check
 */
import { bradford } from './spaces/xyz.js'

// deterministic xorshift32 — the matrix+transfer gate probes are reproducible
const rnd = (s) => () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }

const mul3 = (m, x, y, z) => [
	m[0] * x + m[1] * y + m[2] * z,
	m[3] * x + m[4] * y + m[5] * z,
	m[6] * x + m[7] * y + m[8] * z,
]

/**
 * Build the profile's numeric content: D50-adapted colorant matrix + sampled TRC.
 * Throws when the space is not a matrix×transfer RGB space over a 0-based domain.
 * @param {object} s space object with `.range` and `.xyz` (wired or direct)
 * @param {number} [n=1024] TRC sample count
 */
export function colorants(s, n = 1024) {
	if (typeof s.xyz !== 'function') throw new Error(`color-space/icc: ${s.name} has no xyz conversion — import the wired hub`)
	if (!(n >= 2 && n <= 65536)) throw new Error(`color-space/icc: TRC sample count ${n} out of range (2–65536)`)
	const r = s.range
	if (!r || r.length !== 3 || r.some(([a, b]) => a !== 0 || !(b > 0) || !isFinite(b)))
		throw new Error(`color-space/icc: ${s.name} needs a 0-based bounded 3-channel domain — an ICC matrix/TRC profile cannot carry ${s.name}'s`)
	const max = r.map(([, b]) => b)
	const white = s.xyz(...max)
	// TRC: the space's own decode, from the neutral diagonal — t(v) = Y(gray v)/Y(white)
	const trc = new Float64Array(n)
	for (let i = 0; i < n; i++) {
		const t = i / (n - 1)
		trc[i] = s.xyz(max[0] * t, max[1] * t, max[2] * t)[1] / white[1]
	}
	let linear = true, monotone = true
	for (let i = 0; i < n; i++) {
		if (Math.abs(trc[i] - i / (n - 1)) > 1e-4) linear = false
		if (i && trc[i] < trc[i - 1] - 1e-9) monotone = false
	}
	if (!monotone || !(trc[n - 1] > trc[0]))
		throw new Error(`color-space/icc: ${s.name}'s tone curve is not monotone — not a display transfer`)
	// colorant columns (hub D65, Y=1): XYZ of each full-intensity primary
	const cols = [s.xyz(max[0], 0, 0), s.xyz(0, max[1], 0), s.xyz(0, 0, max[2])].map((v) => v.map((x) => x / 100))
	// the gate: xyz(r,g,b) must BE M·[t(r),t(g),t(b)] — else this profile would lie
	const t1 = (f) => s.xyz(max[0] * f, max[1] * f, max[2] * f)[1] / white[1] // transfer via the neutral diagonal
	const rng = rnd(0x1cc)
	for (let k = 0; k < 8; k++) {
		const v = [rng(), rng(), rng()]
		const got = s.xyz(...v.map((f, c) => max[c] * f)).map((x) => x / 100)
		const t = v.map(t1)
		const exp = [0, 1, 2].map((row) => cols[0][row] * t[0] + cols[1][row] * t[1] + cols[2][row] * t[2])
		for (let c = 0; c < 3; c++)
			if (Math.abs(got[c] - exp[c]) > 2e-3)
				throw new Error(`color-space/icc: ${s.name} is not a matrix×transfer RGB space — an ICC matrix/TRC profile cannot represent it`)
	}
	// Bradford D65 hub → D50 PCS (ICC requirement) — same matrix the D50 spaces share
	const M = bradford.D65_D50
	return {
		rXYZ: mul3(M, ...cols[0]), gXYZ: mul3(M, ...cols[1]), bXYZ: mul3(M, ...cols[2]),
		trc: linear ? null : trc, // null = identity curve (curv count 0)
		chad: M,
	}
}

// ── CLUT content: any bounded-domain space, sampled into an mft2 lattice ──
// PCS illuminant D50 — the spec's exact fixed-point bytes, not a recomputation
const D50 = [0x0000f6d6, 0x00010000, 0x0000d32d]
const D50n = D50.map((v) => v / 65536)
// CIE L*a*b* ↔ XYZ, D50-relative — the PCS side of every CLUT cell
const fLab = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (t * 24389 / 27 + 16) / 116)
const toLab = (X, Y, Z) => {
	const fx = fLab(X / D50n[0]), fy = fLab(Y / D50n[1]), fz = fLab(Z / D50n[2])
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
const unLab = (L, a, b) => {
	const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200
	const g = (f) => { const c = f * f * f; return c > 216 / 24389 ? c : (116 * f - 16) * 27 / 24389 }
	return [g(fx) * D50n[0], g(fy) * D50n[1], g(fz) * D50n[2]]
}
// ICC v2 Lab16 encoding: L 0..100 → 0..0xFF00, a/b −128..+127.996 → 0..0xFFFF
const u16 = (v) => Math.round(Math.min(65535, Math.max(0, v)))
const encLab = (l) => [u16(l[0] * 652.8), u16((l[1] + 128) * 256), u16((l[2] + 128) * 256)]
// device signature: ICC has words for encodings matching its own conventions
// (0-based, hue scaled 0–1); everything else is honestly N-colour
const devsig = (s, n) => ({ hsv: 'HSV ', hsl: 'HLS ', cmy: 'CMY ', cmyk: 'CMYK' })[s.name]
	|| (n === 1 ? 'GRAY' : n === 2 ? '2CLR' : n === 3 ? '3CLR' : '4CLR')
// device grid point → PCS Lab, or null where the space has no colour
const dev2lab = (s) => {
	const M = bradford.D65_D50
	return (v) => {
		const xyz = s.xyz(...v)
		if (!xyz.every(isFinite)) return null
		const lab = toLab(...mul3(M, xyz[0] / 100, xyz[1] / 100, xyz[2] / 100))
		return lab.every(isFinite) ? lab : null
	}
}
// is the inverse continuous? walk a mid-lightness chroma ring — a seam (hue wheels:
// 360→0, munsell 100→0) shows as a device jump of ~the whole span between 5° steps
const contInv = (s, inv) => {
	const M = bradford.D50_D65, r = s.range
	let prev = null, ok = 0
	for (let k = 0; k <= 72; k++) {
		const h = k / 72 * 2 * Math.PI
		const xyz = mul3(M, ...unLab(55, 30 * Math.cos(h), 30 * Math.sin(h)))
		let v = null
		try { v = inv(xyz[0] * 100, xyz[1] * 100, xyz[2] * 100); if (!v.every(isFinite)) v = null } catch {}
		if (v && prev) {
			ok++
			for (let c = 0; c < 3; c++) if (Math.abs(v[c] - prev[c]) > 0.35 * (r[c][1] - r[c][0])) return false
		}
		prev = v
	}
	return ok >= 60   // the ring must actually be in-domain for the verdict to mean anything
}

/**
 * Sample a space into CLUT profile content: the A2B0 (device→Lab) lattice, the
 * B2A0 (Lab→device) lattice when the inverse supports one, and the header words.
 * Throws when the space has no bounded 1–4 channel domain or is undefined over
 * too much of it.
 * @param {object} s space object with `.range` and `.xyz`
 * @param {object} [opts]
 * @param {object} [opts.xyz] the xyz space object (e.g. `space.xyz`) — its `[s.name]`
 *   inverse unlocks the B2A0 table; omitted = forward-only input profile
 * @param {number} [opts.grid] A2B lattice points per channel — default 255/65/33/9 for 1/2/3/4 channels
 * @param {number} [opts.bgrid=17] B2A lattice points per channel
 */
export function clut(s, opts = {}) {
	if (typeof s.xyz !== 'function') throw new Error(`color-space/icc: ${s.name} has no xyz conversion — import the wired hub`)
	const r = s.range, n = r ? r.length : 0
	if (!(n >= 1 && n <= 4) || !r.every(([a, b]) => isFinite(a) && isFinite(b) && b > a))
		throw new Error(`color-space/icc: ${s.name} needs a bounded 1–4 channel domain — a CLUT cannot cover ${s.name}'s`)
	const g = opts.grid || [255, 65, 33, 9][n - 1]
	if (!(g >= 2 && g <= 255)) throw new Error(`color-space/icc: CLUT grid ${g} out of range (2–255)`)
	const ctr = r.map(([a, b]) => (a + b) / 2)
	const fwd = dev2lab(s)
	const total = g ** n, a2b = new Uint16Array(total * 3), idx = new Array(n)
	let last = [0, 0, 0], holes = 0
	for (let j = 0; j < total; j++) {
		let rem = j
		for (let c = n - 1; c >= 0; c--) { idx[c] = rem % g; rem = (rem - idx[c]) / g }   // first channel varies slowest — ICC CLUT order
		const v = idx.map((k, c) => r[c][0] + k / (g - 1) * (r[c][1] - r[c][0]))
		let lab = null
		try { lab = fwd(v) } catch {}
		// appearance models blow up at box corners no real colour reaches — pull the
		// cell toward the domain centre until it lands on a defined colour
		for (let t = 0.5; !lab && t > 0.02; t /= 2)
			try { lab = fwd(v.map((x, c) => ctr[c] + (x - ctr[c]) * t)) } catch {}
		if (!lab) { lab = last; holes++ } else last = lab
		const e = encLab(lab)
		a2b[j * 3] = e[0]; a2b[j * 3 + 1] = e[1]; a2b[j * 3 + 2] = e[2]
	}
	if (holes > total * 0.2)
		throw new Error(`color-space/icc: ${s.name} is undefined over ${Math.round(holes / total * 100)}% of its domain box — no honest CLUT covers it`)
	// B2A: only for a continuous inverse — no reverse table is better than a wrong one
	let b2a = null
	const bg = opts.bgrid || 17
	const invF = n === 3 && opts.xyz && typeof opts.xyz[s.name] === 'function' ? opts.xyz[s.name] : null
	if (invF && contInv(s, invF)) {
		b2a = new Uint16Array(bg ** 3 * 3)
		const M = bradford.D50_D65
		const dev = (L, A, B) => {
			const xyz = mul3(M, ...unLab(L, A, B))
			const v = invF(xyz[0] * 100, xyz[1] * 100, xyz[2] * 100)
			return v.every(isFinite) ? v : null
		}
		for (let i0 = 0, j = 0; i0 < bg; i0++) for (let i1 = 0; i1 < bg; i1++) for (let i2 = 0; i2 < bg; i2++, j++) {
			// the lattice spans the full v2 Lab16 words: L 0..100.39, a/b −128..+127.996
			const L = i0 / (bg - 1) * 65535 / 652.8, A = i1 / (bg - 1) * 65535 / 256 - 128, B = i2 / (bg - 1) * 65535 / 256 - 128
			let v = null
			try { v = dev(L, A, B) } catch {}
			// most of the Lab box lies outside any real gamut — fold toward the neutral
			// axis of the same lightness until the inverse lands, then clamp to range
			for (let t = 0.5; !v && t > 0.02; t /= 2)
				try { v = dev(L, A * t, B * t) } catch {}
			if (!v) v = ctr
			for (let c = 0; c < 3; c++) b2a[j * 3 + c] = u16((v[c] - r[c][0]) / (r[c][1] - r[c][0]) * 65535)
		}
	}
	return { sig: devsig(s, n), cls: b2a ? 'spac' : 'scnr', nin: n, grid: g, bgrid: bg, a2b, b2a }
}

/**
 * Which profile flavour a space gets — 'mntr' (matrix+TRC display), 'spac' (CLUT,
 * both directions), 'scnr' (CLUT input, device→PCS only) — or null for spaces no
 * honest profile covers. Cheap: probes only, no lattice bake.
 * @param {object} s space object
 * @param {object} [opts.xyz] the xyz space object — lets 'spac' be detected
 */
export function kind(s, opts = {}) {
	try { colorants(s, 64); return 'mntr' } catch {}
	const r = s && s.range, n = r ? r.length : 0
	if (typeof s?.xyz !== 'function' || !(n >= 1 && n <= 4) || !r.every(([a, b]) => isFinite(a) && isFinite(b) && b > a)) return null
	const fwd = dev2lab(s)
	try { if (!fwd(r.map(([a, b]) => (a + b) / 2))) return null } catch { return null }   // the centre must be a colour; the bake's hole gate does the rest
	const invF = n === 3 && opts.xyz && typeof opts.xyz[s.name] === 'function' ? opts.xyz[s.name] : null
	return invF && contInv(s, invF) ? 'spac' : 'scnr'
}

// ── ICC v2 binary assembly ──
const enc = new TextEncoder()
const s15f16 = (v) => Math.round(v * 65536) | 0

function tag(sig, body) { return { sig, body } }
const xyzTag = (v) => {
	const b = new DataView(new ArrayBuffer(20))
	b.setUint32(0, 0x58595a20) // 'XYZ '
	for (let i = 0; i < 3; i++) b.setInt32(8 + 4 * i, s15f16(v[i]))
	return b.buffer
}
const curvTag = (trc) => {
	const n = trc ? trc.length : 0
	const b = new DataView(new ArrayBuffer(12 + 2 * n))
	b.setUint32(0, 0x63757276) // 'curv'
	b.setUint32(8, n)          // 0 = identity
	for (let i = 0; i < n; i++) b.setUint16(12 + 2 * i, Math.round(Math.min(1, Math.max(0, trc[i])) * 65535))
	return b.buffer
}
const sf32Tag = (m) => {
	const b = new DataView(new ArrayBuffer(8 + 36))
	b.setUint32(0, 0x73663332) // 'sf32'
	for (let i = 0; i < 9; i++) b.setInt32(8 + 4 * i, s15f16(m[i]))
	return b.buffer
}
const descTag = (text) => {
	const a = enc.encode(text)
	const b = new DataView(new ArrayBuffer(90 + a.length + 1))
	b.setUint32(0, 0x64657363) // 'desc'
	b.setUint32(8, a.length + 1)
	new Uint8Array(b.buffer, 12, a.length).set(a)
	return b.buffer
}
const textTag = (text) => {
	const a = enc.encode(text)
	const b = new DataView(new ArrayBuffer(8 + a.length + 1))
	b.setUint32(0, 0x74657874) // 'text'
	new Uint8Array(b.buffer, 8, a.length).set(a)
	return b.buffer
}
// lut16Type — identity 2-point in/out tables, identity matrix, the lattice as u16
const mft2Tag = (nin, nout, g, clut) => {
	const b = new DataView(new ArrayBuffer(52 + 4 * nin + 2 * clut.length + 4 * nout))
	b.setUint32(0, 0x6d667432) // 'mft2'
	b.setUint8(8, nin); b.setUint8(9, nout); b.setUint8(10, g)
	for (let i = 0; i < 3; i++) b.setInt32(12 + 16 * i, 65536)   // e00·e11·e22 = 1 — the matrix only ever applies to XYZ input, and ours is Lab
	b.setUint16(48, 2); b.setUint16(50, 2)
	let o = 52
	for (let c = 0; c < nin; c++, o += 4) b.setUint16(o + 2, 65535)
	for (let k = 0; k < clut.length; k++, o += 2) b.setUint16(o, clut[k])
	for (let c = 0; c < nout; c++, o += 4) b.setUint16(o + 2, 65535)
	return b.buffer
}
const fcc = (t) => [...t].reduce((a, c) => a * 256 + c.charCodeAt(0), 0)
const SIG = { desc: 0x64657363, wtpt: 0x77747074, rXYZ: 0x7258595a, gXYZ: 0x6758595a, bXYZ: 0x6258595a, rTRC: 0x72545243, gTRC: 0x67545243, bTRC: 0x62545243, chad: 0x63686164, cprt: 0x63707274, A2B0: 0x41324230, B2A0: 0x42324130 }

/**
 * Render a space as an ICC v2 profile: matrix+TRC display profile where the space
 * empirically is one, CLUT (mft2, Lab PCS) otherwise — see the module header.
 * The media white point is the D50 PCS white; matrix profiles carry the Bradford
 * adaptation in `chad`, the layout lcms-built profiles use.
 * @param {object} s space object (e.g. `space.p3`)
 * @param {object} [opts]
 * @param {string} [opts.description] profile name — default "<name> (color-space)"
 * @param {object} [opts.xyz] the xyz space object (e.g. `space.xyz`) — unlocks the
 *   CLUT B2A0 (PCS→device) table for spaces with a continuous inverse
 * @param {number} [opts.grid] CLUT A2B lattice size (see {@link clut})
 * @param {number} [opts.date=[2026,1,1,0,0,0]] header dateTime — fixed by default so builds are reproducible
 * @returns {Uint8Array} the .icc bytes
 */
export function profile(s, opts = {}) {
	const cprt = tag('cprt', textTag('public domain — generated by color-space (https://github.com/colorjs/color-space)'))
	const desc = tag('desc', descTag(opts.description || `${s.name} (color-space)`))
	const wtpt = tag('wtpt', xyzTag(D50n))
	let cls = 'mntr', dat = 'RGB ', pcs = 'XYZ ', tags
	try {
		const { rXYZ, gXYZ, bXYZ, trc, chad } = colorants(s, opts.samples)
		const curv = curvTag(trc)
		tags = [desc, wtpt,
			tag('rXYZ', xyzTag(rXYZ)), tag('gXYZ', xyzTag(gXYZ)), tag('bXYZ', xyzTag(bXYZ)),
			tag('rTRC', curv), tag('gTRC', curv), tag('bTRC', curv), // shared transfer — one curve, three tags
			tag('chad', sf32Tag(chad)), cprt]
	} catch {
		const c = clut(s, opts)   // throws its own honest reason when nothing covers the space
		cls = c.cls; dat = c.sig; pcs = 'Lab '
		tags = [desc, wtpt, tag('A2B0', mft2Tag(c.nin, 3, c.grid, c.a2b)),
			...(c.b2a ? [tag('B2A0', mft2Tag(3, c.nin, c.bgrid, c.b2a))] : []), cprt]
	}
	// layout: header 128 + tag table + 4-aligned tag data (identical bodies share bytes)
	const table = 4 + tags.length * 12
	let off = 128 + table + (table % 4 ? 4 - table % 4 : 0)
	const placed = new Map()
	for (const t of tags) {
		if (placed.has(t.body)) { t.off = placed.get(t.body); continue }
		t.off = off; placed.set(t.body, off)
		off += t.body.byteLength + (t.body.byteLength % 4 ? 4 - t.body.byteLength % 4 : 0)
	}
	const buf = new DataView(new ArrayBuffer(off))
	// header
	buf.setUint32(0, off)                    // profile size
	buf.setUint32(8, 0x02400000)             // version 2.4
	buf.setUint32(12, fcc(cls))
	buf.setUint32(16, fcc(dat))
	buf.setUint32(20, fcc(pcs))
	const d = opts.date || [2026, 1, 1, 0, 0, 0]
	for (let i = 0; i < 6; i++) buf.setUint16(24 + 2 * i, d[i])
	buf.setUint32(36, 0x61637370)            // 'acsp'
	for (let i = 0; i < 3; i++) buf.setInt32(68 + 4 * i, D50[i]) // PCS illuminant
	// tag table + data
	buf.setUint32(128, tags.length)
	tags.forEach((t, i) => {
		buf.setUint32(132 + 12 * i, SIG[t.sig])
		buf.setUint32(136 + 12 * i, t.off)
		buf.setUint32(140 + 12 * i, t.body.byteLength)
		new Uint8Array(buf.buffer, t.off, t.body.byteLength).set(new Uint8Array(t.body))
	})
	return new Uint8Array(buf.buffer)
}
