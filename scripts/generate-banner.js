#!/usr/bin/env node
// Generate web/img/banner.svg — the README's top visual.
//
// One high-chroma Munsell hue circle at two resolutions: continuous, then the ten
// native hue families (5R / 5YR / … / 5RP). Stops come from the library's 1943
// Munsell Renotation, not hand-picked colors. Each family approaches its own sRGB
// limit; a circular interpolation keeps the continuous row smooth. Renotation colors
// are Bradford-adapted from illuminant C to display D65. Pure SVG: tiny, crisp.
//
//   npm run banner
//
import space from '../index.js'
import whitepoint from '../whitepoints.js'
import { mat3, inv3 } from '../util.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const H0 = 5, V = 6.8, CHROMA_CAP = 13, INSET = 0.91, N = 80
const hex = (...v) => '#' + v.map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
const BFD = space.lms.matrix.BFD, BFD_INV = inv3(BFD)
const LMS_C = mat3(BFD, ...whitepoint[2].C), LMS_D65 = mat3(BFD, ...whitepoint[2].D65)
const cToD65 = xyz => mat3(BFD_INV, ...mat3(BFD, ...xyz).map((v, i) => v * LMS_D65[i] / LMS_C[i]))
const rgb = (H, C) => {
	const xyy = space.munsell.xyy((H % 100 + 100) % 100, V, C)
	return space.xyz.rgb(...cToD65(space.xyy.xyz(...xyy)))
}
const inGamut = v => v.every(x => Number.isFinite(x) && x >= 0 && x <= 255)
const familyChroma = Array.from({ length: 10 }, (_, i) => {
	let lo = 0, hi = CHROMA_CAP
	for (let k = 0; k < 22; k++) {
		const C = (lo + hi) / 2
		if (inGamut(rgb(H0 + i * 10, C))) lo = C
		else hi = C
	}
	return lo
})
const chroma = H => {
	const p = ((H - H0) % 100 + 100) % 100 / 10, i = Math.floor(p), f = p - i
	return INSET * (familyChroma[i] * (1 - f) + familyChroma[(i + 1) % 10] * f)
}
const color = H => {
	const C = chroma(H), out = rgb(H, C)
	if (!inGamut(out)) throw Error(`banner: Munsell ${H} ${V}/${C} falls outside sRGB`)
	return hex(...out)
}
const continuous = Array.from({ length: N + 1 }, (_, i) =>
	`<stop offset="${(100 * i / N).toFixed(2)}%" stop-color="${color(H0 + 100 * i / N)}"/>`).join('')
const stepped = n => Array.from({ length: n }, (_, i) => {
	const c = color(H0 + 100 * i / n)
	return `<stop offset="${(100 * i / n).toFixed(2)}%" stop-color="${c}"/><stop offset="${(100 * (i + 1) / n).toFixed(2)}%" stop-color="${c}"/>`
}).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 160" preserveAspectRatio="none" role="img" aria-label="a high-chroma Munsell hue circle at value 6.8, shown continuously and in its 10 major hue families">
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
