#!/usr/bin/env node
// Generate web/img/banner.svg — the README's top visual.
//
// One constant-lightness OKLCh hue sweep at three resolutions: continuous, 20
// steps, 10 steps. Stops are computed BY the library, not hand-picked. Chroma follows
// a smooth roll-off below the sRGB gamut edge — vivid without clipping or the hard
// vertical seam a capped gamut curve produced. Pure SVG: tiny, crisp, diff-able.
//
//   npm run banner
//
import space from '../index.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const H0 = 25, L = 0.7, ROLL = 0.24, INSET = 0.97, N = 72
const hex = (...v) => '#' + v.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')
const gamutChroma = h => {
	let lo = 0, hi = 0.4
	for (let i = 0; i < 24; i++) {
		const c = (lo + hi) / 2
		if (space.oklch.rgb(L, c, h).every(x => x >= 0 && x <= 255)) lo = c
		else hi = c
	}
	// Smoothly approaches ROLL instead of min(maxChroma, cap): no derivative kink/seam.
	return INSET * lo * ROLL / Math.sqrt(lo ** 2 + ROLL ** 2)
}
const color = h => hex(...space.oklch.rgb(L, gamutChroma(h), h))
const continuous = Array.from({ length: N + 1 }, (_, i) =>
	`<stop offset="${(100 * i / N).toFixed(2)}%" stop-color="${color((H0 + 360 * i / N) % 360)}"/>`).join('')
const stepped = n => Array.from({ length: n }, (_, i) => {
	const c = color((H0 + 360 * i / n) % 360)
	return `<stop offset="${(100 * i / n).toFixed(2)}%" stop-color="${c}"/><stop offset="${(100 * (i + 1) / n).toFixed(2)}%" stop-color="${c}"/>`
}).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 240" preserveAspectRatio="none" role="img" aria-label="an OKLCh hue sweep shown continuously, in 20 steps, and in 10 steps">
<defs>
<linearGradient id="continuous" x1="0" y1="0" x2="1" y2="0">${continuous}</linearGradient>
<linearGradient id="steps20" x1="0" y1="0" x2="1" y2="0">${stepped(20)}</linearGradient>
<linearGradient id="steps10" x1="0" y1="0" x2="1" y2="0">${stepped(10)}</linearGradient>
</defs>
<rect width="1600" height="80" fill="url(#continuous)"/>
<rect y="80" width="1600" height="80" fill="url(#steps20)"/>
<rect y="160" width="1600" height="80" fill="url(#steps10)"/>
</svg>
`

const out = join(dirname(fileURLToPath(import.meta.url)), '../web/img/banner.svg')
writeFileSync(out, svg)
console.log(`web/img/banner.svg written — continuous + 20-step + 10-step OKLCh, ${(svg.length / 1024).toFixed(1)} kB`)
