// Translations: extraction, the status rules, the build's stamping and the runtime fallback.
// The languages here are FIXTURES – a pseudo-locale generated from the current en.json and
// built into a temp dir – never shipped, never written to web/i18n.
import test, { is, ok } from 'tst'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hash, valid, apply, units, status, plan } from '../scripts/i18n.js'
import { catalog, DIR } from '../scripts/i18n-extract.js'
import { SPACES } from '../web/js/render.js'

const en = JSON.parse(readFileSync(join(DIR, 'en.json'), 'utf8'))
// pseudo-locale: vowels accented inside ⟦ ⟧ – tags, {placeholders} and entities kept, so every
// translation is valid, and any English left on a rendered page stands out
const A = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' }
const pseudo = (s) => '⟦' + s.split(/(<[^>]*>|\{\w+\}|&\w+;)/).map((p, i) => i % 2 ? p : p.replace(/[aeiouAEIOU]/g, (c) => A[c])).join('') + '⟧'
const fixture = (meta, edit = (f) => f) => edit({ '@meta': { name: 'Pseudo', reviewed: null, ...meta },
	...Object.fromEntries(Object.entries(en).filter(([k]) => k !== '@meta').map(([k, v]) => [k, { t: pseudo(v.t), h: v.h }])) })

test('i18n — extraction is deterministic and the committed en.json is current', async () => {
	const a = await catalog(), b = await catalog()
	is(a, b, 'two runs, one byte stream')
	is(readFileSync(join(DIR, 'en.json'), 'utf8') === a, true, 'web/i18n/en.json is current (npm run i18n)')
	is(Object.entries(en).filter(([k, v]) => k !== '@meta' && v.h !== hash(v.t)).map(([k]) => k), [], 'every h fingerprints its English')
	ok(['page.title', 'ui.hero.field', 'cat.display.name', 'space.oklch.desc', 'lore.rgb.sin', 'tour.rgb.body', 'purpose.palettes.tip', 'channel.lightness', 'tag.perceptual'].every((k) => en[k]), 'every source contributes: markup, code, data.json, lore, tour, categories, purpose, channels, tags')
	is(Object.keys(en).filter((k) => k !== '@meta' && !/^[a-z]+(\.[\w-]+)+$/.test(k)), [], 'keys are namespaced, readable, never hashes')
})

test('i18n — validity, staleness, fallback per key', () => {
	is(valid('see <a href="#oklch">OKLCH</a>', 'veja <a href="#oklch">OKLCH</a>'), true, 'tags kept')
	is(valid('see <a href="#oklch">OKLCH</a>', 'veja OKLCH'), false, 'a dropped tag is invalid')
	is(valid('<a href="#x" title="pick it">x</a>', '<a href="#x" title="escolha">x</a>'), true, 'an explanatory attribute inside a tag may translate')
	is(valid('{n} slider', 'controle {n}'), true, 'placeholders may move')
	is(valid('{n} slider', 'controle {m}'), false, 'a renamed placeholder is invalid')
	is(valid('plain', 'com "aspas"'), false, 'a straight double quote would end an attribute')
	const st = status({ a: { t: 'one', h: hash('one') }, b: { t: 'two', h: hash('two') }, c: { t: 'three', h: hash('three') } },
		{ a: { t: 'um', h: hash('one') }, b: { t: 'dois', h: hash('TWO, before an edit') } }, [])
	is([st.ok, st.stale, st.missing], [['a'], ['b'], ['c']], 'ok · stale (h no longer matches) · missing')
	is(st.table, { a: 'um' }, 'the runtime table carries fresh, valid translations only – the rest read English')
})

