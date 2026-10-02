// Pin the LUT exporter to the scalar library.
//
// A .cube is a sampled projection of a conversion; these tests assert (1) the
// lattice reproduces the direct conversion exactly at its own nodes, (2) the
// interpolated lattice tracks the direct conversion off-lattice within the
// tolerance the header claims, (3) the file layout follows the Adobe/IRIDAS cube
// format (keywords, red-fastest ordering, float lines), and (4) channelwise
// pairs auto-emit 1D. The reference is the library itself — differential, like
// test/wasm-batch.js — plus format facts from the Cube LUT Specification 1.0.
import test, { is } from 'tst'
import space from '../index.js'
import { cube, table, apply, verify, channelwise } from '../lut.js'

const rnd = (s) => () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }

// parse a .cube back: header keywords + data triples
function parse(text) {
	const lines = text.trim().split('\n')
	const out = { comments: [], data: [] }
	for (const l of lines) {
		if (l.startsWith('#')) { out.comments.push(l); continue }
		if (l.startsWith('TITLE')) { out.title = l.match(/^TITLE "(.*)"$/)?.[1]; continue }
		const m = l.match(/^LUT_(1|3)D_SIZE (\d+)$/)
		if (m) { out.dims = +m[1]; out.size = +m[2]; continue }
		const nums = l.split(' ').map(Number)
		is(nums.length === 3 && nums.every(isFinite), true, `data line is 3 finite floats: "${l}"`)
		out.data.push(nums)
	}
	return out
}

// representative pairs across the wedge: camera log → broadcast, display → display,
// log → wide gamut, linear → display
const PAIRS = [
	['slog3', 'rec709'], ['rgb', 'p3'], ['logc4', 'rec2020'], ['acescg', 'rec709'],
]

for (const [f, t] of PAIRS) {
	test(`lut: ${f}→${t} — lattice nodes are exact, off-lattice tracks direct conversion`, () => {
		const tab = table(space[f], space[t], { size: 17 })
		is(tab.dims, 3, 'cross-channel pair samples a 3D lattice')
		// at lattice nodes interpolation must return the sampled value = direct conversion
		const dom = tab.domain, N = tab.size
		const node = (i, j, k) => [0, 1, 2].map((c) => dom[c][0] + ([i, j, k][c] / (N - 1)) * (dom[c][1] - dom[c][0]))
		for (const [i, j, k] of [[0, 0, 0], [N - 1, N - 1, N - 1], [4, 8, 12], [N - 1, 0, 7]]) {
			const inp = node(i, j, k), direct = space[f][t](...inp), got = apply(tab, inp)
			for (let c = 0; c < 3; c++)
				is(Math.abs(got[c] - direct[c]) < 1e-9 * (tab.range[c][1] - tab.range[c][0]), true,
					`node (${i},${j},${k}) ch${c}: ${got[c]} = ${direct[c]}`)
		}
		// off-lattice, over in-range outputs (the LUT's working set): median tracks the
		// direct conversion to sub-1/255 by 33³; the max rides gamut-edge curvature —
		// the same behavior professional 33³ trilinear conversion LUTs have
		const v33 = verify(table(space[f], space[t], { size: 33 }))
		is(v33.in.n > 100, true, `in-range stats rest on ${v33.in.n} real samples (reported, not assumed)`)
		is(v33.in.median < 4e-3, true, `33³ in-range median ${v33.in.median.toExponential(2)} < 4e-3`)
		is(v33.in.max < 1.5e-1, true, `33³ in-range max ${v33.in.max.toExponential(2)} < 1.5e-1`)
		// refining the lattice must reduce the error
		const v65 = verify(table(space[f], space[t], { size: 65 }))
		is(v65.in.max < v33.in.max, true, `65³ (${v65.in.max.toExponential(2)}) beats 33³ (${v33.in.max.toExponential(2)})`)
	})
}

