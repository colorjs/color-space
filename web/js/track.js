// Analytics — Umami Cloud: cookieless (the tracker sends with credentials 'omit', stores nothing and
// reads only its own opt-out key, localStorage umami.disabled), no backend, custom events. The Hobby plan is free (Umami Cloud FAQ) and
// lists 100K events a month (umami.is/pricing, as indexed 2026-10). Every pageview is one event and
// every stored event PROPERTY bills as one more, so events here carry none: the fact rides in the name.
// @see https://github.com/umami-software/docs/blob/master/content/docs/cloud/faq.mdx
// @see https://github.com/umami-software/docs/blob/master/content/docs/tracker-configuration.mdx
// @see https://github.com/umami-software/docs/blob/master/content/docs/tracker-functions.mdx
// @see https://github.com/umami-software/umami/blob/master/src/tracker/index.ts
//
// OFF by default: with UMAMI empty every call below is a no-op and no script is ever requested.
// Turn it on: create the website in Umami Cloud (domain color-space.io) and paste its website id
// (a UUID, shown in the site's tracking code) here. The tracker then loads once, lazily – on
// load() (called at idle to count the pageview) or on the first track()/view(). Events queue until
// it is in; if it is blocked (ad blockers block cloud.umami.is) they are dropped. No SRI: Umami
// updates script.js in place.
//
// Script options (data-*, per tracker-configuration.mdx and the tracker source): auto-track off –
// Umami's auto-tracker hooks history.replaceState and counts each path change as a pageview, which
// here would count a dossier's close (the URL returns to /) as a visit and miss the workbench's
// panes (?s=, a query); so pageviews are sent here, by path only. With auto-track off the tracker
// never re-reads the URL after it loads, so every hit names its own: a pageview its path, an event
// location.pathname at send time (else an event would carry the landing page's URL). domains –
// only color-space.io counts (localhost, previews and CI stay out); automated browsers
// (navigator.webdriver) never load it. exclude-search / exclude-hash – the default URL the tracker
// builds drops the query (the free-text filter rides there) and the hash (the color).
//
// What is sent: event names from the fixed vocabulary below, built from catalog ids only – never
// user input, file names or color values – each ≤ 50 characters, Umami's event-name limit (longer
// names are truncated). With each hit the tracker adds its default payload: hostname, language,
// referrer, screen size, page title and URL (tracker-functions.mdx).

export const UMAMI = ''

const SRC = 'https://cloud.umami.is/script.js'
const DOMAINS = 'color-space.io'
const MAX = 50

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
export const EVENT = {
	// the arrow marks a LUT: source>target/app – app is an editors.js id, or 'generic' (the library's
	// own cube()); no prefix, so the longest ids (15 + 15 + davinci-resolve) still fit in 50
	lut: (from, to, app = 'generic') => `${slug(from)}>${slug(to)}/${slug(app)}`,
	icc: (space, kind) => `icc-download/${slug(space)}-${slug(kind)}`,
	drop: () => 'image-drop',
	embed: (space) => `embed-copy/${slug(space)}`,
	tour: (n, space) => `tour-step/${slug(n)}-${slug(space)}`,
	lang: (lang) => `code-lang/${slug(lang)}`,
	vision: (id) => `vision-lens/${slug(id)}`,   // a cvd.js LENSES id
}

let state = 0 // 0 idle · 1 loading · 2 ready · -1 blocked
const queue = []
const send = (v) => { try { globalThis.umami?.track?.(v) } catch {} }
const page = (url, title) => (p) => ({ ...p, url, ...(title ? { title } : {}) })   // no name → Umami records a pageview
const event = (name) => (p) => ({ ...p, url: location.pathname, name })   // = umami.track(name) on the current path (tracker-functions.mdx)
// on once a website id is set (or load(id) was called with one); off for good once blocked
const hit = (v) => { if (state < 0 || !(UMAMI || state)) return; if (state === 2) send(v); else { queue.push(v); load() } }

/** Inject Umami's tracker once and count this page's view when it lands. No-op without a website id. */
export function load(id = UMAMI) {
	if (!id || state || typeof document === 'undefined') return
	if (globalThis.navigator?.webdriver) { state = -1; return }   // automated browsers never count – and never queue
	state = 1
	const s = document.createElement('script')
	s.async = true
	s.src = SRC
	Object.assign(s.dataset, { websiteId: id, domains: DOMAINS, autoTrack: 'false', excludeSearch: 'true', excludeHash: 'true' })
	s.onload = () => { state = 2; send(page(location.pathname)); queue.splice(0).forEach(send) }
	s.onerror = () => { state = -1; queue.length = 0 }
	document.head.append(s)
}

/** Count an event — name from EVENT, sent without properties; a safe no-op while analytics is off. */
export function track(name) {
	hit(event(String(name).slice(0, MAX)))
}

/** Count a dossier opened in-page (a replaceState the tracker does not watch) — not a page's first load. */
export function view(space, title) {
	hit(page('/' + slug(space), title))
}
