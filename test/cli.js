// Drive the CLI as a shell user would: spawn `node cli.js …`, assert stdout
// against the scalar library. Pins the default-command form (`color-space
// <from> <to> <values…>`), the subcommands, and the failure exit code.
import { execFileSync } from 'node:child_process'
import test, { is, ok } from 'tst'
import space from '../index.js'
import { colorspace, config } from '../ocio.js'

const CLI = new URL('../cli.js', import.meta.url).pathname
const run = (...args) => execFileSync('node', [CLI, ...args], { encoding: 'utf8' })

test('cli: convert is the default command', () => {
	const out = run('rgb', 'oklch', '255', '128', '0').trim().split(' ').map(Number)
	const ref = space.rgb.oklch(255, 128, 0)
	out.forEach((v, i) => ok(Math.abs(v - ref[i]) < 1e-9, `channel ${i}`))
})

test('cli: explicit convert matches', () => {
	is(run('convert', 'rgb', 'oklch', '255', '128', '0'), run('rgb', 'oklch', '255', '128', '0'))
})

test('cli: spaces lists the registry', () => {
	const list = run('spaces').trim().split('\n')
	is(list.length, Object.keys(space).length)
	ok(list.includes('oklch'))
})

test('cli: space prints the dossier', () => {
	const d = JSON.parse(run('space', 'oklch'))
	is(d.name, 'oklch')
	ok(Array.isArray(d.neighbors) && d.neighbors.length > 0)
})

test('cli: cube emits a LUT', () => {
	ok(run('cube', 'slog3', 'rec709', '5').includes('LUT_3D_SIZE 5'))
})

test('cli: icc emits a profile', () => {
	const bytes = execFileSync('node', [CLI, 'icc', 'p3'])
	is(bytes.slice(36, 40).toString('latin1'), 'acsp')   // ICC signature at offset 36
})

test('cli: ocio prints the OpenColorIO config, or one colorspace', () => {
	is(run('ocio'), config(), 'ocio: the whole config')
	is(run('ocio', 'slog3'), colorspace('slog3'), 'ocio slog3: its colorspace entry')
	let code = 0
	try { execFileSync('node', [CLI, 'ocio', 'applelog'], { stdio: 'ignore' }) } catch (e) { code = e.status }
	is(code, 1, 'a space with no exact colorspace fails')
})

test('cli: unknown space fails with exit 1', () => {
	let code = 0
	try { run('nope', 'rgb', '1', '2', '3') } catch (e) { code = e.status }
	is(code, 1)
})
