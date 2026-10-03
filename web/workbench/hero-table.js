// Atlas hero · Table – the periodic table of color spaces: every space a tile, grouped by family as a periodic table
// groups its elements – a family a block, its name and icon in the label column level with it, as the catalog's
// ladder lists them – oldest first. A tile carries a symbol, the year the space appeared, and along its foot the
// current color swept through the space's first channel: the catalog's own painter (strip()), so the foot says
// what that channel does to the color (a hue sweep is a rainbow, a lightness sweep runs black to white). 168
// sweeps are too many for every frame of the ambient orbit – a pass paints them a slice per frame, at most four
// passes a second, and none while the table is off screen. Every tile is the workbench's own button
// (data-open-s): its click delegate opens the dossier.
import { FACTS, onColor, all } from './hero.js'
import { meta, disp, valsOf, S } from '../js/variants-model.js'
import { FAMILIES, PICKS } from '../js/variants-data.js'
import { strip } from '../js/variants-catalog.js'
import { OI, UI } from '../js/variants-icons.js'

// the ladder's icons, one per family (atlas.js's FAMI)
const FAMI = { 'Display & web': OI.display, 'RGB remixes': OI.polar, 'Perceptual': OI.opponent, 'Colorimetry & research': OI.chromaticity,
	'Video & broadcast': OI.delivery, 'Film & camera': OI.scene, 'Color order & surface': OI.palettes }
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')   // wb.js's shelf ids, #shelf-<slug>

