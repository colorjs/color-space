#!/usr/bin/env node
// Generate web/img/icon-*.svg — square app icons, the banner's own discipline
// (Ostwald full colors gamut-fit by the library, never hand-picked). Three variants:
//
//   icon-a: the quantization ladder — continuous, 4 steps, 2 steps
//   icon-b: the same ladder fully quantized — 8, 4, 2
//   icon-c: the picker itself — the brand color's oklch sliders (L, C, H sweeps,
//           chroma gamut-fit per stop, the site's own strip discipline)
//
//   npm run icon
import space from '../index.js'
import { color } from './generate-banner.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const hex = (...v) => '#' + v.map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')
const N = 96
const smooth = f => Array.from({ length: N + 1 }, (_, i) =>
	`<stop offset="${(100 * i / N).toFixed(2)}%" stop-color="${f(i / N)}"/>`).join('')
const stepped = (f, n) => Array.from({ length: n }, (_, i) => {
	const c = f(i / n)   // segment starts, the banner's convention
	return `<stop offset="${(100 * i / n).toFixed(2)}%" stop-color="${c}"/><stop offset="${(100 * (i + 1) / n).toFixed(2)}%" stop-color="${c}"/>`
}).join('')
const icon = (label, rows) => { const h = 96 / rows.length
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${label}">
<defs>${rows.map((g, i) => `<linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="0">${g}</linearGradient>`).join('\n')}</defs>
${rows.map((_, i) => `<rect y="${i * h}" width="96" height="${h}" fill="url(#g${i})"/>`).join('\n')}
</svg>
` }

const hue = t => color(360 * t)

// the site's DEFAULT color (web/js/render.js) — the icon picks what the page picks
const [L, C, H] = [0.72, 0.16, 41]
const inG = v => v.every(x => Number.isFinite(x) && x >= -0.5 && x <= 255.5)
const maxC = h => { let lo = 0, hi = 0.5
	for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; inG(space.oklch.rgb(L, m, h)) ? lo = m : hi = m }
	return lo }
const ok = (l, c, h) => hex(...space.oklch.rgb(l, c, h))

const ICONS = {
	'icon-a': icon('the Ostwald wheel — continuous, then 4, then 2 steps',
		[smooth(hue), stepped(hue, 4), stepped(hue, 2)]),
	'icon-b': icon('the Ostwald wheel quantized — 8, 4, 2 steps',
		[stepped(hue, 8), stepped(hue, 4), stepped(hue, 2)]),
	'icon-c': icon('oklch sliders of the brand color — lightness, chroma, hue',
		[smooth(t => ok(t, Math.min(C, maxC(H)), H)),
		 smooth(t => ok(L, t * maxC(H), H)),
		 smooth(t => ok(L, Math.min(C, maxC(360 * t)), 360 * t))]),
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const dir = join(dirname(fileURLToPath(import.meta.url)), '../web/img')
	for (const [name, svg] of Object.entries(ICONS)) {
		writeFileSync(join(dir, `${name}.svg`), svg)
		console.log(`web/img/${name}.svg — ${(svg.length / 1024).toFixed(1)} kB`)
	}
}
