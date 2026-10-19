// A channel's sweep as CSS – the catalog strip and the dossier bar's no-GL face: the smooth ramp, a numeric lens's cells,
// a triple lens's runs – and the pool that computes the catalog's strips off the main thread. One module for both sides:
// the page and its workers (sweep-worker.js) run this very sweepCSS, so a strip painted here or there is the same bytes.
import { ramp, lensFor, space, clamp, rgbF } from './core.js'

export const byteRGB = rgb => rgb.map(x => clamp(Math.round(x), 0, 255))
export const rgbKey = rgb => (rgb[0] << 16) | (rgb[1] << 8) | rgb[2]
export const sameRGB = (a, b) => a.every((x, i) => x === b[i])

// a numeric lens: Q flat cells, each the color at its centre, wearing the limit's alpha there – the CSS twin of the GL kernel's
// uQ lattice (quantize the coordinate, then run the lens)
export const qCells = (s, vals, i, c, Q, gm) => { const lq = lensFor(s, gm)
	return Array.from({ length: Q }, (_, k) => { const v = vals.slice(); v[i] = c.min + (c.max - c.min) * (k + .5) / Q
		const a = lq ? lq(v) : 1, rgb = rgbF(s, v)
		return `rgb(${rgb.map(x => +x.toFixed(2)).join(' ')}${a === 1 ? '' : ` / ${a}`})` }) }
export const stepped = stops => { const n = stops.length; return `linear-gradient(90deg, ${stops.map((c, k) => `${c} ${(k / n * 100).toFixed(2)}% ${((k + 1) / n * 100).toFixed(2)}%`).join(',')})` }

// the JND grid: a regular OKLab lattice at ~one just-noticeable step (2.3 ΔE*ab ≈ .023 OKLab). Lightness uses bounded cell
// centers; opponent axes zero-centered – neutral a=b=0 must stay neutral. Mirrors the shader's quant3_ mode 103 exactly
const pcCache = new Map()
export function jndQ(t) { const src = byteRGB(t), key = rgbKey(src)
	const hit = pcCache.get(key); if (hit) return hit
	if (pcCache.size > 65536) pcCache.clear()
	const [L, A, B] = space.rgb.oklab(...src)
	const out = space.oklab.rgb((Math.floor(Math.min(L, .9999) / .023) + .5) * .023, Math.round(A / .023) * .023, Math.round(B / .023) * .023).map(x => clamp(Math.round(x), 0, 255))
	pcCache.set(key, out); return out }
// 16-bit RGB565 – real hardware depth: 5·6·5 bits per channel, mirrored from the shader
export const q565 = t => byteRGB(t).map((x, i) => { const n = [31, 63, 31][i]; return Math.round(Math.round(x / 255 * n) / n * 255) })
// the triple lenses that need no list: whole sRGB triples quantized by a rule (the palettes' nearest entry is the page's)
export const TRIPLE = { jnd: jndQ, 565: q565, web: t => t.map(x => Math.round(x / 51) * 51) }

// a triple lens's bar: the real quantizer sampled densely, adjacent equal colors merged – region widths stay truthful
// instead of inventing equal cells. A cluster cell is a real display color, but an IMAGINARY coordinate has nothing to
// quantize – the lens alpha stays
export const QBARN = 256
export const qBarGradient = (s, vals, i, c, qf, gm) => { const lq = gm ? lensFor(s, gm) : null, segs = []
	for (let k = 0; k < QBARN; k++) { const v = vals.slice(); v[i] = c.min + (c.max - c.min) * (k + .5) / QBARN
		const rgb = byteRGB(qf(rgbF(s, v))), a = lq ? lq(v) : 1, last = segs[segs.length - 1]
		if (last && last.a === a && sameRGB(last.rgb, rgb)) last.hi = k + 1
		else segs.push({ rgb, a, lo: k, hi: k + 1 }) }
	return `linear-gradient(90deg, ${segs.flatMap(r => { const lo = (r.lo / QBARN * 100).toFixed(2), hi = (r.hi / QBARN * 100).toFixed(2), col = `rgb(${r.rgb.join(' ')}${r.a === 1 ? '' : ` / ${r.a}`})`; return [`${col} ${lo}%`, `${col} ${hi}%`] }).join(',')})` }

/** One strip's sweep: channel i of space s swept over [min, max] at held vals, under the limit gm – smooth (n guides), a
 *  numeric lens's q cells, or a TRIPLE lens's runs (t). Plain data in, CSS out: what a worker is sent. */
