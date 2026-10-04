// Atlas · an image as a source – index.html's: drop or paste one anywhere and every strip reads it. The image's pixels,
// sampled once, are binned along each channel of each space the page shows – lazily, a slice at a time, because a bin
// pass is a conversion per sample – and drawn as a histogram over the strip in the picker's ink: an alpha mask on one
// element per strip, so no per-frame work. The colors a person picked stay theirs: the image speaks only through
// the strips. One image at a time; a new one replaces it, clear() retires it. Says so on document ('wb:image').
import { sampleImage } from '../js/extract.js'
import { toSpace } from '../js/core.js'
import { classify } from '../js/variants-model.js'
import { lanes } from '../js/variants-catalog.js'
import { toast } from './wb.js'

const BINS = 256, SAMP = 8192, SLICE = 8   // bins per strip · samples per space · ms per slice
let IMG = null, src = null
const masks = new Map(), part = new Map(), queue = new Set(); let timer = 0
// a histogram as an alpha mask – index.html's histMask: hard columns, height to the 97th percentile (one flat sky
// would otherwise press every other bin into the floor), the crest at full ink
const mask = b => { const srt = Float32Array.from(b).sort(), m = srt[Math.floor(BINS * .97)] || srt[BINS - 1]; if (!m) return null
	const cv = Object.assign(document.createElement('canvas'), { width: BINS, height: 32 }), c = cv.getContext('2d')
	c.fillStyle = 'rgba(0,0,0,.82)'
	for (let j = 0; j < BINS; j++) { const h = Math.min(1, b[j] / m) * 32; if (h > 0) c.fillRect(j, 32 - h, 1, h) }
	return `url(${cv.toDataURL()})` }
// one slice of one space's pass – resumable: a heavy inverse (Munsell's search) would stall a frame outright. The
// walk is Knuth's multiplicative hash over the pixels, so no image row phase-locks with it
function step(s) { let st = part.get(s)
	if (!st) { const cls = classify(s); st = { cls, k: 0, n: IMG.length / 3, bins: cls.ch.map(() => new Float32Array(BINS)) }; part.set(s, st) }
	const { cls, n, bins } = st, cnt = Math.min(n, SAMP), t0 = performance.now()
	for (; st.k < cnt; st.k++) { if (!(st.k & 31) && performance.now() - t0 > SLICE) return false
		const i = (st.k * 2654435761) % n; let v; try { v = toSpace(s, [IMG[i * 3], IMG[i * 3 + 1], IMG[i * 3 + 2]]) } catch { continue }
		for (let c = 0; c < bins.length; c++) { const ch = cls.ch[c], t = (v[c] - ch.min) / (ch.max - ch.min); if (!(t >= 0 && t <= 1)) continue
			const x = t * (BINS - 1), j = x | 0, f = x - j; bins[c][j] += 1 - f; if (j + 1 < BINS) bins[c][j + 1] += f } }   // a sample splits between its two bins
	part.delete(s); masks.set(s, bins.map(mask)); return true }
const soon = () => { timer ||= setTimeout(() => { timer = 0
	for (const s of queue) { if (!step(s)) break; queue.delete(s); for (const el of document.querySelectorAll(`.sp[data-s="${CSS.escape(s)}"]`)) paint(el, s) }
	if (queue.size) soon() }, 16) }
// an entry's strips wear its space's histogram – or nothing, once the image is gone
function paint(el, s) { const ms = IMG ? masks.get(s) : null
	if (IMG && !ms) { queue.add(s); soon() }
	el.querySelectorAll('.ch').forEach((ch, i) => { const p = ms?.[i] || null
		if (!p && !ch._hist) return
		const h = ch._hist ||= ch.insertBefore(Object.assign(document.createElement('i'), { className: 'hist' }), ch.firstChild)
		if (h._p !== p) { h._p = p; if (p) h.style.maskImage = h.style.webkitMaskImage = p; h.hidden = !p } }) }
lanes.push(paint)

const say = () => document.dispatchEvent(new CustomEvent('wb:image', { detail: { src } }))
export async function take(f) { if (!f || !/^image\//.test(f.type || '')) return
	try { const px = await sampleImage(f); if (!px.length) return toast('No opaque pixels in that image')
		IMG = px; masks.clear(); part.clear(); queue.clear(); src?.startsWith('blob:') && URL.revokeObjectURL(src); src = URL.createObjectURL(f)
		for (const el of document.querySelectorAll('#cat .sp')) paint(el, el.dataset.s)
		toast('Every strip reads the image'); say() }
	catch { toast('Could not read that image') } }
export function clear() { if (!IMG) return; IMG = null; masks.clear(); part.clear(); queue.clear(); if (src) URL.revokeObjectURL(src); src = null
	for (const el of document.querySelectorAll('#cat .sp')) paint(el, el.dataset.s); say() }

// any door: a drop anywhere (the dossier's frame keeps its own), a paste – a veil says where it will land
const veil = Object.assign(document.createElement('div'), { className: 'veil', hidden: true, textContent: 'Drop the image – every strip will read it' })
document.body.append(veil)
const isImg = e => [...(e.dataTransfer?.items || [])].some(x => x.kind === 'file' && x.type.startsWith('image/'))
let depth = 0
addEventListener('dragenter', e => { if (isImg(e)) { depth++; veil.hidden = false } })
addEventListener('dragleave', () => { if (depth && !--depth) veil.hidden = true })
addEventListener('dragover', e => { if (isImg(e)) e.preventDefault() })
addEventListener('drop', e => { depth = 0; veil.hidden = true; if (!isImg(e)) return; e.preventDefault(); take([...e.dataTransfer.files].find(x => x.type.startsWith('image/'))) })
addEventListener('paste', e => { const it = [...(e.clipboardData?.items || [])].find(x => x.type.startsWith('image/')); if (it) { e.preventDefault(); take(it.getAsFile()) } })
