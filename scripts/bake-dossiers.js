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
// Skips (with a warning) when playwright or its browser is unavailable — the site
// still works, the name view just boots the old way. CS_NO_DOSSIERS=1 skips for
// quick dev builds.
import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { SPACES } from '../web/js/render.js'

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.wasm': 'application/wasm', '.txt': 'text/plain', '.xml': 'application/xml', '.woff2': 'font/woff2' }

export async function bakeDossiers(site) {
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
	try { browser = await chromium.launch() }
	catch (e) { srv.close(); console.warn(`bake-dossiers: browser launch failed (${String(e.message).split('\n')[0]}) — name views ship without prerendered dossiers`); return }
	try {
		const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
		await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { waitUntil: 'load' })
		// module readiness has no global signal — the first modal that opens IS the signal
		await page.waitForFunction(() => {
			document.querySelector('.ent[data-s="rgb"] .nm')?.click()
			return !document.getElementById('modal').hidden
		}, { timeout: 30000, polling: 250 })
		await page.evaluate(() => document.getElementById('mx').click())
		for (const s of SPACES) {
			const shell = await page.evaluate(async (s2) => {
				const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
				document.querySelector(`.ent[data-s="${CSS.escape(s2)}"] .nm`).click()
				await settle()
				if (document.getElementById('modal').hidden) throw new Error('modal did not open: ' + s2)
				if (!document.getElementById('dtitle')?.textContent.trim()) throw new Error('empty dossier: ' + s2)
				const out = document.getElementById('detail').innerHTML
				document.getElementById('mx').click()
				await settle()
				return out
			}, s)
			const file = join(site, s + '.html')
			let h = readFileSync(file, 'utf8')
			const anchor = '<div class="detail" id="detail" tabindex="-1"></div>'
			if (!h.includes(anchor)) throw new Error('bake-dossiers: detail anchor missing in ' + s + '.html')
			h = h.replace(anchor, `<div class="detail" id="detail" tabindex="-1">${shell}</div>`)
			const modal = /<div class="modal" id="modal"([^>]*?) hidden>/
			if (!modal.test(h)) throw new Error('bake-dossiers: modal anchor missing in ' + s + '.html')
			h = h.replace(modal, '<div class="modal" id="modal"$1>')
			if (!h.includes('<body>')) throw new Error('bake-dossiers: body anchor missing in ' + s + '.html')
			h = h.replace('<body>', '<body class="mopen" style="overflow:hidden">')
			writeFileSync(file, h)
		}
		console.log(`baked ${SPACES.length} dossier shells into the name views`)
	} finally {
		await browser.close()
		srv.close()
	}
}
