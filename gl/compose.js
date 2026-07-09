/**
 * color-space/gl — compose color-space shader source from imported chunks.
 *
 * A chunk is pure data (`{ name, deps, edges, code }`, like three.js ShaderChunk).
 * This module is the engine that composes chunks into shader source — the engine
 * imports the data, never the reverse. Import the spaces you convert and name the
 * conversion; it reads like the scalar library, one level down (a source string,
 * where scalar returns a value):
 *
 *     import { glsl, wgsl } from 'color-space/gl'
 *     import oklch from 'color-space/gl/oklch'
 *     import p3    from 'color-space/gl/p3'
 *
 *     glsl(oklch, 'rgb')   // GLSL `vec3 oklch_rgb(vec3 c)` — cf. scalar oklch.rgb(l,c,h)
 *     glsl(oklch)          // the bundle: rgb ↔ oklch, both ways, ready to interpolate
 *     glsl(oklch, p3)      // a pair with neither end rgb — routed via their shared lrgb
 *     wgsl(oklch)          // the same, as WGSL
 *
 * A lone import reaches its own chain + rgb — exactly what `color-space/oklch`
 * gives you in JS. Importing the spaces you convert brings only their chains
 * (~5 kB, not the ~200 kB catalog). When the space is a runtime string,
 * `color-space/gl/all` routes any space by name. Byte-identical output.
 */
import util from './util.js'
import { translate } from './translate.js'

const san = (s) => s.replace(/-/g, '')
const TYPE = { 1: 'float', 2: 'vec2', 3: 'vec3', 4: 'vec4' }

/**
 * Build a registry from chunk objects (each pulled in with its `deps` chain):
 * returns `{ chunks, graph, glsl }` — the same shapes `color-space/gl/all` exports,
 * scoped to the given chunks.
 * @param {Array<object>} [list] chunk objects to register
 */
export function compose(list = []) {
	const chunks = {}, graph = {}
	const wire = (c) => {
		for (const nbr in (c.edges || {})) {
			const [into, outof] = c.edges[nbr]
			if (into) (graph[nbr] ??= {})[c.name] = { fn: into, chunk: c }
			if (outof) (graph[c.name] ??= {})[nbr] = { fn: outof, chunk: c }
		}
	}
	const add = (c) => {
		if (!c || chunks[c.name]) return
		for (const d of c.deps || []) add(d)
		chunks[c.name] = c
		wire(c)
	}
	for (const c of list) add(c)

	const dim = (name) => chunks[name]?.dim || 3

	// BFS shortest primitive-edge path from → to (sequence of edge steps, or null)
	const route = (from, to) => {
		const queue = [[from, []]], seen = new Set([from])
		while (queue.length) {
			const [node, seq] = queue.shift()
			for (const next in graph[node] || {}) {
				if (seen.has(next)) continue
				const step = [...seq, graph[node][next]]
				if (next === to) return step
				seen.add(next)
				queue.push([next, step])
			}
		}
		return null
	}

	// prepend the util helpers the code references (transitively, in util order)
	const prelude = (code) => {
		const need = new Set()
		let scan = code
		for (let pass = 0; pass < util.length; pass++) {
			let grew = false
			for (const u of util) {
				if (!need.has(u) && new RegExp(`\\b${u.name}\\s*\\(`).test(scan)) {
					need.add(u); scan += u.code; grew = true
				}
			}
			if (!grew) break
		}
		return need.size ? util.filter(u => need.has(u)).map(u => u.code.trim()).join('\n') + '\n\n' : ''
	}

	/**
	 * Compose the GLSL source converting `from` → `to`: every chunk the shortest
	 * path needs plus an entry function `${from}_${to}` (hyphens stripped).
	 * Each end is a space name or a chunk object (registered on the fly).
	 * A single chunk object → the both-ways bundle (`glsl(oklch)`).
	 * Multi-pair: `glsl([[a, b], [c, d]])` — one source, chunks deduped.
	 * @param {string|object|Array} from source space (chunk, name, or pair list)
	 * @param {string|object} [to] target space
	 * @returns {string} self-contained GLSL source
	 */
	function glsl(from, to) {
		// single chunk object → the bundle: both directions that reach rgb
		if (to === undefined && !Array.isArray(from)) {
			if (typeof from !== 'object')
				throw new Error(`color-space/gl: glsl('${from}') needs a target — glsl(from, to). Import the chunk (color-space/gl/${from}) to bundle it, or route by name via color-space/gl/all`)
			add(from)
			if (from.excluded) throw new Error(`color-space/gl: ${from.name} — ${from.excluded}`)
			const n = from.name, both = []
			if (route(n, 'rgb')) both.push([n, 'rgb'])
			if (route('rgb', n)) both.push(['rgb', n])
			return glsl(both.length ? both : [[n, n]])
		}
		const pairs = (Array.isArray(from) ? from : [[from, to]]).map((p) => p.map((x) => {
			if (typeof x === 'string') return x
			add(x); return x.name
		}))
		// chunk code, dependency-first, deduped across all pairs
		const used = [], wrappers = [], seen = new Set()
		const use = (c) => {
			if (!c || used.includes(c)) return
			for (const r of c.requires || []) use(chunks[r])
			used.push(c)
		}
		for (const [a, b] of pairs) {
			const entry = `${san(a)}_${san(b)}`
			if (seen.has(entry)) continue
			seen.add(entry)
			if (a === b) { wrappers.push({ entry, code: `${TYPE[dim(a)]} ${entry}(${TYPE[dim(a)]} c) { return c; }` }); continue }
			const seq = route(a, b)
			if (!seq) {
				const why = [a, b].map(n => chunks[n]?.excluded && `${n}: ${chunks[n].excluded}`).filter(Boolean).join('; ')
				const hint = [a, b].some(n => !chunks[n] && n !== 'rgb') ? ` — pass the chunk object (import it from color-space/gl/<space>) or route by name via color-space/gl/all` : ''
				throw new Error(`color-space/gl: no path '${a}'→'${b}'${why ? ` (${why})` : ''}${hint}`)
			}
			for (const s of seq) use(s.chunk)
			wrappers.push({ entry, to: b, from: a, call: seq.reduce((acc, s) => `${s.fn}(${acc})`, 'c') })
		}
		let code = used.map(c => c.code.trim()).filter(Boolean).join('\n\n')
		for (const w of wrappers) {
			if (w.code) { code += `${code ? '\n\n' : ''}${w.code}`; continue }
			if (!new RegExp(`\\b${TYPE[dim(w.to)]}\\s+${w.entry}\\s*\\(`).test(code))
				code += `${code ? '\n\n' : ''}${TYPE[dim(w.to)]} ${w.entry}(${TYPE[dim(w.from)]} c) { return ${w.call}; }`
		}
		return prelude(code) + code
	}

	return { chunks, graph, glsl }
}

/** One-shot lean form: `glsl(oklch)` (bundle) / `glsl(a, b)` — registry from the args. */
export const glsl = (from, to) => compose().glsl(from, to)

/** The same, as WGSL: `wgsl(oklch)` / `wgsl(a, b)`. */
export const wgsl = (from, to) => translate(glsl(from, to))

export default glsl
