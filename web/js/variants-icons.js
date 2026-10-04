// UI-variants workshop – icons. Two families, never mixed within one control:
// · .fi – filled 16-grid glyphs (the alt page's rendering and view icons, extended)
// · .ic – the atlas line family: a 24 grid, currentColor at weight 2, round caps and joins
const fi = b => `<svg class="fi" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${b}</svg>`
const ic = b => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${b}</svg>`
const cells = (n, w) => Array.from({ length: n }, (_, k) => `<rect x="${1 + k * w}" y="5" width="${w - .5}" height="6" opacity="${((k + 1) / n).toFixed(2)}"/>`).join('')
const grid = (n, r) => Array.from({ length: n * n }, (_, k) => `<rect x="${1 + (k % n) * 14 / n}" y="${1 + Math.floor(k / n) * 14 / n}" width="${14 / n - r}" height="${14 / n - r}" opacity="${(.35 + .65 * ((k * 7) % (n * n)) / (n * n)).toFixed(2)}"/>`).join('')
// the spectral locus in a 16 box (CIE 1931 2° locus points, x·17+1.5, 15−y·16) and gamut triangles in the same frame
const LOCUS = 'M4.46 14.9 3.95 14.5 3.05 12.9 2.27 10.3 1.64 6.4 1.74 3 2.76 1.66 5.4 2.9 7.84 5 10.2 7.2 12.2 9 13.3 10.1 14 10.8Z'
const lim = inner => fi(`<path d="${LOCUS}" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" opacity=".45"/>${inner}`)

