// Atlas hero · Specimen – a type specimen whose typeface is one color: the sample set large (the current color, in the
// label column, over the family ladder), and the same color set in twelve notations – nine CSS can write, hex through
// color(display-p3 …), and three it cannot, in the catalog's own channel formatting. Every notation is a button that
// copies it. A notation that cannot hold the color – the sRGB ones for a wide color, a box's clipped corner – says
// so. Live: only text changes – fixed columns, tabular figures, the nodes kept.
import { FACTS, onColor, all } from './hero.js'
import { RGBX, hexNow, valsOf, meta, disp, gamutOf, GAMTIP, space, sent, classify } from '../js/variants-model.js'
import { CSS } from '../js/study-runtime.js'
import { fmtc, unit } from '../js/render.js'

// [key, space, notation]: the CSS ones through the library's own serializer (css.js, one for the atlas, the workbench
// and the MCP server); the rest as the catalog writes a reading – symbol, value, unit
const SHEET = [['hex', 'rgb', () => hexNow()], ['rgb'], ['hsl'], ['lab'], ['lchab'], ['xyz'], ['oklab'], ['oklch'], ['p3'],
	['cmyk'], ['ycbcr-bt709'], ['cam16']].map(([k, s = k, f]) => ({ k, s, css: f || CSS[s] && (() => CSS[s](valsOf(s))) }))
const NCSS = SHEET.filter(x => x.css).length
const reading = s => classify(s).ch.map((c, i) => `${c.sym} ${fmtc(valsOf(s)[i], meta[s].channels[i])}${unit(meta[s].channels[i])}`).join(' ')
// a reading's widest value, in characters – its box never narrows, so the values after it never move
const widest = (s, i) => { const c = meta[s].channels[i]; return Math.max(...[c.min, c.max].map(v => (fmtc(v, c) + unit(c)).length)) }
// does the notation hold the color? its numbers, decoded, land on the color within a code value (atlas.js's `same`) –
// valsOf clamps every space to its box, so a reading past an edge decodes elsewhere
const holds = x => { try { const v = x.k === 'hex' ? valsOf('rgb').map(Math.round) : valsOf(x.s), c = x.s === 'rgb' ? v : space[x.s].rgb(...v)
	return c.every((u, i) => Math.abs(u - RGBX[i]) < .75) } catch { return false } }

export default function mount({ hero, wb }) {
	hero.innerHTML = `<div class="row hsp">
		<div class="hsp-sam"><div class="hsp-sw" role="img" aria-label="The current color"></div><p class="hsp-g"></p></div>
		<div class="hsp-body">
			<h1 class="hsp-h"><span>One color.</span> <span>${FACTS.count} ways to write it.</span></h1>
			<div class="hsp-setw"><ul class="hsp-set" aria-label="The current color in ${SHEET.length} notations – each copies">${SHEET.map(x => `<li data-k="${x.k}">
				<span class="hsp-n">${wb.esc(x.k === 'hex' ? 'sRGB hex' : disp(x.s))}<span class="hsp-clip">clipped</span></span>
				<button type="button" class="hsp-v" data-k="${x.k}" title="Copy"><span class="sr">Copy </span>${x.css ? '<span class="hsp-t"></span>'
					: classify(x.s).ch.map((c, i) => `<span class="cvp"><i class="cl">${c.sym}</i><b class="hsp-t" style="--n:${widest(x.s, i)}"></b></span>`).join('')}</button>
			</li>`).join('')}</ul></div>
			<p class="hsp-cap">Click one to copy it. CSS can write the first ${NCSS}; color‑space writes it in all ${FACTS.count} – the catalog below.</p>
		</div>
	</div>`
	const cells = SHEET.map(x => { const li = hero.querySelector(`li[data-k="${x.k}"]`); return { x, li, t: [...li.querySelectorAll('.hsp-t')] } })
	const sw = hero.querySelector('.hsp-sw'), g = hero.querySelector('.hsp-g')
	const text = x => x.css ? x.css() : reading(x.s)
	// one frame: twelve strings, a flag each and a sentence – the nodes stay, their text changes
	function paint() {
		for (const { x, li, t } of cells) { if (x.css) t[0].textContent = x.css()
			else { const v = valsOf(x.s), ch = meta[x.s].channels; t.forEach((b, i) => { b.textContent = fmtc(v[i], ch[i]) + unit(ch[i]) }) }
			li.classList.toggle('clip', !holds(x)) }
		sw.style.background = CSS.oklch(valsOf('oklch'))   // the color itself – a wide-gamut screen shows a wide color, the rest map it
		g.textContent = sent(GAMTIP[gamutOf()]) }
	// a notation copies as it reads; the site's one toast says so
	const copy = e => { const b = e.target.closest('.hsp-v'); if (!b) return
		const x = SHEET.find(y => y.k === b.dataset.k), t = text(x)
		try { navigator.clipboard?.writeText(t)?.catch?.(() => {}) } catch {}
		wb.toast?.(`Copied ${t}`) }
	const set = hero.querySelector('.hsp-set'); set.addEventListener('click', copy)
	paint()
	const raf = requestAnimationFrame(paint)   // the first hero mounts before boot() settles the color – read it again then
	return all(onColor(paint), () => cancelAnimationFrame(raf), () => set.removeEventListener('click', copy))
}
