// Colors in hand beyond one (web/js/stops.js): CSS gradient syntax read as CSS reads it, blended as CSS blends it.
// Differential against colorjs.io's mix (the CSS Color 4 interpolation algorithm, by the spec's own editors), plus the
// spec's defaults: @see https://drafts.csswg.org/css-color-4/#interpolation · https://drafts.csswg.org/css-images-4/#linear-gradients
import test, { is, ok } from 'tst'
import Color from 'colorjs.io'
import { parseGradient, mix, path, gradientText, shortText, splitTop, DASH } from '../web/js/stops.js'

// a stand-in for the page's single-color parser: hex and oklch() only
const parse = s => { const h = s.match(/^#([0-9a-f]{6})$/i); if (h) return { s: 'rgb', vals: [0, 2, 4].map(i => parseInt(h[1].slice(i, i + 2), 16)) }
	const o = s.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/); return o ? { s: 'oklch', vals: o.slice(1).map(Number) } : null }

test('stops: top-level commas only', () => {
	is(splitTop('#f00, oklch(0.7 0.1 30 / 0.5), rgb(1, 2, 3)'), ['#f00', 'oklch(0.7 0.1 30 / 0.5)', 'rgb(1, 2, 3)'])
})

test('stops: the interpolation method – named, or the CSS default (sRGB for all-legacy colors, else Oklab)', () => {
	// CSS Color 4 "Color Space for Interpolation": legacy-syntax colors only → srgb, any other → oklab; CSS Images 4: the method sits in the head
	is(parseGradient('linear-gradient(#ff0000, #0000ff)', parse).mix, { space: 'rgb', hue: 'shorter', named: false })
	is(parseGradient('linear-gradient(#ff0000, oklch(0.7 0.1 30))', parse).mix.space, 'oklab')
	is(parseGradient('linear-gradient(to right in oklch longer hue, #ff0000, #0000ff)', parse).mix, { space: 'oklch', hue: 'longer', named: true })
	is(parseGradient('linear-gradient(in lch, #ff0000, #0000ff)', parse).mix.space, 'lchab', 'CSS names read as the library ids')
	is(parseGradient('#ff0000, #0000ff', parse), null, 'a bare list is no gradient')
})

test('stops: positions fixed up as CSS does', () => {
	// CSS Images 4 "Color Stop Fixup": unplaced ends at 0% and 100%, each at least the one before, the unplaced spread evenly
	const pos = s => parseGradient(s, parse).stops.map(x => +x.pos.toFixed(4))
	is(pos('linear-gradient(#ff0000, #00ff00, #0000ff)'), [0, 0.5, 1])
	is(pos('linear-gradient(#ff0000 20%, #00ff00, #0000ff 60%)'), [0.2, 0.4, 0.6])
	is(pos('linear-gradient(#ff0000 50%, #00ff00 30%, #0000ff)'), [0.5, 0.5, 1])
	is(pos('linear-gradient(#ff0000 10% 30%, #0000ff)'), [0.1, 0.3, 1], 'two positions are two stops')
})

test('stops: the blend matches colorjs.io, every hue arc', () => {
	for (const [a, b] of [[[0.7, 0.15, 350], [0.6, 0.1, 20]], [[0.5, 0.2, 40], [0.8, 0.05, 260]], [[0.3, 0.1, 100], [0.9, 0.12, 90]]])
		for (const hue of ['shorter', 'longer', 'increasing', 'decreasing']) for (const f of [0.25, 0.5, 0.8]) {
			const want = new Color('oklch', a).mix(new Color('oklch', b), f, { space: 'oklch', hue }).coords, got = mix('oklch', a, b, f, hue)
			ok(Math.abs(got[0] - want[0]) < 1e-9 && Math.abs(got[1] - want[1]) < 1e-9 && Math.abs(((got[2] - want[2]) % 360 + 540) % 360 - 180) < 1e-9,
				`${a} → ${b} at ${f}, ${hue}: ${got.map(x => x.toFixed(4))} vs ${want.map(x => x.toFixed(4))}`) }
	const [l, aa, bb] = [[0.6, 0.1, -0.05], [0.8, -0.1, 0.1]], want = new Color('oklab', l).mix(new Color('oklab', aa), 0.3, { space: 'oklab' }).coords
	is(mix('oklab', l, aa, 0.3).map(x => +x.toFixed(12)), want.map(x => +x.toFixed(12)), 'rectangular: channel by channel')
})

test('stops: an achromatic end has no hue – the blend takes the other\'s (CSS Color 4: powerless components, interpolating with missing components)', () => {
	const m = mix('oklch', [1, 0, 0], [0.6, 0.2, 30], 0.5)
	is(+m[2].toFixed(9), 30, 'white → red rotates no hue')
})

