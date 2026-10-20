// The exports' sums, off the page's thread: a LUT's lattice checked against the direct conversion (its size, its median
// and its largest error) and an ICC profile's size – 30 to 70 ms each, once a card's first frames. One module for both
// sides: the page asks (calc), its worker (calc-worker.js) runs these very jobs; where a module worker can't start, they
// run on the page, a task each
import { space } from './core.js'
import { table, verify, channelwise } from '../../lut.js'
import { profile } from '../../icc.js'

export const JOBS = {
	// s → to as a lattice: o as asked, or – auto – a 1D curve where the pair is channelwise, else an n³ cube
	lut: ({ s, to, o, auto, n }) => {
		const one = !!auto && channelwise(space[s], space[to]), tab = table(space[s], space[to], auto ? (one ? {} : { size: n }) : o)
		const v = verify(tab, 400), e = v.in.share > 0 && v.in.share < 0.999 ? v.in : v   // in range, where part of the lattice is out of it
		return { one, dims: tab.dims, size: tab.size, shaper: !!tab.shaper, shaperSize: tab.shaperSize || 0, median: e.median, max: e.max } },
	icc: ({ s }) => ({ bytes: profile(space[s], { xyz: space.xyz }).length }),
}

// the worker, started at the first ask; it says when it is ready (a module awaiting its data drops a message sent before
// its handler exists). Not ready in 4 s, or failed: every job asked runs here
let w = null, ready = false, seq = 0
const out = new Map(), queue = []   // id → ask in flight · asks waiting for the worker's ready
const here = ({ job, args, ok, no }) => setTimeout(() => { try { ok(JOBS[job](args)) } catch (e) { no(e) } })
const fail = () => { const all = [...out.values(), ...queue]; out.clear(); queue.length = 0; w?.terminate?.(); w = false; all.forEach(here) }
const post = (q) => { const id = ++seq; out.set(id, q); w.postMessage({ id, job: q.job, args: q.args }) }
const boot = () => {
	if (w !== null) return
	try { w = new Worker(new URL('./calc-worker.js', import.meta.url), { type: 'module' }) } catch { w = false; return }
	w.onmessage = ({ data }) => {
		if (data === 'ready') { ready = true; queue.splice(0).forEach(post); return }
		const q = out.get(data.id); out.delete(data.id)
		if (q) data.err != null ? q.no(new Error(data.err)) : q.ok(data.out) }
	w.onerror = (e) => { e.preventDefault(); fail() }
	setTimeout(() => { if (!ready && w) fail() }, 4000) }

/** A job's answer – JOBS[job](args), computed off the page's thread – as a promise; its error, a rejection */
export const calc = (job, args) => new Promise((ok, no) => {
	boot(); const q = { job, args, ok, no }
	if (!w) here(q); else if (ready) post(q); else queue.push(q) })
