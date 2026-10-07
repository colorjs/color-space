// The catalog's icons: the menus' options, the cells' faces, the rail's shelves. Two families, never mixed within one
// control:
// · .fi – filled 16-grid glyphs (how the catalog is drawn: quantize, limit, the cards' preview, the view)
// · .ic – the line family: a 24 grid, currentColor at weight 2, round caps and joins (what a space is, what it is for)
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
// what a space is and what it is for: the facets' options, the shelves' glyphs
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
	// range, shape, signal, curve, status
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
	current: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>'),
	historical: ic('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>'),
	chromaticity: ic('<path d="M7 20 5.5 17 4.3 12 4.5 6 6 4 9.5 5.5 13.5 9 17 12.5 20 15.5z"/>'),
}
export const EYE = ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>')   // Vision's cell