test('lut: .cube format — keywords, size, line count, red varies fastest', () => {
	const N = 5
	const text = cube(space.slog3, space.rec709, { size: N })
	const c = parse(text)
	is(c.dims, 3, 'LUT_3D_SIZE keyword')
	is(c.size, N, 'declared size')
	is(c.title, 'slog3 to rec709', 'default TITLE')
	is(c.data.length, N ** 3, 'N³ data lines')
	is(c.comments.some((l) => /lattice vs direct conversion/.test(l)), true, 'header carries the measured deviation')
	is(c.comments.some((l) => /color-space/.test(l)), true, 'header carries provenance')
	// Adobe Cube LUT spec: the first (red) index varies fastest —
	// line r + g·N + b·N² holds f(at(r), at(g), at(b))
	const dom = space.slog3.range, rng = space.rec709.range
	const at = (c2, i) => dom[c2][0] + (i / (N - 1)) * (dom[c2][1] - dom[c2][0])
	const norm = (v, c2) => (v - rng[c2][0]) / (rng[c2][1] - rng[c2][0])
	for (const [r, g, b] of [[N - 1, 0, 0], [0, N - 1, 0], [0, 0, N - 1], [1, 2, 3]]) {
		const direct = space.slog3.rec709(at(0, r), at(1, g), at(2, b)).map(norm)
		const line = c.data[r + g * N + b * N * N]
		for (let ch = 0; ch < 3; ch++)
			is(Math.abs(line[ch] - direct[ch]) < 5e-7, true, `line[${r},${g},${b}] ch${ch}: ${line[ch]} ≈ ${direct[ch]}`)
	}
})

