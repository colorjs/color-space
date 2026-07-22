/**
 * color-space/lut — any conversion as a .cube LUT file.
 *
 * The library's verified formulas, projected into the one artifact the film and
 * video world consumes without JavaScript: DaVinci Resolve, Premiere, Final Cut,
 * OBS, ffmpeg all read .cube. Every generated LUT verifies itself — the header
 * carries the measured deviation of the interpolated lattice against the direct
 * conversion at random off-lattice points, so the file states its own accuracy.
 *
 *     import space from 'color-space'
 *     import { cube } from 'color-space/lut'
 *
 *     cube(space.slog3, space.rec709)              // camera log → broadcast, 33³
 *     cube(space.rgb, space.p3, { size: 65 })      // display → display, 65³
 *     cube(space.rec709, space.rgb)                // pure transfer — auto-emits 1D, 4096 pt
 *
 * Spaces are passed as objects (like `glsl(oklch, p3)`), so this module stays a
 * pure mechanism: it works with the wired hub, a bundled build, or `register()`ed
 * custom spaces, and adds zero bundle weight of its own.
 *
 * Geometry: the LUT input domain is normalized 0–1 per channel and mapped onto the
 * source space's conventional range (rgb 0–255 rides as 0–1, as image data does);
 * outputs are normalized by the target's range the same way. Values are written
 * unclamped — out-of-gamut stays visible, round-trips stay honest. A LUT is only
 * meaningful where the source is a bounded 3-channel encoding; lattice points that
 * convert to non-finite values throw rather than bake NaN into the file.
 *
 * @see {@link https://web.archive.org/web/20220220033515/https://wwwimages2.adobe.com/content/dam/acom/en/products/speedgrade/cc/pdfs/cube-lut-specification-1.0.pdf} Adobe Cube LUT Specification 1.0
 * @see {@link https://ffmpeg.org/ffmpeg-filters.html#lut3d-1} ffmpeg lut3d/lut1d (applies .cube)
 */

// deterministic xorshift32 — verification and channelwise probes are reproducible
const rnd = (s) => () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }

const conv = (from, to) => {
	const fn = from[to.name]
	if (typeof fn !== 'function')
		throw new Error(`color-space/lut: no conversion ${from.name}→${to.name} — import the wired hub ('color-space') or register() both spaces`)
	return fn
}

const domainOf = (s) => {
	const r = s.range
	if (!r || r.length !== 3 || !r.every(([a, b]) => isFinite(a) && isFinite(b) && b > a))
		throw new Error(`color-space/lut: ${s.name} is not a bounded 3-channel space — a LUT needs a finite 3-channel domain`)
	return r
}

/**
 * Is the conversion purely per-channel (a transfer curve, no cross-channel term)?
 * Tested empirically: f(a,b,c) must equal the diagonal reading
 * [f(a,a,a)[0], f(b,b,b)[1], f(c,c,c)[2]] on random in-domain triples.
 * True for same-primaries transfer pairs (rec709→rgb, rec2020→rec2020-linear);
 * false as soon as a matrix mixes channels (slog3→rec709, rgb→p3).
 * @param {object} from source space (with `.range` and a converter to `to`)
 * @param {object} to target space
 * @returns {boolean}
 */
export function channelwise(from, to) {
	const f = conv(from, to), dom = domainOf(from), rng = domainOf(to)
	const r = rnd(0xc01055)
	const at = (t) => dom.map(([lo, hi], c) => lo + t[c] * (hi - lo))
	for (let k = 0; k < 16; k++) {
		const t = [r(), r(), r()]
		const [a, b, c] = at(t)
		const got = f(a, b, c)
		const diag = [f(a, a, a)[0], f(b, b, b)[1], f(c, c, c)[2]]
		for (let ch = 0; ch < 3; ch++) {
			const fs = rng[ch][1] - rng[ch][0]
			if (!isFinite(got[ch]) || Math.abs(got[ch] - diag[ch]) / fs > 1e-6) return false
		}
	}
	return true
}

