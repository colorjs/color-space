import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
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
try {
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' })
	const page = await context.newPage()
	await page.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await page.waitForSelector('.ent[data-s="oklch"] .nm')

	const scans = []
	const scan = async name => {
		const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
		for (const violation of result.violations) scans.push({ name, violation })
	}
	await scan('catalog')
	await page.locator('.ent[data-s="oklch"] .nm').click()
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	await scan('dossier')

	if (scans.length) {
		const report = scans.map(({ name, violation: v }) =>
			`${name}: ${v.id} (${v.impact || 'unknown'}) — ${v.help}\n` +
			v.nodes.slice(0, 4).map(n => `  ${n.target.join(' ')}: ${n.failureSummary}`).join('\n')
		).join('\n\n')
		throw new Error(`axe found ${scans.length} WCAG A/AA violation groups\n${report}`)
	}
	console.log('a11y: catalog and open dossier pass axe WCAG 2.0/2.1 A/AA')
} finally {
	await browser.close()
	await server.close()
}
