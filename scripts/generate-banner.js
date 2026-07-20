#!/usr/bin/env node
// Generate web/img/banner.svg — the README's top visual.
//
// One Munsell hue circle at two resolutions: continuous, then the ten native hue
// families (5R / 5YR / … / 5RP). Stops come from the library's 1943 Munsell
// Renotation, not hand-picked colors. Renotation colors are Bradford-adapted from
// their illuminant C to display D65. Pure SVG: tiny, crisp, diff-able.
//
//   npm run banner
//
import space from '../index.js'
import whitepoint from '../whitepoints.js'
import { mat3, inv3 } from '../util.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const H0 = 5, V = 6, CHROMA = 7, N = 80
const hex = (...v) => '#' + v.map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
const BFD = space.lms.matrix.BFD, BFD_INV = inv3(BFD)
const LMS_C = mat3(BFD, ...whitepoint[2].C), LMS_D65 = mat3(BFD, ...whitepoint[2].D65)
const cToD65 = xyz => mat3(BFD_INV, ...mat3(BFD, ...xyz).map((v, i) => v * LMS_D65[i] / LMS_C[i]))
const color = H => {
	const xyy = space.munsell.xyy((H % 100 + 100) % 100, V, CHROMA)
	const rgb = space.xyz.rgb(...cToD65(space.xyy.xyz(...xyy)))
	if (!rgb.every(x => Number.isFinite(x) && x >= 0 && x <= 255))
		throw Error(`banner: Munsell ${H} ${V}/${CHROMA} falls outside sRGB`)
	return hex(...rgb)
}
const continuous = Array.from({ length: N + 1 }, (_, i) =>
	`<stop offset="${(100 * i / N).toFixed(2)}%" stop-color="${color(H0 + 100 * i / N)}"/>`).join('')
const stepped = n => Array.from({ length: n }, (_, i) => {
	const c = color(H0 + 100 * i / n)
	return `<stop offset="${(100 * i / n).toFixed(2)}%" stop-color="${c}"/><stop offset="${(100 * (i + 1) / n).toFixed(2)}%" stop-color="${c}"/>`
}).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 160" preserveAspectRatio="none" role="img" aria-label="the Munsell hue circle at value 6 and chroma 7, shown continuously and in its 10 major hue families">
<defs>
<linearGradient id="continuous" x1="0" y1="0" x2="1" y2="0">${continuous}</linearGradient>
<linearGradient id="families" x1="0" y1="0" x2="1" y2="0">${stepped(10)}</linearGradient>
</defs>
<rect width="1600" height="80" fill="url(#continuous)"/>
<rect y="80" width="1600" height="80" fill="url(#families)"/>
</svg>
`

const out = join(dirname(fileURLToPath(import.meta.url)), '../web/img/banner.svg')
writeFileSync(out, svg)
console.log(`web/img/banner.svg written — continuous + 10-family Munsell, ${(svg.length / 1024).toFixed(1)} kB`)