/**
 * Sample a conversion into a LUT lattice.
 * @param {object} from source space object (e.g. `space.slog3`)
 * @param {object} to target space object (e.g. `space.rec709`)
 * @param {object} [opts]
 * @param {number} [opts.size] lattice size — default 33 (3D) or 4096 (1D). 3D convention
 *   is 17/33/65 (Resolve's own export set); the spec allows up to 256 but OpenColorIO
 *   caps at 129 — stay ≤129 for pipeline portability
 * @param {1|3} [opts.dims] force 1D/3D — default: 1 when the pair is channelwise, else 3
 * @param {boolean|number} [opts.shaper] prepend a 1D shaper (Resolve-flavor combined cube):
 *   each channel's shaper is the conversion's own normalized tone diagonal, so the 3D
 *   lattice spends its nodes where the curvature lives — a shaped 33³ reaches plain-65³
 *   accuracy. A number sets the shaper size (default 1024). Channels whose diagonal
 *   isn't monotone fall back to identity. Read by Resolve and OCIO ('resolve_cube');
 *   NOT by ffmpeg's lut3d (Adobe-strict, one size keyword per file)
 * @returns {{from, to, dims: 1|3, size: number, domain: number[][], range: number[][], data: Float64Array, shaper?: Float64Array, shaperSize?: number}}
 *   `data` holds 0–1-normalized output triples; 3D is red-fastest (index = r + g·N + b·N²)
 */
export function table(from, to, { size, dims, shaper } = {}) {
	const f = conv(from, to)
	const domain = domainOf(from), range = domainOf(to)
	dims ??= channelwise(from, to) ? 1 : 3
	size ??= dims === 1 ? 4096 : 33
	if (!(size >= 2 && size <= (dims === 1 ? 65536 : 256)))
		throw new Error(`color-space/lut: LUT_${dims}D_SIZE ${size} out of spec (2–${dims === 1 ? 65536 : 256})`)
	const at = (c, t) => domain[c][0] + t * (domain[c][1] - domain[c][0]) // t: 0..1 fraction
	const norm = (v, c) => (v - range[c][0]) / (range[c][1] - range[c][0])
	const n = dims === 3 ? size ** 3 : size
	const data = new Float64Array(n * 3)
	const put = (arr, j, out, inp) => {
		for (let c = 0; c < 3; c++) {
			const v = norm(out[c], c)
			// refuse degenerate corners outright — appearance-model and data-table spaces
			// are only defined near real colors, and a lattice must cover the whole box;
			// the magnitude bound catches blow-ups that stay technically finite
			if (!isFinite(v) || Math.abs(v) > 1e6)
				throw new Error(`color-space/lut: ${from.name}(${inp.join(', ')}) → ${to.name} is ${isFinite(v) ? 'numerically degenerate' : 'not finite'} — the pair is undefined over ${from.name}'s full conventional range, so it has no LUT`)
			arr[j * 3 + c] = v
		}
	}
	if (dims === 1) {
		for (let i = 0; i < size; i++) {
			const t = i / (size - 1)
			const inp = [at(0, t), at(1, t), at(2, t)]
			put(data, i, f(...inp), inp)
		}
		return { from, to, dims, size, domain, range, data }
	}
	// shaper: each channel's tone diagonal t(v) = norm(f(v,v,v))[c], clamped to the
	// target's 0–1 range — monotone channels concentrate the lattice on the DISPLAYABLE
	// tone span (a scene-referred source spends >95% of its domain on super-range
	// highlights; the shaper collapses those onto the boundary node, i.e. the shaped
	// cube clips at the shaper — the trade a display conversion LUT wants). Flat or
	// non-monotone channels keep the identity. The lattice is sampled at the shaper's
	// inverse, so host-side shaper→trilinear reproduces f exactly at the nodes.
	let sh = null, S = 0
	if (shaper && dims === 3) {
		S = typeof shaper === 'number' ? shaper : 1024
		if (!(S >= 2 && S <= 65536)) throw new Error(`color-space/lut: shaper size ${S} out of spec (2–65536)`)
		const diag = (t) => f(at(0, t), at(1, t), at(2, t))
		sh = new Float64Array(S * 3)
		const mono = [true, true, true]
		let prev = null
		for (let j = 0; j < S; j++) {
			const d = diag(j / (S - 1))
			for (let c = 0; c < 3; c++) {
				if (prev && d[c] < prev[c] - 1e-9) mono[c] = false
				sh[j * 3 + c] = Math.min(1, Math.max(0, norm(d[c], c)))
			}
			prev = d
		}
		// a useful shaper spans most of 0..1 within the domain; degenerate ones → identity
		for (let c = 0; c < 3; c++) {
			if (!mono[c] || sh[(S - 1) * 3 + c] - sh[c] < 0.5)
				for (let j = 0; j < S; j++) sh[j * 3 + c] = j / (S - 1)
		}
	}
	// inverse shaper per grid coordinate — binary search on the sampled shaper,
	// windowed to the strictly-rising interior: a clamp plateau at 0 inverts to its
	// right edge (the black point) and a plateau at 1 to its left edge (the white
	// crossing), so no lattice node lands in clipped sub-black/super-range territory
	let win = null
	if (sh) {
		win = [0, 1, 2].map((c) => {
			let j0 = 0, j1 = S - 1
			while (j0 < j1 && sh[(j0 + 1) * 3 + c] <= 0) j0++
			while (j1 > j0 && sh[(j1 - 1) * 3 + c] >= 1) j1--
			return [j0, j1]
		})
	}
	const inv = (c, u) => {
		if (!sh) return u
		let [lo, hi] = win[c]
		if (u <= sh[lo * 3 + c]) return lo / (S - 1)
		if (u >= sh[hi * 3 + c]) return hi / (S - 1)
		while (hi - lo > 1) { const mid = (lo + hi) >> 1; (sh[mid * 3 + c] <= u ? lo = mid : hi = mid) }
		const a = sh[lo * 3 + c], b2 = sh[hi * 3 + c]
		return (lo + (b2 > a ? (u - a) / (b2 - a) : 0)) / (S - 1)
	}
	const N1 = size - 1
	for (let b = 0, j = 0; b < size; b++) for (let g = 0; g < size; g++) for (let r = 0; r < size; r++, j++) {
		const inp = [at(0, inv(0, r / N1)), at(1, inv(1, g / N1)), at(2, inv(2, b / N1))]
		put(data, j, f(...inp), inp)
	}
	return sh ? { from, to, dims, size, domain, range, data, shaper: sh, shaperSize: S }
		: { from, to, dims, size, domain, range, data }
}

