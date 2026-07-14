#!/usr/bin/env node
// Generate web/js/reach.js — each space's share of the visible gamut.
//
// Method: the visible solid is the optimal-color solid (Rösch–MacAdam) — the set of
// XYZ integrals of reflectances bounded by [0,1]. That set is a zonoid: a point is
// inside iff u·X ≤ h(u) for every direction u, with support h(u) = Σλ max(0, u·col(λ)).
// Columns come from the library's own CIE 1931 2° CMF table (wavelength.js, 380–700 nm
// at 5 nm) under illuminant E. Volume is measured in CIELAB (D50, the library's lab):
// Monte-Carlo points uniform in Lab, kept if visible, tested for coverage by each
// space's declared range (with a round-trip check, since poles lie). Chroma-encoded
// spaces are additionally bounded by their base rgb cube — most of a ycbcr-style box
// decodes through negative light, and counting it once inflated yiq to 88%.
// Gate anchors are the coverage figures commonly quoted for these gamuts (sRGB 35.9%,
// Adobe RGB 52.1%, ProPhoto ≈90% — see each space's Wikipedia article); sources differ
// on the exact measure (xy area vs CIELAB volume) but agree at gate width. Ratios vs sRGB.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import space from '../index.js'
import data from '../data.json' with { type: 'json' }
import { rangesFp } from './build-site.js'   // the stamp build-site verifies against
const meta = data.spaces

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── the visible zonoid, from the library's CMF ──
const cols = []
for (let nm = 380; nm <= 700; nm += 5) cols.push(space.wavelength.xyz(nm))
const k = 100 / cols.reduce((s, c) => s + c[1], 0)   // white Y = 100
const DIRS = []
for (let i = 0; i < 402; i++) {   // Fibonacci sphere — even directional cover
	const t = (i + 0.5) / 402, ph = Math.acos(1 - 2 * t), th = Math.PI * (1 + Math.sqrt(5)) * i
	DIRS.push([Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)])
}
const H = DIRS.map(u => cols.reduce((s, c) => s + Math.max(0, u[0] * c[0] + u[1] * c[1] + u[2] * c[2]), 0) * k)
const visible = xyz => {
	for (let i = 0; i < DIRS.length; i++) {
		const u = DIRS[i]
		if (u[0] * xyz[0] + u[1] * xyz[1] + u[2] * xyz[2] > H[i] + 1e-9) return false
	}
	return true
}

// ── Monte-Carlo points, uniform in Lab, kept if visible ──
let seed = 88172645
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const PTS = []
const RAW = 220000
for (let i = 0; i < RAW; i++) {
	const L = rnd() * 100, a = -110 + rnd() * 225, b = -125 + rnd() * 235
	let xyz; try { xyz = space.lab.xyz(L, a, b) } catch { continue }
	if (xyz.every(isFinite) && visible(xyz)) PTS.push([L, a, b])
}
console.log(`visible sample: ${PTS.length} of ${RAW} raw points`)

// ── coverage per space: in declared range AND round-trips (poles lie) ──
const wraps = c => c.max - c.min === 360 || /hue/i.test(c.name || '')

// ── same law as the site's horseshoe (web/js/gl.js gamutProg): a chroma-encoded
// space (ycbcr on sRGB, yccbccrc on Rec.2020) only owns colors whose base rgb-cube
// coords are valid — past that, in-box coordinates decode through negative light
// and the coverage lies. Only gamma-domain device encodings (@encoding gamma —
// the luma/chroma and hue cylinders built on companded R'G'B') are so bounded; a
// colorimetric space (xyz, oklab, lab, the CAMs — @encoding linear/perceptual/log)
// spans all of vision and is held only by its own declared range. The first additive
// space on the path BEFORE xyz is the base. Topology alone can't tell the two apart —
// oklch/oklab/xyz carry a shortcut →rgb edge that skips xyz, which once pinned them to
// the sRGB triangle (xyz reading 36%, the same sliver as sRGB); @encoding does.
const spaceNames = new Set(Object.keys(meta))
const edgesOf = s => Object.keys(space[s] || {}).filter(k => {
	const f = space[s][k]
	return spaceNames.has(k) && typeof f === 'function' && !(f.scalar || f).chained
})
const pathToRgb = name => {
	if (name === 'rgb') return ['rgb']
	const prev = { [name]: null }, q = [name]
	while (q.length) {
		const s = q.shift()
		if (s === 'rgb') { const p = []; for (let n = 'rgb'; n; n = prev[n]) p.unshift(n); return p }
		for (const t of edgesOf(s)) if (!(t in prev)) { prev[t] = s; q.push(t) }
	}
	return null
}
const additive = s => {   // no tone, no hue, 3 channels — mirrors web/js/core.js classify
	const ch = meta[s]?.channels || []
	return ch.length === 3 && !ch.some(c => c.max === 360 || /Light|Value|Intensity|Tone|Bright|Luma/.test(c.name || ''))
}
const baseOf = s => {
	if (s === 'rgb') return null
	if (meta[s]?.encoding !== 'gamma') return null   // colorimetric/linear/log — bounded only by declared range
	const path = pathToRgb(s) || []
	for (let i = 1; i < path.length; i++) {
		const n = path[i]
		if (n === 'xyz') break
		if (additive(n)) return n
	}
	return null
}

