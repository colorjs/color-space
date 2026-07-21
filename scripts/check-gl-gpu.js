import { existsSync } from 'node:fs'
import { chromium } from 'playwright'
import { serve } from './test-server.js'

const systemChrome = process.platform === 'darwin'
	? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
	: process.platform === 'win32'
		? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
		: '/usr/bin/google-chrome'
const bundled = chromium.executablePath()
const executablePath = [process.env.CHROME_PATH, bundled, systemChrome].find(p => p && existsSync(p))
if (!executablePath) throw new Error('Chromium is not installed; run `npx playwright install chromium` or set CHROME_PATH')

const server = await serve()
const browser = await chromium.launch({
	headless: true,
	executablePath,
	args: ['--enable-unsafe-webgpu', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
})
try {
	const page = await browser.newPage()
	const pageErrors = []
	page.on('pageerror', error => pageErrors.push(error.message))
	await page.goto(`${server.origin}/test/gl-gpu.html?cb=${Date.now()}`, { waitUntil: 'domcontentloaded' })
	await page.waitForFunction(() => window.__results?.webgpu !== 'pending', null, { timeout: 240_000 })
	const result = await page.evaluate(() => window.__results)
	const failures = [
		...pageErrors.map(message => `page: ${message}`),
		...result.glsl.map(f => `GLSL ${f.pair}: ${f.info}`),
		...result.wgsl.map(f => `WGSL ${f.pair}: ${f.info}`),
	]
	if (result.total !== 590) failures.push(`expected 590 generated sources, got ${result.total}`)
	if (failures.length) throw new Error(failures.slice(0, 12).join('\n'))
	console.log(`gpu: ${result.total} GLSL sources compiled on WebGL2; WGSL ${result.webgpu === 'ok' ? `${result.wgslTotal} modules validated on WebGPU` : result.webgpu}`)
} finally {
	await browser.close()
	await server.close()
}