test('i18n — markup units: the English document is the source minus its markers', () => {
	const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8')
	const out = apply(html)
	is(out.includes('data-i18n='), false, 'every marker stripped')
	is(out.length, html.length - [...html.matchAll(/ data-i18n="[^"]*"/g)].reduce((n, m) => n + m[0].length, 0), 'nothing else changed')
	const u = units(html).find((x) => x.key === 'ui.hero.field')
	is([u.attr, u.en], ['placeholder', 'A color or a space – tomato, #ff8000, OKLCH'], 'an attribute unit reads its own value')
	ok(apply(html, { 'ui.hero.field': 'Un color o un espacio' }).includes('placeholder="Un color o un espacio"'), 'a translation lands in place')
})

test('i18n — the gate: a translated language ships and survives English drift; review only adds search', () => {
	const drop = (k) => (f) => { delete f[k]; return f }, stale = (k) => (f) => { f[k].h = '00000000'; return f }
	const pages = (f) => status(en, f, SPACES).pages
	is(pages(fixture()).size, SPACES.length + 1, 'complete + current: index and every space page')
	is(pages(fixture({}, drop('ui.hero.field'))).size, SPACES.length + 1, 'a new shared string reads English: every page still stamps')
	const few = (f) => { for (const k of Object.keys(f).filter((k) => k !== '@meta' && !/^(space|lore)\./.test(k)).slice(0, 200)) delete f[k]; return f }
	is(pages(fixture({}, few)).size, 0, 'a language far from done: nothing stamps')
	const p = pages(fixture({}, stale('space.oklch.desc')))
	is([p.has(''), p.has('oklch'), p.has('lab')], [true, true, true], 'one space reworded: its page stays, the sentence reads English')
	is(pages(fixture({}, drop('space.oklch.desc'))).has('oklch'), false, 'a space never translated stays English-only')
	const r = pages(fixture({ reviewed: 'fixture' }, (f) => stale('space.oklch.desc')(drop('ui.hero.field')(f))))
	is([r.has(''), r.has('oklch')], [true, true], 'reviewed: English drift falls back per key, no page drops')
	is(pages(fixture({ reviewed: 'fixture' }, drop('space.oklch.desc'))).has('oklch'), false, 'reviewed: a space never translated stays English-only')
})

// build a fixture site once per state; the dossier bake (a headless pass over every page) is skipped
const tmp = mkdtempSync(join(tmpdir(), 'cs-i18n-'))
const site = async (name, file) => {
	const dir = join(tmp, name), src = join(dir, 'i18n'), out = join(dir, 'site')
	const { mkdirSync } = await import('node:fs'); mkdirSync(src, { recursive: true })
	copyFileSync(join(DIR, 'en.json'), join(src, 'en.json'))
	if (file) writeFileSync(join(src, 'en-XA.json'), JSON.stringify(file))
	const { buildSite } = await import('../scripts/build-site.js')
	process.env.CS_NO_DOSSIERS = '1'
	try { await buildSite({ out, i18n: src }) } finally { delete process.env.CS_NO_DOSSIERS }
	return (f) => readFileSync(join(out, f), 'utf8')
}

test('i18n — build: no language, no trace', { timeout: 60000 }, async () => {
	const r = await site('none')
	is(existsSync(join(tmp, 'none/site/i18n')), false, 'no runtime tables')
	is(/hreflang|id="lang"|data-i18n/.test(r('index.html') + r('oklch.html')), false, 'no alternates, no select, no markers')
	is(r('sitemap.xml').includes('xhtml'), false, 'sitemap stays monolingual')
})

test('i18n — build: a published language is readable, offered and in search, reviewed or not', { timeout: 60000 }, async () => {
	const r = await site('draft', fixture())
	const page = r('en-XA/oklch.html')
	ok(page.startsWith('<!doctype html>\n<html lang="en-XA">'), '<html lang> from the path')
	ok(page.includes('<link rel="canonical" href="https://color-space.io/en-XA/oklch">') && !page.includes('noindex'), 'self canonical, indexable')
	ok(page.includes('<title>⟦OKLCH'), 'translated title')
	ok(page.includes('src="../js/app.js"') && page.includes('href="../tokens.css"') && !/(href|src)="\.\/(js|fonts|dist)\//.test(page), 'assets resolve from the root')
	ok(page.includes('<link rel="preload" href="../i18n/en-XA.json" as="fetch" crossorigin>'), 'the runtime table preloads')
	ok(page.includes('hreflang="en-XA"') && r('oklch.html').includes('hreflang="en-XA"') && r('sitemap.xml').includes('<loc>https://color-space.io/en-XA/oklch</loc>'), 'in the hreflang group and the sitemap')
	ok(r('oklch.html').includes('<option value="en-XA" lang="en-XA">Pseudo</option>'), 'English offers it')
	ok(page.includes('<option value="en" lang="en">English</option><option value="en-XA" lang="en-XA" selected>EN</option>'), 'it lists itself beside English')
	ok(r('en-XA/index.html').includes('⟦Díspláy &amp; wéb⟧') || r('en-XA/index.html').includes('⟦Díspláy & wéb⟧'), 'the catalog bakes in the language')
	is(JSON.parse(r('i18n/en-XA.json'))['cat.display.name'], '⟦Díspláy & wéb⟧', 'the compiled table ships')
	ok(r('sw.js').includes('"./en-XA/"') && r('sw.js').includes('const LANGS = ["en-XA"]'), 'its shell is precached for offline')
})

test('i18n — build: reviewed survives drift, reciprocal and in the sitemap', { timeout: 60000 }, async () => {
	const r = await site('live', fixture({ reviewed: 'fixture 2026-10-03' }, (f) => { f['cat.display.name'].h = '00000000'; delete f['ui.group.era']; return f }))
	const alt = '<link rel="alternate" hreflang="en" href="https://color-space.io/oklch"><link rel="alternate" hreflang="en-XA" href="https://color-space.io/en-XA/oklch"><link rel="alternate" hreflang="x-default" href="https://color-space.io/oklch">'
	ok(r('oklch.html').includes(alt) && r('en-XA/oklch.html').includes(alt), 'one hreflang group, on both members')
	is(r('en-XA/oklch.html').includes('noindex'), false, 'indexable')
	ok(r('sitemap.xml').includes('<loc>https://color-space.io/en-XA/oklch</loc>') && r('sitemap.xml').includes('xmlns:xhtml'), 'listed with alternates')
	ok(r('index.html').includes('<option value="en-XA" lang="en-XA">Pseudo</option>'), 'English offers it')
	const table = JSON.parse(r('i18n/en-XA.json'))
	is(['cat.display.name' in table, 'ui.group.era' in table, 'cat.video.name' in table], [false, false, true], 'stale and missing keys stay out of the table')
	ok(r('en-XA/index.html').includes('>Display &amp; web<') || r('en-XA/index.html').includes('>Display & web<'), 'a stale key reads English in the baked catalog')
})

// the runtime: the same fixture served, the page read in a browser
test('i18n — runtime: per-key fallback, root-relative loads, the select keeps space and color', { timeout: 90000 }, async () => {
	const { chromium } = await import('playwright'), { serve } = await import('../scripts/test-server.js')
	const server = await serve(join(tmp, 'live/site')), browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
	try {
		const page = await browser.newPage(), errors = [], missing = []
		page.on('pageerror', (e) => errors.push(e.message))
		page.on('response', (r) => { if (r.status() >= 400) missing.push(r.url()) })
		await page.goto(`${server.origin}/en-XA/?cb=${Date.now()}#ff8000`, { waitUntil: 'networkidle' })
		await page.waitForSelector('.ent[data-s="oklch"] .nm')
		is(await page.evaluate(() => document.documentElement.lang), 'en-XA', 'the document speaks its language')
		const names = await page.locator('.ti .tt').evaluateAll((b) => b.map((x) => x.textContent))
		is([names[0], names[1]], ['Display & web', pseudo('RGB remixes')], 'stale key → English, fresh key → translation, side by side')
		is(await page.locator('.gtag[data-g="era"]').textContent(), 'Era', 'a missing key reads English')
		await page.locator('.ent[data-s="oklch"] .nm').click()
		await page.waitForFunction(() => location.pathname.endsWith('/en-XA/oklch'))
		is(missing, [], 'every asset, module, font and table resolves under /en-XA/')
		is(errors, [], 'no page errors')
		await page.locator('#lang').selectOption('en')
		await page.waitForURL((u) => u.pathname === '/oklch')
		ok(/^#/.test(new URL(page.url()).hash), 'the color rides along')
		is(await page.evaluate(() => document.documentElement.lang), 'en', 'English, same space')
	} finally { await browser.close(); await server.close(); rmSync(tmp, { recursive: true, force: true }) }
})