test('lut: channelwise pairs auto-emit 1D; cross-channel stay 3D', () => {
	is(channelwise(space.rec709, space.rgb), true, 'rec709→rgb — same primaries, transfer only')
	is(channelwise(space.rgb, space.lrgb), true, 'rgb→lrgb — sRGB transfer')
	is(channelwise(space.rec2020, space['rec2020-linear']), true, 'rec2020→linear — BT.2020 OETF⁻¹')
	is(channelwise(space.slog3, space.rec709), false, 'slog3→rec709 — S-Gamut3 matrix mixes channels')
	is(channelwise(space.rgb, space.p3), false, 'rgb→p3 — gamut matrix mixes channels')
	const c = parse(cube(space.rec709, space.rgb, { size: 1024 }))
	is(c.dims, 1, 'LUT_1D_SIZE keyword')
	is(c.data.length, 1024, 'N data lines')
	// a 1D lattice of a transfer pair: max error sits at the sRGB linear→power knee
	// (locally unbounded curvature) — measured 9.5e-5 at the 4096-pt default, ≈0.02/255
	const v = verify(table(space.rec709, space.rgb))
	is(v.max < 2e-4, true, `1D 4096pt max deviation ${v.max.toExponential(2)} < 2e-4`)
	is(/# linear lattice/.test(cube(space.rec709, space.rgb, { size: 64 })), true, '1D header says linear, not trilinear')
	// forcing 3D still works
	is(parse(cube(space.rec709, space.rgb, { size: 5, dims: 3 })).dims, 3, 'dims:3 forces a 3D lattice')
})

test('lut: apply() speaks native units on both ends', () => {
	const tab = table(space.rgb, space.p3, { size: 33 })
	const r = rnd(0xbeef)
	for (let k = 0; k < 50; k++) {
		const inp = [r() * 255, r() * 255, r() * 255]
		const direct = space.rgb.p3(...inp), got = apply(tab, inp)
		for (let c = 0; c < 3; c++)
			is(Math.abs(got[c] - direct[c]) < 0.01, true, `rgb(${inp.map((x) => x.toFixed(0))}) ch${c}: ${got[c]} ≈ ${direct[c]}`)
	}
})

test('lut: shaper — camera-log→display at 33³ beats plain 65³; display pairs unharmed', () => {
	// the shaper is the conversion's own tone diagonal clamped to the target range:
	// scene-referred sources stop wasting >95% of the lattice on super-range highlights
	// (which clip at the shaper — the trade a display conversion LUT wants)
	for (const [f, t, bound] of [['slog3', 'rec709', 3e-2], ['logc4', 'rec2020', 6e-3], ['vlog', 'rec709', 2e-2]]) {
		const plain = verify(table(space[f], space[t], { size: 33 }))
		const shaped = verify(table(space[f], space[t], { size: 33, shaper: true }))
		const p65 = verify(table(space[f], space[t], { size: 65 }))
		is(shaped.in.max < bound, true, `${f}→${t} shaped 33³ in-range max ${shaped.in.max.toExponential(1)} < ${bound}`)
		is(shaped.in.max < plain.in.max, true, `beats plain 33³ (${plain.in.max.toExponential(1)})`)
		is(shaped.in.max < p65.in.max, true, `beats plain 65³ (${p65.in.max.toExponential(1)}) at ⅙ the size`)
		is(shaped.in.median < plain.in.median, true, `median improves (${plain.in.median.toExponential(1)} → ${shaped.in.median.toExponential(1)})`)
	}
	// near-identity tone (display→display): shaper must not hurt
	const plain = verify(table(space.rgb, space.p3, { size: 33 }))
	const shaped = verify(table(space.rgb, space.p3, { size: 33, shaper: true }))
	is(shaped.in.max < plain.in.max * 2, true, `rgb→p3 unharmed (${plain.in.max.toExponential(1)} → ${shaped.in.max.toExponential(1)})`)
})

test('lut: shaper .cube — Resolve-flavor combined 1D+3D structure', () => {
	const text = cube(space.slog3, space.rec709, { size: 5, shaper: 64, verify: false })
	const lines = text.trim().split('\n')
	// Blackmagic's documented combined header — both sizes and input ranges before any
	// data, no TITLE (OpenColorIO's resolve_cube reader refuses it; with TITLE, or with
	// LUT_3D_SIZE after the shaper rows, OCIO 2.6 fell back to a reader that dropped the shaper)
	const i1 = lines.findIndex((l) => l === 'LUT_1D_SIZE 64')
	is(i1 > 0, true, 'LUT_1D_SIZE header present')
	is(lines.slice(i1, i1 + 4), ['LUT_1D_SIZE 64', 'LUT_1D_INPUT_RANGE 0.0 1.0', 'LUT_3D_SIZE 5', 'LUT_3D_INPUT_RANGE 0.0 1.0'], 'Resolve header: sizes + input ranges, then data')
	is(lines.slice(0, i1).every((l) => l.startsWith('#')), true, 'only comments before the header — no TITLE')
	const d0 = i1 + 4
	is(lines.length - d0, 64 + 125, '64 shaper rows then 5³ lattice rows')
	is(/Resolve-flavor/.test(text), true, 'header states the flavor (not Adobe-strict/ffmpeg)')
	// shaper values are a monotone 0..1 tone curve per channel
	const shaper = lines.slice(d0, d0 + 64).map((l) => l.split(' ').map(Number))
	for (let c = 0; c < 3; c++) {
		is(shaper.every((r, j) => !j || r[c] >= shaper[j - 1][c] - 1e-9), true, `ch${c} monotone`)
		is(shaper[0][c] >= 0 && shaper[63][c] <= 1, true, `ch${c} within 0..1`)
	}
	// host semantics reproduce the direct conversion at probe points (apply = shaper→trilinear)
	const tab = table(space.slog3, space.rec709, { size: 33, shaper: true })
	for (const v of [[0.2, 0.3, 0.25], [0.5, 0.45, 0.5], [0.55, 0.5, 0.4]]) {
		const direct = space.slog3.rec709(...v), got = apply(tab, v)
		for (let c = 0; c < 3; c++)
			is(Math.abs(got[c] - direct[c]) < 5e-3, true, `apply(${v}) ch${c}: ${got[c].toFixed(4)} ≈ ${direct[c].toFixed(4)}`)
	}
})

test('lut: out-of-gamut output is written unclamped', () => {
	// rec2020 primaries live outside sRGB — the LUT must carry the negative values
	const tab = table(space.rec2020, space.rgb, { size: 9 })
	let neg = false
	for (const v of tab.data) if (v < -1e-3) { neg = true; break }
	is(neg, true, 'wide-gamut → sRGB lattice holds negative (unclamped) values')
})

test('lut: refuses what a LUT cannot honestly represent', () => {
	const throws = (fn, re, msg) => { let e = null; try { fn() } catch (err) { e = err } is(re.test(e?.message || ''), true, msg + ` (got: ${e?.message})`) }
	throws(() => table(space.gray, space.rgb), /3-channel/, 'gray (1 channel) rejected')
	throws(() => table(space.cmyk, space.rgb), /3-channel/, 'cmyk (4 channels) rejected')
	const holey = { name: 'holey', range: [[0, 1], [0, 1], [0, 1]], rgb: (a, b, c) => [a > 0.5 ? NaN : a, b, c] }
	throws(() => table(holey, space.rgb, { size: 5 }), /not finite/, 'non-finite lattice point refuses to bake NaN')
	// finite-but-insane corners must refuse too — hellwig2022's J=0 chroma corner blows
	// up to ~7e33 at size 3 (regression: it used to serialize as a scientific-notation line)
	throws(() => table(space.hellwig2022, space.jzczhz, { size: 3 }), /degenerate|not finite/, 'degenerate magnitude refuses to bake')
	throws(() => table({ name: 'nowhere', range: [[0, 1], [0, 1], [0, 1]] }, space.rgb), /no conversion/, 'unwired space names the fix')
	throws(() => table(space.rgb, space.p3, { size: 300 }), /out of spec/, '3D size capped at 256')
	throws(() => table(space.rgb, space.p3, { size: 1 }), /out of spec/, 'size 1 is not a lattice')
})

test('lut: non-0–1 domains are mapped and documented in the header', () => {
	// scrgb's conventional range is [-0.5, ~7.5] — the LUT normalizes the domain and says so
	const text = cube(space.scrgb, space.rgb, { size: 5, verify: false })
	is(/scaled to 0–1 from \[-0\.5\.\./.test(text), true, 'scrgb domain mapping documented')
	// rgb's 0–255 range rides as the LUT's 0–1, the way image data does
	const t2 = cube(space.rgb, space.p3, { size: 5, verify: false })
	is(/rgb scaled to 0–1 from \[0\.\.255/.test(t2), true, 'rgb 0–255 mapping documented')
})

test('lut: dims:3 — the editor cube for any pair, channelwise ones included', () => {
	// editors (CapCut, Premiere, Final Cut, OBS, ffmpeg lut3d, LumaFusion, VN) take a
	// plain 3D cube; a channelwise pair would otherwise auto-emit LUT_1D_SIZE 4096, which
	// ffmpeg's lut3d rejects ("3D LUT is empty") and OBS's 1D path can't allocate
	for (const [f, t] of [['rec709', 'rgb'], ['rgb', 'lrgb'], ['slog3', 'rec709']]) {
		const text = cube(space[f], space[t], { size: 33, dims: 3 })
		const lines = text.trim().split('\n')
		is(lines.filter((l) => /^LUT_/.test(l)), ['LUT_3D_SIZE 33'], `${f}→${t}: one size keyword, 3D`)
		is(lines.length - lines.findIndex((l) => l === 'LUT_3D_SIZE 33') - 1, 33 ** 3, `${f}→${t}: 33³ rows`)
		// OBS reads lines into a 256-byte buffer, ffmpeg into 512 — the verify comment is the longest
		const longest = Math.max(...lines.map((l) => Buffer.byteLength(l)))
		is(longest < 256, true, `${f}→${t}: longest line ${longest} bytes < 256`)
	}
	// the price of 3D for a pure transfer curve: trilinear across the dark knee — measured
	// max 5.8e-3 of full scale (≈1.5/255) at 33³, 1.7e-3 at 65³; median ~2e-5
	const v33 = verify(table(space.rec709, space.rgb, { size: 33, dims: 3 }))
	const v65 = verify(table(space.rec709, space.rgb, { size: 65, dims: 3 }))
	is(v33.max < 1e-2 && v33.median < 1e-4, true, `rec709→rgb 33³: max ${v33.max.toExponential(1)}, median ${v33.median.toExponential(1)}`)
	is(v65.max < v33.max / 2, true, `65³ (high precision) tightens it: max ${v65.max.toExponential(1)}`)
})
