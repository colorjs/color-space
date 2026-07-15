// The published dist/color-space.wasm must run in standalone runtimes (wasmtime,
// wasmer, non-JS hosts), not only Node. Two invariants make that true, and both have
// bitten us: the kernel must import NOTHING (pure math, no host services), and it must
// avoid the tail-call proposal — jz tail-calls the PQ encoder's `exp` by default, which
// wasmer 4.x rejects outright. Pinned on the SAME compile contract the build ships
// (scripts/build-wasm.js), so the two can't drift. A wasmer smoke runs the bytes
// end-to-end when the runtime is on PATH — like test/icc-colorsync.js, it skips cleanly.
import test, { is } from 'tst'
import { compile } from 'jz'
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

test('wasm: no tail-call opcodes — portable to runtimes without the proposal', () => {
	const wat = compile(wasmSource(), { ...WASM_OPTS, wat: true })
	is(/return_call/.test(wat), false, 'no return_call in the emitted module')
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
