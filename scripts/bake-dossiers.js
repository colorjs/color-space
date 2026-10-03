#!/usr/bin/env node
// Prerender each stamped page's DOSSIER — the "name view" (color-space.io/<name>)
// arrives with the modal OPEN and contentful at first paint, instead of waiting for
// the whole module graph before anything space-specific shows. No second template:
// a headless browser drives the REAL app once, opens every space's dossier from the
// catalog, and serializes the detail markup into that space's stamped document —
// title, channels, features, lineage, description, sources, code, nav. Instrument
// canvases ship empty and paint when GL arrives. Hydration re-runs buildDetail from
// the same DEFAULT state and replaces the shell with byte-equivalent markup, so
// nothing visibly moves. Crawlers get the full dossier as document content.
//
// Every stamped language gets its own pass from its own /<lang>/ index: the dossiers
// it bakes are the runtime's, read through that language's table.
//
// Skips (with a warning) when playwright or its browser is unavailable — the site
// still works, the name view just boots the old way. CS_NO_DOSSIERS=1 skips for
// quick dev builds.
import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { SPACES } from '../web/js/render.js'

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.wasm': 'application/wasm', '.txt': 'text/plain', '.xml': 'application/xml', '.woff2': 'font/woff2' }

export async function bakeDossiers(site, i18n) {
	if (process.env.CS_NO_DOSSIERS) { console.warn('bake-dossiers: skipped (CS_NO_DOSSIERS)'); return }
	let chromium
	try { ({ chromium } = await import('playwright')) }
	catch { console.warn('bake-dossiers: playwright unavailable — name views ship without prerendered dossiers'); return }
	const srv = createServer((req, res) => {
		try {
			let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
			if (p.endsWith('/')) p += 'index.html'
			if (!extname(p)) p += '.html'
			const b = readFileSync(join(site, p))
			res.setHeader('content-type', MIME[extname(p)] || 'application/octet-stream')
			res.end(b)
		} catch { res.statusCode = 404; res.end() }
	})
	await new Promise((r) => srv.listen(0, '127.0.0.1', r))
	let browser
	try { browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }) }
	catch (e) { srv.close(); console.warn(`bake-dossiers: browser launch failed (${String(e.message).split('\n')[0]}) — name views ship without prerendered dossiers`); return }
	try { for (const L of [{ code: 'en', pages: new Set(SPACES) }, ...(i18n?.langs || [])]) {
		const pre = L.code === 'en' ? '' : L.code + '/', spaces = SPACES.filter((s) => L.pages.has(s))
		if (!spaces.length) continue
		// reduced motion: the ambient hue orbit and the solid's spin stay off, so every dossier bakes
		// in the DEFAULT state hydration rebuilds (an orbiting color once froze into each page at
		// capture, a different one per build), and their per-frame repaints – software GL here –
		// can't starve the idle slices that wire the catalog's rows
		const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
		await page.goto(`http://127.0.0.1:${srv.address().port}/${pre}index.html`, { waitUntil: 'load' })
		// module readiness has no global signal — the first modal that opens IS the signal.
		// Null-safe throughout: a throwing predicate REJECTS waitForFunction instead of
		// retrying, and #modal can be transiently absent mid-hydration.
		await page.waitForFunction(() => {
			document.querySelector('.ent[data-s="rgb"] .nm')?.click()
			const m = document.getElementById('modal')
			return !!m && !m.hidden
		}, { timeout: 30000, polling: 250 })
		await page.evaluate(() => document.getElementById('mx').click())
		// the rows below the fold wire in idle slices, in document order (wireCat), and an open
		// dossier's instruments leave a software-rendered page almost no idle time – so the catalog
		// finishes wiring with no dossier open: its LAST row opening one says every row is live
		await page.waitForFunction(() => {
			;[...document.querySelectorAll('.ent[data-s] .nm')].at(-1)?.click()
			const m = document.getElementById('modal')
			return !!m && !m.hidden
		}, { timeout: 60000, polling: 250 })
		await page.evaluate(() => document.getElementById('mx').click())
		for (const s of spaces) {
			// openModal → buildDetail → renderFast all run synchronously inside the click, so the
			// shell is capturable at once, and closing the dossier in the same task leaves the GL
			// paints queued behind it nothing to draw (software GL spent ~4 s a dossier on them).
			// A click on a row not yet wired is a no-op – with the last dossier closed it captures
			// nothing (left open, it once baked another space's dossier into 132 of 168 name views):
			// the click repeats until the router names THIS space (openModal's replaceState runs in
			// the same click as buildDetail), or the build fails
			const shell = await (await page.waitForFunction((s2) => {
				document.querySelector(`.ent[data-s="${CSS.escape(s2)}"] .nm`)?.click()
				const m = document.getElementById('modal')
				if (!m || m.hidden || !location.pathname.endsWith('/' + s2) || !document.getElementById('dtitle')?.textContent.trim()) return false
				const h = document.getElementById('detail').innerHTML
				document.getElementById('mx').click()
				return h
			}, s, { timeout: 30000, polling: 50 }).catch((e) => { throw new Error(`bake-dossiers: ${pre}${s} – its dossier never opened (${String(e.message).split('\n')[0]})`) })).jsonValue()
			const file = join(site, pre + s + '.html')
			let h = readFileSync(file, 'utf8')
			const anchor = '<div class="detail" id="detail" tabindex="-1"></div>'
			if (!h.includes(anchor)) throw new Error(`bake-dossiers: detail anchor missing in ${pre}${s}.html`)
			h = h.replace(anchor, () => `<div class="detail" id="detail" tabindex="-1">${shell}</div>`)   // a function: translated text may carry $
			const modal = /<div class="modal" id="modal"([^>]*?) hidden>/
			if (!modal.test(h)) throw new Error(`bake-dossiers: modal anchor missing in ${pre}${s}.html`)
			h = h.replace(modal, '<div class="modal" id="modal"$1>')
			if (!h.includes('<body>')) throw new Error(`bake-dossiers: body anchor missing in ${pre}${s}.html`)
			h = h.replace('<body>', '<body class="mopen" style="overflow:hidden">')
			writeFileSync(file, h)
		}
		await page.close()
		console.log(`baked ${spaces.length} dossier shells into the ${L.code === 'en' ? '' : `/${L.code}/ `}name views`)
	} } finally {
		await browser.close()
		srv.close()
	}
}