/**
 * Read one color through a sampled lattice — per-channel linear (1D) or trilinear
 * (3D) interpolation, in the spaces' native units. This is exactly what a LUT host
 * (Resolve, ffmpeg) computes, so it is also the verifier.
 * @param {ReturnType<table>} tab
 * @param {number[]} vals source-space channel values
 * @returns {number[]} target-space channel values
 */
export function apply(tab, vals) {
	const { dims, size, domain, range, data, shaper, shaperSize } = tab
	const N = size, hi = N - 1
	let fr = vals.map((v, c) => Math.min(1, Math.max(0, (v - domain[c][0]) / (domain[c][1] - domain[c][0]))))
	// combined cube: the host runs the 1D shaper per channel first, then the 3D lattice
	if (shaper) fr = fr.map((v, c) => {
		const x = v * (shaperSize - 1), i = Math.min(shaperSize - 2, Math.floor(x)), t = x - i
		return Math.min(1, Math.max(0, shaper[i * 3 + c] * (1 - t) + shaper[(i + 1) * 3 + c] * t))
	})
	const out = [0, 0, 0]
	if (dims === 1)
		for (let c = 0; c < 3; c++) {
			const x = fr[c] * hi, i = Math.min(hi - 1, Math.floor(x)), t = x - i
			out[c] = data[i * 3 + c] * (1 - t) + data[(i + 1) * 3 + c] * t
		}
	else {
		const i = [0, 0, 0], t = [0, 0, 0]
		for (let c = 0; c < 3; c++) {
			const x = fr[c] * hi
			i[c] = Math.min(hi - 1, Math.floor(x)); t[c] = x - i[c]
		}
		for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
			const w = (dx ? t[0] : 1 - t[0]) * (dy ? t[1] : 1 - t[1]) * (dz ? t[2] : 1 - t[2])
			const j = ((i[0] + dx) + (i[1] + dy) * N + (i[2] + dz) * N * N) * 3
			for (let c = 0; c < 3; c++) out[c] += w * data[j + c]
		}
	}
	return out.map((v, c) => range[c][0] + v * (range[c][1] - range[c][0]))
}

/**
 * Measure the lattice against the direct conversion at random off-lattice points —
 * the numbers the .cube header carries. Errors are fractions of the target
 * channel's full scale (1 = the whole range). Reported twice: over the whole
 * domain, and over samples whose direct result lands inside the target range —
 * the LUT's working set. Scene-referred sources (camera logs) put most of their
 * domain in super-range highlights, so the in-range set is rejection-sampled to
 * its own `n` for solid statistics; `share` says how much of the domain it is.
 * @param {ReturnType<table>} tab
 * @param {number} [n=1000] sample count (per set)
 * @returns {{max: number, median: number, n: number, in: {max: number, median: number, share: number, n: number}}}
 */
