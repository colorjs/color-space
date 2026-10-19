// The code plates' lexer (web/js/lex.js): offsets lighthigh paints, so every token must lie inside its text, in order,
// never overlapping – lighthigh throws on any other – and each kind must start and stop where its grammar says
import test, { is } from 'tst'
import { readFileSync } from 'node:fs'
import { lex } from '../web/js/lex.js'

const read = (src, g) => lex(src, g).map(([a, b, t]) => `${t[0]}:${src.slice(a, b)}`)

test('lex: nothing to read, nothing painted', () => {
	is(lex(''), [], 'empty')
	is(lex('space.oklch.rgb(0.65, 0.1, 180)'), [], 'code without words, strings or comments')
	is(lex('#', 'py'), [[0, 1, 'comment']], 'the smallest comment')
	is(lex("''"), [[0, 2, 'string']], 'the smallest string')
})

test('lex: JS – words whole, strings with their escapes, comments to their end', () => {
	is(read("import space from 'color-space'"), ['k:import', 'k:from', "s:'color-space'"])
	is(read('imports important fromage'), [], 'a keyword inside a longer word is none')
	is(read("'it\\'s' \"a\\\"b\""), ["s:'it\\'s'", 's:"a\\"b"'], 'an escaped quote stays inside')
	is(read("'open\nnext'"), [], 'a string ends on its own line: an unclosed one is none')
	is(read('x // → [0.7]\ny'), ['c:// → [0.7]'], 'a line comment stops at the line')
	is(read('/* a\nb */ const'), ['c:/* a\nb */', 'k:const'], 'a block comment spans lines')
	is(read("'http://a' // b"), ["s:'http://a'", 'c:// b'], 'a // inside a string is the string\'s')
	is(read('git clone https://github.com/colorjs/color-space'), [], 'a URL\'s // is no comment')
	is(read("// it's"), ["c:// it's"], 'a quote inside a comment is the comment\'s')
	is(read('`const frag = ${glsl(oklch, \'rgb\')}`'), ['k:const', "s:'rgb'"], 'a template literal reads as the code it holds')
})

test('lex: Python, shaders, HTML – each its own comments and words', () => {
	is(read("cs['alloc'](store, 1.0)   # the kernel's memory", 'py'), ["s:'alloc'", "c:# the kernel's memory"])
	is(read('a // 2', 'py'), [], 'Python\'s // divides')
	is(read('import struct\nfrom wasmtime import Store', 'py'), ['k:import', 'k:from', 'k:import'])
	is(read('fn f(c: vec3f) -> vec3f { let x = 1.0; return c; } // done', 'gl'), ['k:fn', 'k:let', 'k:return', 'c:// done'])
	is(read('#version 300 es', 'gl'), [], 'a directive is no comment in a shader')
	is(read('<!-- a -->\n<iframe title="it\'s" src="https://x">', 'html'), ['c:<!-- a -->', 's:"it\'s"', 's:"https://x"'])
	is(read('import', 'html'), [], 'HTML has no keywords')
	is(read("import 'x'", 'sh'), ["s:'x'"], 'an unknown grammar: JS comments and strings, no words')
})

test('lex: the same text reads the same, whatever was read before (the cached expressions keep no state)', () => {
	const a = "import x from 'a' // c", b = '# b'
	const first = lex(a)
	lex(b, 'py'); lex(b); lex(a, 'gl')
	is(lex(a), first, 'A, then B in other grammars, then A again')
})

test('lex: every plate the page ships – tokens inside their text, in order, never overlapping', () => {
	const page = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8')
	const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
	const plates = [...page.matchAll(/<pre(?: data-lang="(\w+)")?>([\s\S]*?)<\/pre>/g)].map(([, g, h]) => [text(h), g])
	is(plates.length >= 8, true, `the Usage plates (${plates.length}) – the plugin and the extension have store buttons, no plates`)
	for (const [src, g] of plates) {
		const t = lex(src, g)
		is(t.every(([a, b], i) => a >= 0 && b > a && b <= src.length && (i === 0 || a >= t[i - 1][1])), true, `${src.slice(0, 30).replace(/\n/g, ' ')}…: ${t.length} tokens, well-formed`)
		is(t.some(([, , k]) => k === 'keyword') || !/\bimport\b/.test(src), true, '…its imports read as words')
	}
})
