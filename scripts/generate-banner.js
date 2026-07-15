#!/usr/bin/env node
// Generate web/img/banner.svg — the README's top visual.
//
// A perceptually-uniform hue sweep, its stops computed BY the library in OKLCh
// (so the rainbow is even to the eye, not bunched like a naive HSL wheel), at the
// highest even chroma every hue holds in sRGB — nothing clips. A soft top-down
// sheen overlay adds depth. Pure gradient SVG: tiny, crisp at any width, diff-able.
//
//   npm run banner
//
import space from '../index.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const H0 = 25, L = 0.69, C = 0.105, N = 72   // start hue, mid lightness, in-gamut chroma, stop count
const hex = (...v) => '#' + v.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')
const stops = []
for (let i = 0; i <= N; i++) {
	const h = (H0 + 360 * i / N) % 360
	stops.push(`<stop offset="${(100 * i / N).toFixed(2)}%" stop-color="${hex(...space.oklch.rgb(L, C, h))}"/>`)
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 200" preserveAspectRatio="none" role="img" aria-label="a perceptually-uniform hue sweep, painted through OKLCh">
<defs>
<linearGradient id="hue" x1="0" y1="0" x2="1" y2="0">${stops.join('')}</linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
</defs>
<rect width="1600" height="200" fill="url(#hue)"/>
<rect width="1600" height="200" fill="url(#sheen)"/>
</svg>
`

const out = join(dirname(fileURLToPath(import.meta.url)), '../web/img/banner.svg')
writeFileSync(out, svg)
console.log(`web/img/banner.svg written — ${N + 1} OKLCh stops, ${(svg.length / 1024).toFixed(1)} kB`)
