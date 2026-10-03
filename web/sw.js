// Offline shell for the atlas. build-site.js stamps VERSION (content hash of the
// precache set — a deploy invalidates exactly when bytes change) and ASSETS (every
// staged non-document asset plus the root document). Space pages are NOT precached:
// each /<name> is a byte-copy of index.html and the router reads location.pathname,
// so offline navigation to any space falls back to the cached shell and the app
// opens the right dossier — the whole atlas offline at shell cost, not 164 copies.
// A /<lang>/ page falls back to its own language's shell (LANGS, stamped too): the
// English one would resolve its ./ assets under /<lang>/ and read English besides.
const VERSION = 'dev'
const ASSETS = ['./']
const LANGS = []
const CACHE = 'atlas-' + VERSION

self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
	e.waitUntil(caches.keys()
		.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
		.then(() => self.clients.claim()))
})

const shell = (url) => { const p = new URL(url).pathname.slice(new URL(self.registration.scope).pathname.length)
	const l = LANGS.find((c) => p === c || p.startsWith(c + '/')); return l ? `./${l}/` : './' }
self.addEventListener('fetch', (e) => {
	const { request } = e
	if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
	if (request.mode === 'navigate')
		// network-first: fresh documents while online; offline, any /<name> falls back to the shell
		e.respondWith(fetch(request).catch(() =>
			caches.match(request, { ignoreSearch: true }).then((r) => r || caches.match(shell(request.url)))))
	else
		// precached assets are immutable per VERSION — cache-first
		e.respondWith(caches.match(request, { ignoreSearch: true }).then((r) => r || fetch(request)))
})