// a tile's symbol: the name itself where it is short – less the words a whole shelf shares (RGB, CIE, Y′CbCr …), a
// linear-light variant a leading l – else the short form it is written in; five characters at most, all distinct
const GENERIC = /^(CIE|ITU-R|RGB|Y′CbCr|YCbCr|Display|Wide|Gamut|chromaticity|triangle|Design|SMPTE|Rec\.)$/
const SHORT = {
	prophoto: 'Pro', 'prophoto-linear': 'lPro', a98rgb: 'A98', 'a98rgb-linear': 'lA98', 'cie-rgb': 'RGB',
	oklrab: 'Lrab', oklrch: 'Lrch', srlab2: 'SRL2', prolab: 'pLab', 'hdr-ipt': 'hIPT', lab: 'Lab', lchab: 'LCh', luv: 'Luv', lchuv: 'LChuv',
	'lab-d65': 'Lab65', 'lch-d65': 'LCh65', 'hdr-cie-lab': 'hLab', 'din99o-lab': 'D99o', 'din99o-lch': 'D99oC', din99d: 'D99d', labh: 'HLab',
	ucs: 'UCS', uvw: 'UVW', anlab: 'ANLab', ciecam02: 'CAM02', 'cam16-ucs': '16UCS', 'cam02-ucs': '02UCS', 'cam16-lcd': '16LCD',
	'cam16-scd': '16SCD', 'cam02-lcd': '02LCD', 'cam02-scd': '02SCD', hellwig2022: 'Hw22', nayatani95: 'Nay95',
	'xyz-d50': 'XYZ50', uv: 'u′v′', 'cct-duv': 'CCT', kelvin: 'K', maxwell: 'Maxw', wavelength: 'λ', 'xyz-abs-d65': 'aXYZ', macboyn: 'MB', osaucs: 'OSA', ohta: 'Ohta',
	'ycbcr-bt709': 'Y709', 'ycbcr-bt2020': 'Y2020', 'ycbcr-bt601-525': 'Y525', 'ycbcr-bt601-625': 'Y625', yccbccrc: 'YcCC', 'smpte-c': 'SMC', photoycc: 'PYCC',
	'rec2100-pq': 'PQ', 'rec2100-hlg': 'HLG', 'rec2100-linear': 'l2100',
	acescg: 'Acg', acescc: 'Acc', acescct: 'Acct', acesproxy: 'Aprx', 'aces2065-1': 'A2065', sgamut3cine: 'SG3C', davinci: 'DWG', cineon: 'Cin',
	log3g10: 'L3G10', log3g12: 'L3G12', clog: 'CLog', clog2: 'CLog2', clog3: 'CLog3', flog2c: 'FL2C', applelog: 'ALog', applelog2: 'ALog2',
	bmdfilm: 'BMF', kinelog3: 'KLog3', protune: 'Ptn', gplog2: 'GPL2', ilog: 'ILog', samsunglog: 'SaLog', redlog: 'RLog', redlogfilm: 'RLogF',
	panalog: 'Pana', viperlog: 'VpLog', filmicpro: 'FPLog', munsell: 'Mun', ostwald: 'Ostw', coloroid: 'Clrd',
}
function sym(s) { if (SHORT[s]) return SHORT[s]
	let n = disp(s), l = ''; if (n.startsWith('Linear-light ')) { l = 'l'; n = n.slice(13) }
	let w = n.split('/')[0].split(/\s+/); const k = w.filter(t => !GENERIC.test(t)); if (k.length) w = k
	return l + w.join('').replace(/[.\-–+()′'’]/g, '') }
const said = s => `${disp(s)} · ${meta[s].year}`

// the families, each oldest first (the shelf's order breaks a tie)
const FAM = FAMILIES.map(f => ({ name: f.name, spaces: f.spaces.map((s, i) => [s, +meta[s].year, i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(a => a[0]) }))
const KEY = 'lab'   // the key's tile: a starred space whose first channel – lightness – sweeps black to white through the color

// a tile is one element – the orbit restyles every element on the page each frame, so the year is its ::before, the
// sweep its background image, and only a starred tile has a child (the catalog's star)
const tileHTML = (s, key) => { const y = sym(s), n = [...y].length
	return `<${key ? 'span' : 'button type="button"'} class="ht-t${n > 3 ? ` l${Math.min(n, 5)}` : ''}" data-y="${meta[s].year}"${key ? '' : ` data-open-s="${s}" title="${esc(said(s))}" aria-label="${esc(said(s))}"`}>`
		+ `${esc(y)}${PICKS.has(s) ? `<span class="pick">${UI.star}</span>` : ''}</${key ? 'span' : 'button'}>` }

export default function mount({ hero }) {
	hero.innerHTML = `<div class="row ht-head">
		<div class="lab ht-key" aria-hidden="true">${tileHTML(KEY, true)}<ul>
			<li><b class="tnum">${meta[KEY].year}</b> the year it appeared</li><li><b>${esc(sym(KEY))}</b> its symbol</li>
			<li><span class="pick">${UI.star}</span> one to meet first</li><li><i></i> the current color, swept along its first channel</li></ul></div>
		<div class="ht-body">
			<h1 class="ht-h">The periodic table of color spaces.</h1>
			<p class="ht-dek">All ${FACTS.count}, in their ${FACTS.families} families, oldest first – each tile opens its space.<span class="ht-anat sr"> On each: the year it appeared, its symbol, and along its foot the current color swept through its first channel.</span></p>
		</div>
	</div>
	<section class="ht-tab" aria-label="The periodic table: ${FACTS.count} color spaces in ${FACTS.families} families, oldest first in each">${FAM.map((f, i) => `
		<div class="row ht-fam" role="group" aria-labelledby="ht-f${i}">
			<p class="lab"><button type="button" class="ht-fn" id="ht-f${i}" data-ht-jump="${slug(f.name)}" title="Go to ${esc(f.name)} in the catalog">${FAMI[f.name] ? `<span class="fic">${FAMI[f.name]}</span>` : ''}<span class="ht-fnm">${esc(f.name)}</span><span class="cnt tnum">${f.spaces.length}</span></button></p>
			<div class="ht-grid">${f.spaces.map(s => tileHTML(s)).join('')}</div>
		</div>`).join('')}
	</section>`

	// the feet: [space, the element whose sweep it is] – the key's tile and its legend's sample last
	const feet = [...hero.querySelectorAll('.ht-tab .ht-t')].map(t => [t.dataset.openS, t])
		.concat([...hero.querySelectorAll('.ht-key .ht-t, .ht-key li>i')].map(el => [KEY, el]))
	const GAP = 250, SLICE = 2   // ms: a pass starts at most this often · the share of a frame a pass may take
	let q = [], last = -GAP, want = true, raf = 0, seen = true
	const pump = now => { raf = 0
		if (!q.length) { if (!want || !seen) return
			if (now - last < GAP) { raf = requestAnimationFrame(pump); return }
			want = false; last = now; q = feet.slice() }
		const t0 = performance.now()
		do { const [s, el] = q.shift(); el.style.backgroundImage = strip(s, valsOf(s), 0, 8, S.limit) } while (q.length && performance.now() - t0 < SLICE)   // no var() inline: a shorthand with one is parsed again on every restyle
		if (q.length || want) raf = requestAnimationFrame(pump) }
	const kick = () => { want = true; if (seen) raf ||= requestAnimationFrame(pump) }
	const io = new IntersectionObserver(es => { seen = es.some(e => e.isIntersecting); if (seen && (want || q.length)) raf ||= requestAnimationFrame(pump) })
	io.observe(hero.querySelector('.ht-tab'))
	const lens = e => { if (['quant', 'metric', 'limit'].includes(e.detail?.key)) kick() }   // a new lens redraws every foot
	const jump = e => { const j = e.target.closest('[data-ht-jump]'); if (j) document.getElementById('shelf-' + j.dataset.htJump)?.querySelector(':scope>.sh+*')?.scrollIntoView({ block: 'start' }) }
	document.addEventListener('wb:set', lens); hero.addEventListener('click', jump)
	kick()
	return all(onColor(kick), () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('wb:set', lens); hero.removeEventListener('click', jump) })
}
