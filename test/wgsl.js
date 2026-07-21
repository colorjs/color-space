// Parse every generated WGSL source with a full grammar, independently of GPU
// availability. The browser smoke page still validates modules on a live WebGPU
// device when one exists; this test makes grammar coverage part of CI everywhere.
import test, { is } from 'tst'
import { WgslReflect } from 'wgsl_reflect/wgsl_reflect.module.js'
import { glsl, graph } from '../gl/index.js'
import { translate } from '../gl/translate.js'

const pairs = [], seen = new Set()
const add = (a, b) => {
	const key = `${a} ${b}`
	if (seen.has(key)) return
	seen.add(key)
	try { pairs.push([a, b, glsl(a, b)]) } catch {}
}
for (const a in graph) for (const b in graph[a]) add(a, b)
for (const name in graph) if (name !== 'rgb') { add('rgb', name); add(name, 'rgb') }

test('wgsl: every edge and rgb↔space source parses with wgsl_reflect', () => {
	const failures = []
	for (const [from, to, src] of pairs) {
		try {
			const parsed = new WgslReflect(translate(src))
			if (!parsed.getFunctionInfo(`${from.replace(/-/g, '')}_${to.replace(/-/g, '')}`))
				failures.push(`${from}→${to}: entry function missing after parse`)
		} catch (error) { failures.push(`${from}→${to}: ${error.message}`) }
	}
	is(failures, [], failures.slice(0, 8).join('\n'))
	is(pairs.length, 590, `all ${pairs.length} current sources parsed`)
})
