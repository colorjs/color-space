// Analytics — hosted GoatCounter: cookieless, stores nothing in the browser, needs no backend,
// and takes custom events (the free option that does all of that — research 2026-10-02).
//
// OFF by default: with GC empty every call below is a no-op and no script is ever requested.
// Set GC to the account code picked at signup (https://<GC>.goatcounter.com) to turn it on.
// Then the pinned count.v5.js loads once, lazily — on load() (call it at idle to count the
// pageview) or on the first track()/view() — with its subresource-integrity hash, so a
// changed file is refused, not run. Events queue until the script is in; if it is blocked
// (GoatCounter estimates adblockers miss about a third of visits) they are dropped.
//
// What is sent: event names from the fixed vocabulary below, built from catalog ids only —
// never user input, file names or color values. Pageviews carry path + query string (view
// filters here; the color rides the URL hash, which count.js never reads). GoatCounter
// itself records referrer, browser/OS, screen size and country, and counts each name once
// per visitor per 8 hours (people, not clicks). count.v5.js skips localhost and automated
// browsers, so tests and Playwright runs are not counted.
// @see https://www.goatcounter.com/help/events  @see https://www.goatcounter.com/help/countjs-versions

export const GC = ''

const SRC = 'https://gc.zgo.at/count.v5.js'
const SRI = 'sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ'

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
export const EVENT = {
	lut: (from, to, app = 'generic') => `lut-download/${slug(from)}-${slug(to)}-${slug(app)}`,   // app: an editors.js id, or 'generic' (the library's own cube())
	icc: (space, kind) => `icc-download/${slug(space)}-${slug(kind)}`,
	drop: () => 'image-drop',
	embed: (space) => `embed-copy/${slug(space)}`,
	tour: (n, space) => `tour-step/${slug(n)}-${slug(space)}`,
	lang: (lang) => `code-lang/${slug(lang)}`,
	vision: (id) => `vision-lens/${slug(id)}`,   // a cvd.js LENSES id
}

let state = 0 // 0 idle · 1 loading · 2 ready · -1 blocked
const queue = []
const send = (v) => { try { globalThis.goatcounter?.count?.(v) } catch {} }
const hit = (v) => { if (!GC || state < 0) return; if (state === 2) send(v); else { queue.push(v); load() } }

/** Inject count.v5.js once (it counts the pageview when it lands). No-op without an account code. */
export function load(code = GC) {
	if (!code || state || typeof document === 'undefined') return
	state = 1
	const s = document.createElement('script')
	s.async = true
	s.src = SRC
	s.integrity = SRI
	s.crossOrigin = 'anonymous'
	s.dataset.goatcounter = `https://${code}.goatcounter.com/count`
	s.onload = () => { state = 2; queue.splice(0).forEach(send) }
	s.onerror = () => { state = -1; queue.length = 0 }
	document.head.append(s)
}

/** Count an event — name from EVENT; a safe no-op while analytics is off. */
export function track(name, title) {
	const path = String(name).replace(/^\/+/, '')
	hit({ path, title: title || path, event: true })
}

/** Count a dossier opened in-page (history.replaceState is invisible to count.js) — not a page's first load. */
export function view(space, title) {
	hit({ path: '/' + slug(space), title })
}
