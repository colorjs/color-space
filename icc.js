/**
 * color-space/icc — RGB working spaces as ICC display profiles.
 *
 * The color-management analog of the LUT exporter: a matrix + TRC ICC v2 profile
 * (class 'mntr', PCS XYZ) that Photoshop, macOS/Windows color management, browsers
 * and printers read. Everything is derived mechanically from the space's own
 * conversions — no hand-kept primaries table:
 *
 *     import space from 'color-space'
 *     import { profile } from 'color-space/icc'
 *
 *     profile(space.p3)         // → Uint8Array, a Display P3 .icc
 *     profile(space.prophoto)   // ROMM RGB, D50-native
 *     profile(space.rec709)     // scene OETF as the TRC, as the space defines it
 *
 * Mechanics: colorant columns are XYZ of the full-intensity primaries via the
 * library's D65 hub, Bradford-adapted to the ICC D50 PCS (the same full-precision
 * matrix every D50 space here uses); the TRC is the space's own decode, sampled
 * from the neutral diagonal (Y of gray — exact for any shared-per-channel
 * transfer); linear spaces emit the identity curve. A space qualifies only if it
 * empirically IS matrix×transfer — xyz(r,g,b) must equal M·[t(r),t(g),t(b)] at
 * random probes — so device cylinders, luma/chroma and opponent spaces refuse
 * rather than emit a lying profile.
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

// ── ICC v2 binary assembly ──
const enc = new TextEncoder()
const s15f16 = (v) => Math.round(v * 65536) | 0
// PCS illuminant D50 — the spec's exact fixed-point bytes, not a recomputation
const D50 = [0x0000f6d6, 0x00010000, 0x0000d32d]

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
const SIG = { desc: 0x64657363, wtpt: 0x77747074, rXYZ: 0x7258595a, gXYZ: 0x6758595a, bXYZ: 0x6258595a, rTRC: 0x72545243, gTRC: 0x67545243, bTRC: 0x62545243, chad: 0x63686164, cprt: 0x63707274 }

/**
 * Render a space as an ICC v2 RGB display profile.
 * The media white point is the D50 PCS white with the Bradford adaptation in
 * `chad` — the layout lcms-built profiles use; the TRC is the space's own decode.
 * @param {object} s space object (e.g. `space.p3`)
 * @param {object} [opts]
 * @param {string} [opts.description] profile name — default "<name> (color-space)"
 * @param {number[]} [opts.date=[2026,1,1,0,0,0]] header dateTime — fixed by default so builds are reproducible
 * @returns {Uint8Array} the .icc bytes
 */
export function profile(s, opts = {}) {
	const { rXYZ, gXYZ, bXYZ, trc, chad } = colorants(s, opts.samples)
	const curv = curvTag(trc)
	const tags = [
		tag('desc', descTag(opts.description || `${s.name} (color-space)`)),
		tag('wtpt', xyzTag(D50.map((v) => v / 65536))),
		tag('rXYZ', xyzTag(rXYZ)), tag('gXYZ', xyzTag(gXYZ)), tag('bXYZ', xyzTag(bXYZ)),
		tag('rTRC', curv), tag('gTRC', curv), tag('bTRC', curv), // shared transfer — one curve, three tags
		tag('chad', sf32Tag(chad)),
		tag('cprt', textTag('public domain — generated by color-space (https://github.com/colorjs/color-space)')),
	]
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
	buf.setUint32(12, 0x6d6e7472)            // 'mntr'
	buf.setUint32(16, 0x52474220)            // 'RGB '
	buf.setUint32(20, 0x58595a20)            // 'XYZ '
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
