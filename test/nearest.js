// The large palettes' nearest-site search (web/js/nearest.js): the grid's answer is the scan's – exact under OKLab
import test, { is } from 'tst'
import { okGrid, nearestK } from '../web/js/nearest.js'

const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7)   // a fixed sequence: the check repeats
const sites = Array.from({ length: 3000 }, () => ({ ok: [rnd(), rnd() * 0.8 - 0.4, rnd() * 0.8 - 0.4] }))
const scan = (ok, k) => sites.map((s, i) => [(s.ok[0] - ok[0]) ** 2 + (s.ok[1] - ok[1]) ** 2 + (s.ok[2] - ok[2]) ** 2, i]).sort((a, b) => a[0] - b[0]).slice(0, k).map(x => x[1])

test('nearest: the grid finds what a scan finds – the nearest, and the nearest eight in order', () => {
	const g = okGrid(sites)
	const qs = [[0.5, 0, 0], [0, 0, 0], [1, 0.3, -0.3], [0.2, -0.45, 0.45], ...Array.from({ length: 200 }, () => [rnd(), rnd() - 0.5, rnd() - 0.5])]
	is(qs.filter(q => nearestK(g, q, 1)[0] !== scan(q, 1)[0]).length, 0, 'the nearest, for 204 queries – inside, at the corners, outside the sites\' range')
	is(qs.filter(q => nearestK(g, q, 8).join() !== scan(q, 8).join()).length, 0, 'the nearest eight, in order')
})
test('nearest: one site, and none', () => {
	is(nearestK(okGrid([{ ok: [0.9, 0.2, 0.1] }]), [0, -0.4, -0.4], 1), [0], 'one site is everyone\'s nearest, however far')
	is(nearestK(okGrid([]), [0.5, 0, 0], 1), [], 'no sites, no answer')
})
