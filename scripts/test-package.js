import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options })
const packOutput = run('npm', ['pack', '--json', '--ignore-scripts'])
// npm 10 may print lifecycle/prepare output before the final JSON even with
// --ignore-scripts; newer npm versions return JSON alone. Parse the terminal array.
const json = packOutput.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/)?.[0]
if (!json) throw new Error(`npm pack did not emit a terminal JSON result:\n${packOutput.slice(-1000)}`)
const packed = JSON.parse(json)[0]
const tarball = resolve(root, packed.filename)
const temp = mkdtempSync(join(tmpdir(), 'color-space-package-'))
const fail = message => { throw new Error(`packed consumer: ${message}`) }

try {
	const files = new Set(packed.files.map(f => f.path))
	for (const required of ['README.md', 'CHANGELOG.md', 'license.md', 'docs/migration.md', 'docs/formula-verification.md', 'types/index.d.ts', 'types/gl-wgsl.d.ts', 'wasm/spaces.js', 'dist/color-space.wasm'])
		if (!files.has(required)) fail(`tarball is missing ${required}`)
	if (files.has('types/package.json')) fail('stale nested types/package.json is still packed')

	writeFileSync(join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { 'color-space': `file:${tarball}` } }, null, 2))
	execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: temp, stdio: 'pipe' })
	const installed = JSON.parse(readFileSync(join(temp, 'node_modules/color-space/package.json')))
	if (Object.keys(installed.dependencies || {}).length || Object.keys(installed.optionalDependencies || {}).length)
		fail('normal install contains runtime or optional dependencies')
	const modules = readdirSync(join(temp, 'node_modules')).filter(name => !name.startsWith('.'))
	if (modules.join() !== 'color-space') fail(`normal install added packages: ${modules.join(', ')}`)
	if (!existsSync(join(temp, 'node_modules/.bin/color-space-mcp'))) fail('color-space-mcp bin link is missing')

	writeFileSync(join(temp, 'consumer.mjs'), `
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import space from 'color-space'
import lite from 'color-space/lite'
import wasm, { convertBatch } from 'color-space/wasm'
import wasmSpaces from 'color-space/wasm/spaces'
import data from 'color-space/data.json' with { type: 'json' }
import chunk from 'color-space/gl/oklch'
import { glsl } from 'color-space/gl'
import allGlsl from 'color-space/gl/all'
import wgsl from 'color-space/gl/wgsl'
import { cube } from 'color-space/lut'
import { profile } from 'color-space/icc'

assert.equal(Object.keys(space).length, 161)
assert.equal(Object.keys(data.spaces).length, 161)
assert.equal(lite.rgb.oklch(255, 0, 0).length, 3)
assert.equal(wasm.rgb.oklch(255, 0, 0).length, 3)
assert.equal(convertBatch('rgb', 'oklch', [255, 0, 0]).length, 3)
assert.equal(wasmSpaces.length, 27)
assert.match(glsl(chunk, 'rgb'), /oklch_rgb/)
assert.match(allGlsl('rgb', 'oklch'), /rgb_oklch/)
assert.match(wgsl('rgb', 'oklch'), /fn rgb_oklch/)
assert.match(cube(space.rgb, space.p3, { size: 2, verify: false }), /LUT_3D_SIZE 2/)
assert.equal(profile(space.p3).slice(36, 40).toString(), '97,99,115,112')
assert.ok(readFileSync(new URL('./node_modules/color-space/dist/color-space.wasm', import.meta.url)).length > 1000)

const pkg = JSON.parse(readFileSync(new URL('./node_modules/color-space/package.json', import.meta.url)))
const failures = []
for (const [key, target] of Object.entries(pkg.exports)) {
  if (target === null || key.includes('*') || key === './color-space.wasm' || key === './data.json') continue
  const spec = key === '.' ? 'color-space' : 'color-space/' + key.slice(2)
  try { await import(spec) } catch (error) { failures.push(spec + ': ' + error.message) }
}
assert.deepEqual(failures, [])
console.log('packed JS exports: ok')
`)
	execFileSync(process.execPath, ['consumer.mjs'], { cwd: temp, stdio: 'inherit' })

	const smoke = readFileSync(join(root, 'test/types/smoke.ts'), 'utf8')
	writeFileSync(join(temp, 'smoke.ts'), smoke)
	const tsc = join(root, 'node_modules/typescript/bin/tsc')
	for (const [module, resolution] of [['NodeNext', 'NodeNext'], ['ESNext', 'Bundler']])
		execFileSync(process.execPath, [tsc, '--noEmit', '--strict', '--target', 'ES2022', '--module', module, '--moduleResolution', resolution, '--skipLibCheck', 'false', 'smoke.ts'], { cwd: temp, stdio: 'inherit' })

	console.log(`packed consumer: ${packed.entryCount} files, ${Math.round(packed.size / 1024)} kB tarball / ${Math.round(packed.unpackedSize / 1024)} kB unpacked; zero install dependencies; JS + NodeNext + Bundler pass`)
} finally {
	rmSync(temp, { recursive: true, force: true })
	rmSync(tarball, { force: true })
}
