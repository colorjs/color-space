// The catalog's strips (web/js/sweep.js): one sweepCSS for the page and its workers, and the pool between them – each
// strip's latest wish only, an answer painted only when newer than what the strip shows, nothing sent to a worker before
// it says it is ready, and the page itself running what no worker can. The workers here are stand-ins the test answers
// by hand, in any order it likes; the page's frames are timers
import test, { is, ok } from 'tst'
import { ramp } from '../web/js/core.js'
import { sweepCSS, sweeps, stepped, qCells, qBarGradient, TRIPLE } from '../web/js/sweep.js'

globalThis.requestAnimationFrame ??= f => setTimeout(() => f(performance.now()), 0)
const tick = () => new Promise(r => setTimeout(r, 5))
const el = () => ({ isConnected: true })
const job = (h = 30) => ({ s: 'oklch', vals: [.7, .15, h], i: 0, min: 0, max: 1, n: 48, gm: 'vis' })
// a worker the test plays: what it was sent, and its answers in the test's hands
class Stand { static all = []; sent = []; constructor() { Stand.all.push(this) } postMessage(b) { this.sent.push(b) } terminate() { this.dead = true }
	ready() { this.onmessage({ data: 'ready' }) } answer(b = this.sent.at(-1)) { this.onmessage({ data: b.map(j => ({ id: j.id, css: sweepCSS(j) })) }) } }

test('sweep: one law – the smooth ramp, a numeric lens\'s cells, a triple lens\'s runs', () => {
	const j = job(), c = { min: 0, max: 1 }
	is(sweepCSS(j), `linear-gradient(90deg, ${ramp('oklch', j.vals, 0, 0, 1, 48, 'vis').join(',')})`, 'smooth: the page\'s own ramp')
	is(sweepCSS({ ...j, q: 10 }), stepped(qCells('oklch', j.vals, 0, c, 10, 'vis')), 'a numeric lens: its cells')
	is((sweepCSS({ ...j, q: 10 }).match(/%,|%\)$/g) || []).length, 10, '…ten of them')
	is(sweepCSS({ ...j, t: 'web' }), qBarGradient('oklch', j.vals, 0, c, TRIPLE.web, 'vis'), 'a triple lens: its runs')
})

test('sweep: with no workers the page runs every wish – the latest only, once', async () => {
	const W = globalThis.Worker; delete globalThis.Worker
	try {
		const painted = [], pool = sweeps((e, css, key) => painted.push(key)), a = el()
		pool.want(a, 'A', job(10)); pool.want(a, 'B', job(20))   // A → B before anything ran: A never computes
		await tick(); await tick()
		is(painted, ['B'], 'B painted, A dropped')
		pool.want(a, 'B', job(20)); await tick()
		is(painted, ['B'], 'B → B: nothing again')
		const b = el(); pool.want(b, 'C', job(30)); pool.done(b, 'D'); await tick()
		is(painted, ['B'], 'a strip painted on the spot (done) drops its wish')
		const gone = { isConnected: false }; pool.want(gone, 'E', job(40)); await tick()
		is(painted, ['B'], 'a strip gone from the page is not computed')
	} finally { globalThis.Worker = W }
})

test('sweep: workers – nothing before ready, a batch each, the newest answer wins, a lost worker\'s wishes come home', async () => {
	const W = globalThis.Worker; globalThis.Worker = Stand; Stand.all = []
	try {
		const painted = [], pool = sweeps((e, css, key) => painted.push(key)), a = el(), b = el()
		pool.want(a, 'A1', job(10)); pool.want(b, 'B1', job(20)); await tick()
		ok(Stand.all.length >= 1, `workers started: ${Stand.all.length}`)
		is(Stand.all.every(w => !w.sent.length), true, 'nothing sent before a worker says it is ready')
		const [w1, w2] = Stand.all
		w1.ready(); is(w1.sent.length, 1, 'ready: it takes a batch'); is(w1.sent[0].length, 2, '…every waiting wish, the only one ready')
		const first = w1.sent[0]
		pool.want(a, 'A2', job(30)); await tick()   // a newer wish while the first is out
		if (w2) { w2.ready(); is(w2.sent.at(-1).map(j => j.vals[2]), [30], 'the newer wish goes to the next ready worker') }
		const second = (w2 || w1).sent.at(-1)
		if (w2) { w2.answer(second); is(painted, ['A2'], 'the newer answer lands first') }
		w1.answer(first)
		is(painted.filter(k => k[0] === 'A').at(-1), w2 ? 'A2' : 'A1', 'an older answer arriving late never steps a strip back')
		is(painted.includes('B1'), true, 'the batch\'s other strip lands')
		// a sweep that threw in a worker is tried on the page
		const d = el(); pool.want(d, 'D1', job(45)); await tick()
		const out = Stand.all.find(w => w.sent.at(-1)?.some(j => j.vals[2] === 45)), bt = out.sent.at(-1)
		out.onmessage({ data: bt.map(j => ({ id: j.id })) }); await tick(); await tick()
		is(painted.at(-1), 'D1', 'an answer without its sweep: the page computes it')
		// a worker that fails takes nothing with it: what it held, still wished, runs on the page
		const c = el(); pool.want(c, 'C1', job(40)); await tick()
		const holder = Stand.all.find(w => w.sent.some(bt => bt.some(j => j.vals[2] === 40)))
		ok(holder, 'the wish went out')
		for (const w of Stand.all) w.onerror({ preventDefault() {} })
		await tick(); await tick()
		is(painted.at(-1), 'C1', 'every worker lost: the page computes the wish they held')
		pool.want(c, 'C2', job(50)); await tick(); await tick()
		is(painted.at(-1), 'C2', 'and every wish after')
	} finally { globalThis.Worker = W }
})