test('stops: the run and the text', () => {
	const g = parseGradient('linear-gradient(in oklch, #ff8800, #0088ff)', parse)
	const run = path(g, (c, s) => c.s === s ? c.vals : new Color('srgb', c.vals.map(v => v / 255)).to('oklch').coords, 4)
	is(run.length, 5, 'one segment, four steps, both ends')
	is(gradientText(g, c => '#' + c.vals.map(v => v.toString(16).padStart(2, '0')).join('')), 'linear-gradient(in oklch, #ff8800, #0088ff)')
	const e = parseGradient('linear-gradient(in lch, #ff0000, #0000ff 70%)', parse); e.head = ''
	is(gradientText(e, () => 'x'), 'linear-gradient(in lch, x 0%, x 70%)', 'a library id goes back to its CSS name; an uneven stop keeps its place')
})

test('stops: the short form – colors joined by a dash (or `..`), a linear gradient in Oklab unless a method closes it', () => {
	const hx = c => '#' + c.vals.map(v => v.toString(16).padStart(2, '0')).join('')
	const g = parseGradient('#ff8800 – #0088ff', parse)
	is([g.fn, g.head, g.mix, g.stops.map(x => x.pos)], ['linear-gradient', '', { space: 'oklab', hue: 'shorter', named: true }, [0, 1]])
	is(parseGradient('#ff8800..oklch(0.7 0.1 30)..#0088ff in oklch longer hue', parse).mix, { space: 'oklch', hue: 'longer', named: true }, 'a method closes it')
	is(parseGradient('#ff8800..#00ff00 30%..#0088ff', parse).stops.map(x => +x.pos.toFixed(4)), [0, 0.3, 1], 'a stop keeps its place')
	is(splitTop('oklch(0.5 0.1 30)..#ff0000', DASH), ['oklch(0.5 0.1 30)', '#ff0000'], 'a color\'s own dots and parens are its own')
	is(splitTop('oklab(0.5 -0.1 0.1) - red – #00f—lime', DASH), ['oklab(0.5 -0.1 0.1)', 'red', '#00f', 'lime'], 'every dash joins – a value\'s own minus stays its own')
	is(parseGradient('#ff8800..', parse), null, 'one color is no gradient')
	is([parseGradient('#ff8800 –', parse), parseGradient('– #ff8800', parse)], [null, null], 'a dash with one color joins nothing')
	is(parseGradient('#ff8800-#0088ff', parse).stops.length, 2, 'a comma swapped for a hyphen: the list a gradient')
	is(splitTop('#ff8800-oklch(0.5 -0.1 30) -5', DASH), ['#ff8800', 'oklch(0.5 -0.1 30) -5'], 'a minus before a digit is a number\'s, inside parens or out')
	is(shortText(parseGradient('#ff8800 - #0088ff', parse), c => '#' + c.vals.map(v => v.toString(16).padStart(2, '0')).join('')), '#ff8800 – #0088ff', 'typed with a hyphen, written with the en dash, spaced')
	is(shortText(g, hx), '#ff8800 – #0088ff', 'Oklab, the shorter arc: no method written')
	is(gradientText(g, hx), 'linear-gradient(in oklab, #ff8800, #0088ff)', '…and as CSS, the method named – CSS would blend these hexes in sRGB')
	is(shortText(parseGradient('linear-gradient(#ff8800, #0088ff)', parse), hx), '#ff8800 – #0088ff in srgb', 'CSS\'s legacy default, said')
	is(splitTop('indigo to red to #00f', DASH), ['indigo', 'red', '#00f'], 'said as a gradient is: the word joins')
	is(parseGradient('#4b0082 to #ff0000 in oklch', parse)?.mix, { space: 'oklch', hue: 'shorter', named: true }, '…a method closing it')
	is(splitTop('tomato to pinto', DASH), ['tomato', 'pinto'], 'the word joins only as a word – tomato and pinto keep their own "to"')
	is(splitTop('#ff8800  TO\t#0088ff', DASH), ['#ff8800', '#0088ff'], 'in any case, any spacing')
	is([parseGradient('#ff8800 to', parse), parseGradient('to #ff8800', parse)], [null, null], 'the word with one color joins nothing – typed so far is no gradient yet')
	is(splitTop('oklch(0.5 0.1 30) to #fff', DASH), ['oklch(0.5 0.1 30)', '#fff'], 'a color\'s parens are its own beside the word too')
	{ const g3 = parseGradient('#ff8800 to #00ff00 40% to #0088ff in oklch longer hue', parse), back = parseGradient(shortText(g3, hx), parse)
		is([back.stops.map((x) => [hx(x.c), +x.pos.toFixed(4)]), back.mix], [g3.stops.map((x) => [hx(x.c), +x.pos.toFixed(4)]), g3.mix], 'written in the short form, read back the same – stops, places, method – whatever joint it writes') }
	is(shortText(parseGradient('linear-gradient(in oklch longer hue, #ff8800, #0088ff)', parse), hx), '#ff8800 – #0088ff in oklch longer hue')
	is(shortText(parseGradient('linear-gradient(90deg, #ff8800, #0088ff)', parse), hx), null, 'geometry has no short form')
	is(shortText(parseGradient('radial-gradient(#ff8800, #0088ff)', parse), hx), null)
	const t = shortText(parseGradient('#ff8800..#00ff00 30%..#0088ff in oklch', parse), hx)
	is(shortText(parseGradient(t, parse), hx), t, 'round-trips')
})
