// Atlas – the workbench's catalog-first direction. Everything shared comes from wb.js (the orbit, the
// chip, the stripe, the tags, the view controls, the pane and its tabs, the tour card, the agents
// block); this file adds only what the layout needs: the tour as a numbered strip, the family titles
// as a ladder (icons, jump, the active rung), the stripe's height for the sticky offsets, and the
// footer's plates and Cite popover. The ladder itself is CSS (atlas.css) – nothing here positions it.
import { boot, W, TOUR, disp, esc, openPane, refresh, plate, loadCite, citeHTML } from './wb.js'
import { OI } from '../js/variants-icons.js'
import { track, EVENT } from '../js/track.js'

const $ = id => document.getElementById(id), root = document.documentElement
const WIDE = matchMedia('(width >= 75rem)')   // wb.js's breakpoint: the pane is a side panel from here up

// the families' icons – glyphs the shared line family already draws, one per family: a screen for
// display RGB, the hue wheel for the RGB remixes, an opponent plane for the perceptual spaces, the
// spectral locus for colorimetry, a broadcast screen, a camera, a paint palette for surfaces
const FAMI = { 'Display & web': OI.display, 'RGB remixes': OI.polar, 'Perceptual': OI.opponent, 'Colorimetry & research': OI.chromaticity,
	'Video & broadcast': OI.delivery, 'Film & camera': OI.scene, 'Color order & surface': OI.palettes }

// the tour's stops, one word each for the strip (the full title is the button's tooltip and the card's heading)
const SHORT = ['Light', 'Measuring', 'The horseshoe', 'Screens', 'Controls', 'Perception', 'Modern', 'Video', 'Cameras', 'HDR', 'Paper']
$('stops').innerHTML = TOUR.map((st, i) => `<li><button type="button" data-stop="${i}" aria-controls="stop" aria-expanded="false" title="${esc(st.t)}"><span class="tnum">${i + 1}</span>${esc(SHORT[i] || disp(st.s))}</button></li>`).join('')
function markStops() { const open = !$('stop').hidden
	for (const b of $('stops').querySelectorAll('button')) { const on = open && +b.dataset.stop === W.tour
		b.setAttribute('aria-expanded', on); on ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current') } }

// the footer's two commands, as the site's code plates
$('f-npm-p').innerHTML = plate('npm install color-space', 'npm install command', { wrap: true })
$('f-mcp-p').innerHTML = plate('npx -y color-space mcp', 'MCP server command', { wrap: true })

// ── the ladder: every render of the catalog gets its titles' icons, jump buttons and stack positions ──
const cat = $('cat')
let act = -1
function decorate() { const shs = [...cat.querySelectorAll('.shelf')], n = shs.length
	shs.forEach((sh, i) => { const hd = sh.querySelector(':scope>.sh'), h2 = hd?.querySelector('h2'); if (!h2 || h2.querySelector('.tn')) return
		const name = h2.textContent
		hd.style.setProperty('--i', i); hd.style.setProperty('--j', n - 1 - i)   // its rung in the top pile, and in the bottom one
		h2.innerHTML = `<button type="button" class="tn" data-jump>${FAMI[name] ? `<span class="fic">${FAMI[name]}</span>` : ''}<span>${esc(name)}</span></button>` })
	act = -1; mark() }
// the family on screen: the last one whose content has crossed a third of the way down (index.html's rule)
function mark() { const shs = [...cat.querySelectorAll('.shelf')], lim = innerHeight * .35; let k = 0
	shs.forEach((sh, i) => { const f = sh.querySelector(':scope>.sh+*'); if (f && f.getBoundingClientRect().top <= lim) k = i })
	if (k === act) return; act = k
	shs.forEach((sh, i) => { const hd = sh.querySelector(':scope>.sh'), b = hd?.querySelector('.tn'); if (!b) return
		hd.classList.toggle('act', i === k); i === k ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current') }) }
let mraf = 0
addEventListener('scroll', () => { mraf ||= requestAnimationFrame(() => { mraf = 0; mark() }) }, { passive: true })
addEventListener('resize', () => { act = -1; mark() }, { passive: true })
new MutationObserver(decorate).observe(cat, { childList: true })   // wb.js re-renders the catalog on every filter and view change

// the stripe's height feeds the sticky offsets below it (CSS cannot read a wrapped bar's height)
new ResizeObserver(([e]) => root.style.setProperty('--wb-stripe', Math.round(e.borderBoxSize?.[0]?.blockSize ?? e.target.offsetHeight) + 'px')).observe($('stripe'))

boot({ arrange: 'family', view: 'grid', preview: 'sliders', quant: 'smooth' })

// after wb.js's own delegate (registered in boot): the strip, the jumps, the tour card's arrows
document.addEventListener('click', e => {
	const j = e.target.closest('[data-jump]')
	if (j) { j.closest('.shelf')?.querySelector(':scope>.sh+*')?.scrollIntoView({ block: 'start' }); return }
	const st = e.target.closest('[data-stop]')
	if (st) { const i = +st.dataset.stop, card = $('stop')
		if (!card.hidden && W.tour === i) { card.hidden = true; markStops(); return }   // the open stop's number folds it again
		W.tour = i; refresh('tour'); card.hidden = false; markStops(); track(EVENT.tour(i + 1, TOUR[i].s))
		if (WIDE.matches) openPane(TOUR[i].s, { from: st, focus: false })   // beside the catalog the stop's space opens with it, as the card's arrows do
		return }
	if (e.target.closest('[data-wt]')) markStops()
})

// Cite: the atlas's own BibTeX and APA (CITATION.cff, baked by build-site), read once on first open
$('a-cite').addEventListener('toggle', e => { if (e.newState === 'open') loadCite().then(c => { $('a-cite-b').innerHTML = citeHTML(c) }) })
