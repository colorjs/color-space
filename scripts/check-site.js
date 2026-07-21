import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { serve } from './test-server.js'

const systemChrome = process.platform === 'darwin'
	? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
	: process.platform === 'win32'
		? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
		: '/usr/bin/google-chrome'
const executablePath = [process.env.CHROME_PATH, chromium.executablePath(), systemChrome].find(p => p && existsSync(p))
if (!executablePath) throw new Error('Chromium is not installed; run `npx playwright install chromium` or set CHROME_PATH')
if (!existsSync(resolve('_site/index.html'))) throw new Error('_site is missing; run `npm run landing` first')

const server = await serve(resolve('_site'))
const browser = await chromium.launch({ headless: true, executablePath })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const errors = []
try {
	const page = await context.newPage()
	page.on('pageerror', error => errors.push(error.message))
	await page.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await page.waitForSelector('.ent[data-s="oklch"] .nm')
	assert.equal(await page.locator('.ent').count(), 161, 'catalog has all spaces')

	const search = page.locator('#q')
	await page.locator('.qx').click()
	await search.fill('oklch')
	assert.equal(await page.locator('.ent[data-s="oklch"]').isVisible(), true, 'search keeps OKLCH visible')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), false, 'search filters non-matches')
	await search.fill('')

	await page.locator('#cval').fill('rebeccapurple')
	await page.locator('#cval').press('Enter')
	assert.equal(await page.locator('#cval').inputValue(), '#663399', 'supported CSS color input canonicalizes')

	await page.locator('#api-tab-wasm').click()
	assert.equal(await page.locator('#api-tab-wasm').getAttribute('aria-selected'), 'true', 'API tabs activate')
	assert.equal(await page.locator('#api-panel-wasm').isVisible(), true, 'active API panel is visible')

	await page.locator('#thm').click()
	assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'theme toggles')
	await page.reload({ waitUntil: 'networkidle' })
	assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'theme persists')

	const trigger = page.locator('.ent[data-s="oklch"] .nm')
	await trigger.click()
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('#dtitle').innerText(), /OKLCH/i, 'dossier opens')
	await page.keyboard.press('Escape')
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)
	assert.equal(await trigger.evaluate(el => document.activeElement === el), true, 'dossier restores focus')

	await page.goto(`${server.origin}/oklch?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('link[rel="canonical"]').getAttribute('href'), /\/oklch$/, 'direct dossier has its canonical URL')
	await page.locator('#mx').click()
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)

	const mobile = await context.newPage()
	mobile.on('pageerror', error => errors.push(`mobile: ${error.message}`))
	await mobile.setViewportSize({ width: 390, height: 844 })
	await mobile.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	const heading = mobile.locator('.shw').first()
	await heading.waitFor()
	assert.equal(await heading.getAttribute('role'), 'button', 'mobile category heading is operable')
	const before = await heading.getAttribute('aria-expanded')
	await heading.press('Enter')
	assert.notEqual(await heading.getAttribute('aria-expanded'), before, 'mobile category toggles from the keyboard')
	await mobile.close()

	const og = await context.request.get(`${server.origin}/img/og.png?cb=${Date.now()}`)
	assert.equal(og.ok(), true, 'social image resolves')
	assert.match(og.headers()['content-type'], /^image\/png/, 'social image is PNG')
	if (errors.length) throw new Error(errors.join('\n'))
	console.log('browser: search, CSS parsing, tabs, persisted theme, modal lifecycle, direct route, mobile keyboard and social image pass')
} finally {
	await context.close()
	await browser.close()
	await server.close()
}