const shareOf = s => {
	const m = meta[s]
	if (!m || !m.range || m.range.length < 3) return null
	const chs = m.channels || []
	// lab itself has no self-edge in the graph — its transform is the identity
	const to = s === 'lab' ? (...v) => v : space.lab[s], back = s === 'lab' ? (...v) => v : space[s].lab
	if (!to || !back) return null
	const bs = baseOf(s)
	const toBase = bs && space[s][bs], bRange = bs && meta[bs].range
	let cov = 0
	for (const [L, a, b] of PTS) {
		let v; try { v = to(L, a, b) } catch { continue }
		if (!v.every(isFinite)) continue
		let ok = true
		for (let i = 0; i < m.range.length; i++) {
			if (chs[i] && wraps(chs[i])) continue
			const [lo, hi] = m.range[i], pad = (hi - lo) * 1e-3
			if (v[i] < lo - pad || v[i] > hi + pad) { ok = false; break }
		}
		if (!ok) continue
		if (toBase) {   // chroma-encoded: the color must be real light in the base cube
			let bv; try { bv = toBase(...v) } catch { continue }
			if (!bv.every((x, i) => {
				const [lo, hi] = bRange[i], pad = (hi - lo) * 1e-3
				return isFinite(x) && x >= lo - pad && x <= hi + pad
			})) continue
		}
		let r; try { r = back(...v) } catch { continue }
		if (Math.hypot(r[0] - L, r[1] - a, r[2] - b) <= 1.5) cov++
	}
	return cov / PTS.length
}

const out = {}
const names = Object.keys(meta).filter(s => meta[s].range && meta[s].range.length >= 3)
for (const s of names) {
	const sh = shareOf(s)
	if (sh != null && sh > 0.001) out[s] = sh
	if (Object.keys(out).length % 20 === 0) console.log(`…${Object.keys(out).length} spaces`)
}

// ── gate on the published anchors before writing anything ──
const anchor = (s, lo, hi) => {
	const v = out[s]
	if (!(v >= lo && v <= hi)) throw new Error(`anchor failed: ${s} = ${(v * 100).toFixed(1)}% (expected ${lo * 100}–${hi * 100}%)`)
	console.log(`anchor ok: ${s} = ${(v * 100).toFixed(1)}%`)
}
anchor('lab', 0.999, 1)          // the measurement space itself — identity must cover every sample
anchor('rgb', 0.30, 0.42)        // published ≈ 35.9 %
anchor('a98rgb', 0.44, 0.60)     // published ≈ 52.1 %
anchor('prophoto', 0.80, 0.97)   // published ≈ 90 %
// colorimetric spaces span all vision — a shortcut →rgb edge must never re-clamp them to
// the sRGB triangle (the bug that once read xyz/oklch at ~36%); they track lab, not rgb.
anchor('xyz', 0.92, 1)           // CIE master space — contains every visible color
anchor('oklch', 0.97, 1)         // colorimetric transform of XYZ, like lab — never gamut-bound
anchor('hsl', 0.30, 0.42)        // gamma device cylinder — MUST stay sRGB-clamped (guards the converse)

const base = out.rgb
const lines = Object.keys(out).sort().map(s =>
	`\t'${s}': [${out[s].toFixed(3)}, ${(out[s] / base).toFixed(2)}],`)
writeFileSync(join(root, 'web/js/reach.js'),
	`// Generated by scripts/generate-reach.js — do not edit.
// ranges ${rangesFp(meta)} — build-site refuses this file when any declared range has changed since
// [share of the visible gamut's CIELAB volume, ratio vs sRGB]. The visible solid is
// the optimal-color (Rösch–MacAdam) zonoid built from the library's CIE 1931 2° CMF
// table under illuminant E; volume measured in CIELAB (D50), Monte Carlo n=${PTS.length}.
// Gated against published coverage figures (sRGB ≈35.9%, Adobe RGB ≈52%, ProPhoto ≈90%).
export default {
${lines.join('\n')}
}
`)
console.log(`reach.js written: ${Object.keys(out).length} spaces`)