export const QI = {
	smooth: fi('<rect x="1" y="5" width="14" height="6" rx="1" fill="url(#vq-smooth)"/>'),
	10: fi(cells(5, 2.8)), 20: fi(cells(8, 1.75)),
	565: fi('<rect x="2" y="4" width="3" height="8"/><rect x="6.5" y="2.5" width="3" height="11"/><rect x="11" y="4" width="3" height="8"/>'),
	jnd: fi('<rect x="1.5" y="4" width="6" height="8"/><rect x="8.5" y="4" width="6" height="8" opacity=".62"/>'),
	web: fi([3.5, 8, 12.5].flatMap(y => [3.5, 8, 12.5].map(x => `<circle cx="${x}" cy="${y}" r="1.5"/>`)).join('')),
	names: fi('<path d="M1.5 3.5A1 1 0 0 1 2.5 2.5H8l6.5 6.5-5.5 5.5L2.5 8V3.5z"/><circle cx="5" cy="5" r="1.2" style="fill:var(--paper)"/>'),
	xkcd: fi('<path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6a1.5 1.5 0 0 1-1.5 1.5H7L4 14v-3h-.5A1.5 1.5 0 0 1 2 9.5z"/>'),
	tailwind: fi([0, 1, 2, 3, 4].map(k => `<rect x="2" y="${1.5 + k * 2.7}" width="12" height="2.2" opacity="${(.25 + k * .19).toFixed(2)}"/>`).join('')),
	pico8: fi(grid(4, .7)),
	ansi: fi('<rect x="1" y="2" width="14" height="12" rx="1.5" opacity=".25"/><path d="M4 6l2.5 2L4 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="9.4" width="4" height="1.5"/>'),
}
export const LI = {
	srgb: lim('<path d="M12.4 9.7 6.6 5.4 4.05 14z"/>'),
	p3: lim('<path d="M13.1 9.9 6 4 4.05 14z"/>'),
	rec2020: lim('<path d="M13.5 10.3 4.4 2.2 3.7 14.3z"/>'),
	vis: lim('<path d="M4.97 13.76 4.58 13.44 3.87 12.2 3.27 10.17 2.78 7.13 2.85 4.47 3.65 3.43 5.71 4.4 7.61 6.03 9.45 7.75 11.01 9.15 11.87 10.01 12.42 10.56Z"/>'),
	locus: lim(`<path d="${LOCUS}"/>`),
}
export const PI = {
	sliders: fi('<rect x="1" y="2.5" width="14" height="2.6" rx=".6"/><rect x="1" y="6.7" width="14" height="2.6" rx=".6" opacity=".7"/><rect x="1" y="10.9" width="14" height="2.6" rx=".6" opacity=".45"/>'),
	planes: fi('<rect x=".5" y="5" width="4.4" height="4.4" rx=".5"/><rect x="5.8" y="5" width="4.4" height="4.4" rx=".5" opacity=".7"/><rect x="11.1" y="5" width="4.4" height="4.4" rx=".5" opacity=".45"/>'),
}
export const VI = {
	grid: fi('<rect x="1" y="1" width="6" height="6" rx="1.2"/><rect x="9" y="1" width="6" height="6" rx="1.2"/><rect x="1" y="9" width="6" height="6" rx="1.2"/><rect x="9" y="9" width="6" height="6" rx="1.2"/>'),
	list: fi('<rect x="1" y="1.5" width="14" height="5.5" rx="1.2"/><rect x="1" y="9" width="14" height="5.5" rx="1.2" opacity=".45"/>'),
	table: fi('<rect x="1" y="1.5" width="14" height="2.4" rx="1"/><rect x="1" y="6.8" width="14" height="2.4" rx="1"/><rect x="1" y="12.1" width="14" height="2.4" rx="1"/>'),
}
// facet heads and their options
export const FI = {
	task: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>'),
	runs: ic('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'),
	sun: ic('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
	shape: ic('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5M12 12v9"/>'),
	signal: ic('<rect x="3" y="7" width="13" height="10" rx="1.5"/><path d="M16 10.5 21 8v8l-5-2.5"/>'),
	curve: ic('<path d="M4 4v16h16M6.5 17.5C10 17 11 7 19 6"/>'),
	white: ic('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'),
	age: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
}
export const OI = {
	// what it is for
	picking: ic('<path d="M4 20l1-3 8.5-8.5M11.5 6.5l6 6M14 4a2.5 2.5 0 0 1 3.5 0l2.5 2.5a2.5 2.5 0 0 1 0 3.5L18 12l-6-6z"/>'),
	palettes: ic('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="9.5" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>'),
	editing: ic('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
	compositing: ic('<path d="M12 3 3 8l9 5 9-5zM3 13l9 5 9-5"/>'),
	grading: ic('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 3v18M16 3v18M4 8h4M4 13h4M4 18h4M16 8h4M16 13h4M16 18h4"/>'),
	delivery: ic('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4M10.5 7.5v5l4-2.5z"/>'),
	print: ic('<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z"/>'),
	difference: ic('<path d="M12 4 3.5 19h17z"/>'),
	measurement: ic('<path d="M4 16 16 4l4 4L8 20zM8 12l2 2M11 9l2 2M14 6l2 2"/>'),
	research: ic('<path d="M9 3h6M10 3v6l-5.4 9.3A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.7L14 9V3M7 15h10"/>'),
	// where it runs – a stylesheet's braces, the GPU's triangles, WebAssembly's notched square, a lookup lattice
	css: ic('<path d="M9 4H8a2 2 0 0 0-2 2v3.5A2.5 2.5 0 0 1 3.5 12 2.5 2.5 0 0 1 6 14.5V18a2 2 0 0 0 2 2h1M15 4h1a2 2 0 0 1 2 2v3.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5V18a2 2 0 0 1-2 2h-1"/>'),
	glsl: ic('<path d="M12 4 3.5 19h17zM7.75 11.5h8.5M12 19l-4.25-7.5M12 19l4.25-7.5"/>'),
	wasm: ic('<path d="M4 4h5a3 3 0 0 0 6 0h5v16H4z"/>'),
	lut: ic('<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>'),
	// range, shape, signal, curve, age
	sdr: ic('<circle cx="12" cy="12" r="4"/><path d="M12 5.5v1M12 17.5v1M5.5 12h1M17.5 12h1"/>'),
	hdr: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
	component: ic('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5M12 12v9"/>'),
	opponent: ic('<path d="M12 3v18M4 12h16"/><ellipse cx="12" cy="12" rx="8" ry="3.2"/>'),
	polar: ic('<circle cx="12" cy="12" r="8"/><path d="M12 12l6.2-4.2M12 12V4"/>'),
	display: ic('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>'),
	scene: ic('<rect x="3" y="7" width="13" height="10" rx="1.5"/><path d="M16 10.5 21 8v8l-5-2.5"/>'),
	gamma: ic('<path d="M4 4v16h16"/><path d="M4 20C5.5 11 11 6.5 20 5"/>'),
	linear: ic('<path d="M4 4v16h16"/><path d="M4 20 20 5"/>'),
	perceptual: ic('<path d="M4 4v16h16"/><path d="M4 20C4.5 9 9 5.5 20 5"/>'),
	log: ic('<path d="M4 4v16h16"/><path d="M4 16.5C7 9 11 7 20 5.5"/>'),
	pq: ic('<path d="M4 4v16h16"/><path d="M4 20C5 12 7 8 11 6.5S17 5 20 4.5"/>'),
	hlg: ic('<path d="M4 4v16h16"/><path d="M4 20Q6.5 11 11 10T20 5"/>'),
	chromaticity: ic('<path d="M7 20 5.5 17 4.3 12 4.5 6 6 4 9.5 5.5 13.5 9 17 12.5 20 15.5z"/>'),
	current: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>'),
	historical: ic('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>'),
}
export const UI = {
	search: ic('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
	pipette: ic('<path d="m2 22 1-1h3l9-9M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3z"/>'),   // a color off the screen
	swap: ic('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),   // both ways
	pkg: ic('<path d="m7.5 4.3 9 5.1M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>'),   // a package
	shield: ic('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'),   // index.html's "Reference-tested"
	x: ic('<path d="M18 6 6 18M6 6l12 12"/>'),
	chev: ic('<path d="M6 9.5 12 15.5 18 9.5"/>'),
	prev: ic('<path d="M15 6l-6 6 6 6"/>'), next: ic('<path d="M9 6l6 6-6 6"/>'),
	star: '<svg class="ic star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"/></svg>',
	dice: ic('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r=".9"/><circle cx="15" cy="15" r=".9"/><circle cx="15" cy="9" r=".9"/><circle cx="9" cy="15" r=".9"/>'),
	filter: ic('<path d="M4 6h16M7 12h10M10 18h4"/>'),
	eye: ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
	sun: ic('<circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>'),
	moon: ic('<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>'),
	gh: '<svg class="fi" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
}