export const sweepCSS = ({ s, vals, i, min, max, n, gm, q, t }) => typeof q === 'number' ? stepped(qCells(s, vals, i, { min, max }, q, gm))
	: t ? qBarGradient(s, vals, i, { min, max }, TRIPLE[t], gm)
	: `linear-gradient(90deg, ${ramp(s, vals, i, min, max, n, gm).join(',')})`

// ── the pool: the catalog's strips, computed off the main thread ──
// Each strip keeps one wish – the latest asked – and a worker holds one batch at a time, so a burst of colors never queues:
// it is the last one that gets computed. An answer paints when it is newer than what the strip shows, so a strip never
// steps back to an older color, and a moving color never starves it. A wish a worker can't run – a palette lens needs the
// page's lists (run) – and every wish where module workers can't start, run here, a frame's budget at a time.
// paint(el, css, key, fade) lays an answer on; done(el) says a strip was painted here, now – what is still wished drops.
export const sweeps = (paint, budget = 6) => {
	const N = globalThis.matchMedia?.('(pointer: coarse)').matches ? 2 : clamp((globalThis.navigator?.hardwareConcurrency || 4) - 2, 1, 4)   // a phone: two – each worker holds the library and its data again, and a phone's screen shows a third of the strips
	const wish = new Map(), here = new Map(), out = new Map(), idle = []   // el → wish, for a worker · el → wish, for the page · id → wish in flight · workers ready
	let workers = null, seq = 0, id = 0, raf = 0, soon = false, ready = false
	const land = (w, css) => { const el = w.el; if (!(w.seq > (el._sweep || 0))) return; el._sweep = w.seq; paint(el, css, w.key, w.fade) }
	const lost = wk => { workers = workers.filter(x => x !== wk); const at = idle.indexOf(wk); if (at >= 0) idle.splice(at, 1)
		for (const k of wk._ids || []) { const w = out.get(k); out.delete(k); if (w && w.el._want === w.key && !wish.has(w.el)) wish.set(w.el, w) }
		if (!workers.length) { for (const [el, w] of wish) here.set(el, w); wish.clear() }
		wk.terminate(); pump() }
	const start = () => { workers = []
		if (typeof Worker === 'function') for (let k = 0; k < N; k++) { let wk
			try { wk = new Worker(new URL('./sweep-worker.js', import.meta.url), { type: 'module' }) } catch { break }
			// a module worker awaiting its data drops a message sent before its handler exists: it says when it is ready
			wk.onmessage = ({ data }) => { if (data !== 'ready') for (const r of data) { const w = out.get(r.id); out.delete(r.id)   // a sweep that threw there is tried here
					if (w) r.css ? land(w, r.css) : w.el._want === w.key && !wish.has(w.el) && here.set(w.el, w) }
				ready = true; wk._ids = null; idle.push(wk); pump() }
			wk.onerror = e => { e.preventDefault(); lost(wk) }   // no module workers here (or a load that failed): its wishes run on the page
			workers.push(wk) }
		if (!workers.length) { for (const [el, w] of wish) here.set(el, w); wish.clear() }
		else setTimeout(() => { if (!ready) for (const wk of workers) lost(wk) }, 4000) }   // none ready in 4 s (a load that hangs): the page runs it all
	const slice = () => { raf = 0; const t0 = performance.now()
		for (const [el, w] of here) { if (performance.now() - t0 > budget) break
			here.delete(el); if (el.isConnected) try { land(w, w.run ? w.run() : sweepCSS(w.job)) } catch {} }
		if (here.size) raf = requestAnimationFrame(slice) }
	const pump = () => { soon = false
		if (!workers) start()
		while (idle.length && wish.size) { const wk = idle.pop(), per = Math.ceil(wish.size / (idle.length + 1)), batch = []
			for (const [el, w] of wish) { wish.delete(el); if (!el.isConnected) continue
				out.set(w.id = ++id, w); batch.push({ id: w.id, ...w.job }); if (batch.length >= per) break }
			if (batch.length) { wk._ids = batch.map(b => b.id); wk.postMessage(batch) } else idle.push(wk) }
		if (here.size && !raf) raf = requestAnimationFrame(slice) }
	return {
		want(el, key, job, fade, run) { if (el._want === key) return
			el._want = key; const w = { el, key, job, fade, run, seq: ++seq }
			wish.delete(el); here.delete(el)
			;(run || workers && !workers.length ? here : wish).set(el, w)
			if (!soon) { soon = true; queueMicrotask(pump) } },
		done(el, key) { el._want = key; el._sweep = ++seq; wish.delete(el); here.delete(el) } }
}
