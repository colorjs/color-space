// End-to-end: macOS ColorSync consumes the generated profiles.
//
// `sips --matchTo` runs a real CMM over an image through our .icc — a malformed
// header, tag table, or curve is rejected outright, and the output carries the
// profile's description. Numeric truth is pinned in test/icc.js (Lindbloom/IEC
// values); this pins host acceptance. Skips cleanly off macOS.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import space from '../index.js'
import { profile } from '../icc.js'

const probe = spawnSync('sips', ['--help'], { stdio: 'ignore' })
const img = new URL('../docs/img/wave.jpg', import.meta.url).pathname
if (probe.error || probe.status !== 0 || !existsSync(img)) {
	console.log('icc-colorsync: sips (macOS) not available — skipping the ColorSync host test')
	process.exit(0)
}

const test = (await import('tst')).default
const { is } = await import('tst')

test('icc+ColorSync: generated profiles are accepted and applied by a real CMM', () => {
	const dir = mkdtempSync(join(tmpdir(), 'color-space-icc-'))
	try {
		for (const s of ['rgb', 'p3', 'prophoto', 'dci-p3']) {
			const icc = join(dir, s + '.icc'), out = join(dir, s + '.jpg')
			writeFileSync(icc, profile(space[s]))
			const res = spawnSync('sips', ['-m', icc, img, '--out', out], { encoding: 'utf8' })
			is(res.status, 0, `${s}.icc: ColorSync matches through it (${(res.stderr || '').trim() || 'ok'})`)
			const tag = spawnSync('sips', ['-g', 'profile', out], { encoding: 'utf8' })
			is(new RegExp(`${s} \\(color-space\\)`).test(tag.stdout), true, `${s}.icc: output tagged with our profile description`)
		}
	} finally { rmSync(dir, { recursive: true, force: true }) }
})
