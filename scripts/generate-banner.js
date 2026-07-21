#!/usr/bin/env node
// Generate web/img/banner.svg — the README's top visual.
//
// One Ostwald hue circle at two resolutions: continuous, then ten steps of the
// wheel. Stops come from the library's Ostwald semichromes, not
// hand-picked colors: each hue is its FULL COLOR (zero white/black content) pulled
// into sRGB by the smallest equal white+black admixture that fits — so every hue
// approaches its own sRGB limit, the same discipline as the Munsell banner before it.
// Pure SVG: tiny, crisp.
//
//   npm run banner
//
import space from '../index.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const INSET = 0.97, N = 96
const hex = (...v) => '#' + v.map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
const inGamut = v => v.every(x => Number.isFinite(x) && x >= -0.5 && x <= 255.5)
// the most colorful sRGB-representable Ostwald color of hue H: the full color desaturated
// toward mid-gray by equal white+black content x — binary search the smallest x that fits
const color = H => {
	let lo = 0, hi = 50
	if (inGamut(space.ostwald.rgb(H, 0, 0))) hi = 0
	else for (let k = 0; k < 22; k++) {
		const x = (lo + hi) / 2
		if (inGamut(space.ostwald.rgb(H, x, x))) hi = x
		else lo = x
	}
	const x = hi / INSET
	return hex(...space.ostwald.rgb(H, x, x).map(v => Math.max(0, Math.min(255, v))))
}
const continuous = Array.from({ length: N + 1 }, (_, i) =>
	`<stop offset="${(100 * i / N).toFixed(2)}%" stop-color="${color(360 * i / N)}"/>`).join('')
const stepped = n => Array.from({ length: n }, (_, i) => {
	const c = color(360 * i / n)
	return `<stop offset="${(100 * i / n).toFixed(2)}%" stop-color="${c}"/><stop offset="${(100 * (i + 1) / n).toFixed(2)}%" stop-color="${c}"/>`
}).join('')

export const bannerSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 160" preserveAspectRatio="none" role="img" aria-label="the Ostwald hue circle at full color, shown continuously and in ten steps">
<defs>
<linearGradient id="continuous" x1="0" y1="0" x2="1" y2="0">${continuous}</linearGradient>
<linearGradient id="families" x1="0" y1="0" x2="1" y2="0">${stepped(10)}</linearGradient>
</defs>
<rect width="1600" height="80" fill="url(#continuous)"/>
<rect y="80" width="1600" height="80" fill="url(#families)"/>
</svg>
`

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const svg = bannerSVG()
	const out = join(dirname(fileURLToPath(import.meta.url)), '../web/img/banner.svg')
	writeFileSync(out, svg)
	console.log(`web/img/banner.svg written — continuous + 10-step Ostwald, ${(svg.length / 1024).toFixed(1)} kB`)
}
