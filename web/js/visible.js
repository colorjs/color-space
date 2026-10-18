// What is a color at all, and which display gamut holds one – the spectral locus (CIE 1931 2°, 380–700 nm at 5 nm, through
// the registry's own wavelength space), its even-odd test, and the tightest of CSS Color 4's predefined RGB gamuts.
// Pure over a registry `space`: the page asks it of its bundle (core.js), color-space/util of the package's – one law.
export default space => {
	let LOCUS = null
	function locus() {
		if (LOCUS) return LOCUS
		const pts = []
		for (let nm = 380; nm <= 700; nm += 5) {
			const [X, Y, Z] = space.wavelength.xyz(nm)
			const s = X + Y + Z
			pts.push([X / s, Y / s])
		}
		return LOCUS = pts
	}
	/** A chromaticity this close to the curve is on it: the standards' primaries are monochromatic lights published to three
	 *  places – Rec. 2020's 532 nm green falls 0.0007 past the CMF locus, its blue 0.0005, P3's red 0.0001, ProPhoto's red
	 *  exactly on it – and a light on the locus is real. ProPhoto's green, 0.033 past it, stays imaginary */
	const LOCUS_EPS = 1e-3
	/** Is this chromaticity a colour at all? Even-odd crossing over the closed locus, or within LOCUS_EPS of it. */
	function visibleXY(x, y) {
		const P = locus()
		let c = false
		for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
			const a = P[i], b = P[j]
			if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c
		}
		if (c) return true
		for (let i = 0, j = P.length - 1; i < P.length; j = i++) {   // outside: on the curve after all?
			const [ax, ay] = P[i], ex = P[j][0] - ax, ey = P[j][1] - ay, t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)))
			if (Math.hypot(x - ax - t * ex, y - ay - t * ey) < LOCUS_EPS) return true
		}
		return false
	}
	/** A color's CIE 1931 xy chromaticity, null for none (a negative light). Black holds no light, so no chromaticity of its own:
	 *  it sits where every gray does, at the white's (the library's own white, so black and the darkest gray share a point) */
	let WXY = null
	const xyOf = (X, Y, Z) => { const s = X + Y + Z
		if (s > 1e-6) return [X / s, Y / s]
		if (Math.abs(X) + Math.abs(Y) + Math.abs(Z) > 1e-6) return null
		return WXY ??= ((W) => [W[0] / (W[0] + W[1] + W[2]), W[1] / (W[0] + W[1] + W[2])])(space.rgb.xyz(255, 255, 255)) }
	/** Is this XYZ a colour at all? Black is; anything off the locus is not. */
	const visibleXYZ = (X, Y, Z) => {
		const s = X + Y + Z
		if (!isFinite(s)) return false
		if (s <= 1e-9) return X > -1e-6 && Y > -1e-6 && Z > -1e-6   // black, not a negative coordinate
		return visibleXY(X / s, Y / s)
	}
	/**
	 * The tightest standard display gamut holding a color (space s, coordinates v): 'srgb', 'p3' or 'rec2020' – CSS Color 4's
	 * predefined spaces (#predefined), each channel within half a code value of its box, as the fields' kernel pads its cut
	 * (gl.js uGam) – 'out' past all three, null for no color at all (off the spectral locus, or no coordinates)
	 */
	function tightGamut(s, v) {
		const to = d => s === d ? v : space[s][d](...v)
		try {
			const g = [['srgb', () => to('rgb').map(u => u / 255)], ['p3', () => to('p3')], ['rec2020', () => to('rec2020')]].find(([, e]) => e().every(u => u >= -0.002 && u <= 1.002))
			return g ? g[0] : visibleXYZ(...to('xyz')) ? 'out' : null
		} catch { return null }
	}
	return { locus, LOCUS_EPS, xyOf, visibleXYZ, tightGamut }
}
