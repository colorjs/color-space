// The published dist/color-space.wasm must run in standalone runtimes (wasmtime,
// wasmer, non-JS hosts), not only Node. The kernel must import nothing (pure math,
// no host services), and must avoid tail calls and exception handling, which
// Wasmer 4.x does not enable. Pinned on the SAME compile contract the build ships
// (scripts/build-wasm.js), so the two can't drift. A wasmer smoke runs the bytes
// end-to-end when the runtime is on PATH — like test/icc-colorsync.js, it skips cleanly.
import test, { is } from 'tst'
import { compile } from 'jz'
import space from '../index.js'
import { WASM_OPTS, wasmSource } from '../scripts/build-wasm.js'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const bin = compile(wasmSource(), WASM_OPTS)

test('wasm: the standalone kernel imports nothing', async () => {
	const m = await WebAssembly.compile(bin)
	is(WebAssembly.Module.imports(m).length, 0, 'zero imports — the module needs no host, it runs unhosted')
})

test('wasm: no tail calls or exception handling — portable standalone bytes', () => {
	const wat = compile(wasmSource(), { ...WASM_OPTS, wat: true })
	is(/return_call/.test(wat), false, 'no return_call in the emitted module')
	is(/\((?:tag|throw|throw_ref|try|try_table|catch|catch_all|rethrow|delegate)(?:\s|\))/.test(wat), false, 'no exception-handling declarations or instructions')
})

// the host ABI the site's Python example (Usage › WASM) drives, as any non-JS host does: alloc(n) – its count an f64 –
// hands back the buffer's byte offset in its low 32 bits, the batch edges convert n triplets there in place
test('wasm: a host drives the buffer by hand – the Usage tab\'s Python, step for step', async () => {
	const { exports: cs } = await WebAssembly.instantiate(await WebAssembly.compile(bin), {})
	const at = Number(BigInt.asUintN(32, BigInt(cs.alloc(1))))
	new Float64Array(cs.memory.buffer, at, 3).set([255, 128, 0])
	cs.rgb_lrgb_n(1); cs.lrgb_oklab_n(1)
	const got = [...new Float64Array(cs.memory.buffer, at, 3)], want = space.rgb.oklab(255, 128, 0)
	is(got.every((v, i) => Math.abs(v - want[i]) < 1e-9), true, `rgb → lrgb → oklab in place = the JS API (got ${got.map((v) => v.toFixed(4))})`)
})

// end-to-end through a strict standalone runtime, when present
const probe = spawnSync('wasmer', ['--version'], { stdio: 'ignore' })
if (probe.error || probe.status !== 0) {
	console.log('wasm-standalone: wasmer not on PATH — skipping the runtime smoke test')
	process.exit(0)
}

test('wasm+wasmer: a conversion runs in the standalone runtime', () => {
	const dir = mkdtempSync(join(tmpdir(), 'color-space-wasm-'))
	try {
		const f = join(dir, 'kernel.wasm'); writeFileSync(f, bin)
		// rgb_lrgb(255,128,0) — a scalar conversion; wasmer prints its 3 f64 results as i64 bit patterns
		const res = spawnSync('wasmer', ['run', f, '--invoke', 'rgb_lrgb', '255', '128', '0'], { encoding: 'utf8' })
		is(res.status, 0, `wasmer accepts and runs it (${(res.stderr || '').trim() || 'ok'})`)
		const bits = (res.stdout || '').trim().split(/\s+/)[0]
		const dv = new DataView(new ArrayBuffer(8)); dv.setBigInt64(0, BigInt(bits || '0'))
		is(Math.abs(dv.getFloat64(0) - 1) < 1e-6, true, `rgb_lrgb(255,128,0)[0] ≈ 1 (got ${dv.getFloat64(0)})`)
	} finally { rmSync(dir, { recursive: true, force: true }) }
})