export function verify(tab, n = 1000) {
	const f = conv(tab.from, tab.to)
	const { domain, range } = tab
	const r = rnd(0x51a7ed)
	const errAt = (inp) => {
		const direct = f(...inp), interp = apply(tab, inp)
		let e = 0, inR = true
		for (let c = 0; c < 3; c++) {
			const fs = range[c][1] - range[c][0]
			e = Math.max(e, Math.abs(direct[c] - interp[c]) / fs)
			const t = (direct[c] - range[c][0]) / fs
			if (t < -1e-6 || t > 1 + 1e-6) inR = false
		}
		return [e, inR]
	}
	const med = (a) => (a.sort((x, y) => x - y), a[a.length >> 1] ?? 0)
	const all = [], ins = []
	let tries = 0, hits = 0
	while ((all.length < n || ins.length < n) && tries < n * 200) {
		const inp = domain.map(([lo, hi]) => lo + r() * (hi - lo))
		const [e, inR] = errAt(inp); tries++
		if (all.length < n) all.push(e)
		if (inR) { hits++; if (ins.length < n) ins.push(e) }
	}
	return {
		max: Math.max(...all), median: med(all), n,
		// in.n is the count actually collected — a sliver-thin working set can exhaust
		// the try budget before reaching n, and the stats are only as strong as in.n
		in: { max: ins.length ? Math.max(...ins) : 0, median: med(ins), share: hits / tries, n: ins.length },
	}
}

const num = (v) => (Object.is(v, -0) ? 0 : v).toFixed(6)
const sci = (v) => v === 0 ? '0' : v.toExponential(1)
const end = (v) => String(+v.toPrecision(6))
const scaleNote = (name, r) => r.every(([a, b]) => a === 0 && b === 1) ? `${name} 0–1`
	: `${name} scaled to 0–1 from [${r.map(([a, b]) => `${end(a)}..${end(b)}`).join(', ')}]`

/**
 * Render a conversion as a .cube file (Adobe/IRIDAS format — Resolve, Premiere,
 * Final Cut, OBS, ffmpeg). Channelwise pairs emit LUT_1D_SIZE, the rest LUT_3D_SIZE
 * with red varying fastest. The header records provenance and the measured
 * deviation vs the direct conversion.
 * @param {object} from source space object
 * @param {object} to target space object
 * @param {object} [opts]
 * @param {number} [opts.size] lattice size — default 33 (3D) / 4096 (1D)
 * @param {1|3} [opts.dims] force dimensionality
 * @param {boolean|number} [opts.shaper] prepend the tone-diagonal 1D shaper (see {@link table}) —
 *   Resolve-flavor combined cube; Resolve + OCIO read it, ffmpeg's Adobe-strict lut3d does not
 * @param {string} [opts.title] TITLE line — default "from to to"
 * @param {number|false} [opts.verify=1000] off-lattice verification samples, false to skip
 * @returns {string} the .cube file text
 */
export function cube(from, to, opts = {}) {
	const tab = table(from, to, opts)
	const { dims, size, domain, range, data, shaper, shaperSize } = tab
	const v = opts.verify === false ? null : verify(tab, opts.verify || 1000)
	const lines = [
		`# ${from.name} → ${to.name} — generated by color-space (https://github.com/colorjs/color-space)`,
		`# formulas differentially verified against authoritative references, camera logs against official ACES vendor transforms — docs/formula-verification.md`,
		`# input: ${scaleNote(from.name, domain)} · output: ${scaleNote(to.name, range)}, unclamped`,
	]
	if (v) {
		const inr = v.in.share > 0 && v.in.share < 0.999
			? ` · in-range outputs (${(v.in.share * 100).toPrecision(2)}% of domain, ${v.in.n} samples): median ${sci(v.in.median)}, max ${sci(v.in.max)}`
			: ''
		lines.push(`# ${dims === 3 ? (shaper ? 'shaper + trilinear' : 'trilinear') : 'linear'} lattice vs direct conversion, ${v.n} off-lattice samples, fractions of full scale: median ${sci(v.median)}, max ${sci(v.max)}${inr}`)
	}
	if (shaper) lines.push(`# Resolve-flavor combined cube: 1D tone shaper + 3D lattice — DaVinci Resolve / OCIO (resolve_cube); not Adobe-strict readers (ffmpeg lut3d)`)
	lines.push(`TITLE "${(opts.title || `${from.name} to ${to.name}`).replace(/"/g, "'")}"`)
	if (shaper) {
		lines.push(`LUT_1D_SIZE ${shaperSize}`)
		for (let j = 0; j < shaper.length; j += 3)
			lines.push(`${num(shaper[j])} ${num(shaper[j + 1])} ${num(shaper[j + 2])}`)
	}
	lines.push(dims === 1 ? `LUT_1D_SIZE ${size}` : `LUT_3D_SIZE ${size}`)
	for (let j = 0; j < data.length; j += 3)
		lines.push(`${num(data[j])} ${num(data[j + 1])} ${num(data[j + 2])}`)
	return lines.join('\n') + '\n'
}
