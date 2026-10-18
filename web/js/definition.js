// A space's definition, as its page prints it and code takes it: the primaries and the white as
// the specification prints them, the linear RGB → XYZ matrix and its inverse (data.json gamuts:
// SMPTE RP 177 from those primaries, pinned in test/index.js to every gamut space's own
// conversion), and the cited rows the space is tested against (data.json conformance).
import data from './data.js'

export const definitionOf = (s) => {
	const k = data.spaces[s]?.gamut, g = k && data.gamuts[k]
	return g ? { ...g, key: k, wxy: data.whites[g.white] } : null
}
export const rowsOf = (s) => data.conformance.filter((r) => r.s === s)

// the page a pasted matrix names as its source – the canonical one, wherever it was copied from
const PAGE = 'https://color-space.io/'

// the OCIO tab's matrix pair, where a space's curve has no exact OCIO colorspace (ocio.js): row-major 4×4, both ways
const num = (v) => String(+v.toFixed(10) || 0)
const rows = (m) => [0, 3, 6].map((i) => m.slice(i, i + 3).map(num))
export const ocioMatrix = (s, g) => `# ${data.spaces[s].title}: linear RGB → CIE XYZ (${g.white} white, Y = 1) – SMPTE RP 177 from the primaries
# ${PAGE}${s}${g.white === 'D65' ? '' : `\n# XYZ under ${g.white}, no chromatic adaptation – color-space reaches its D65 hub through Bradford`}
# its curve has no exact OCIO transform: decode it first; this matrix is a row-major 4×4, direction: inverse goes back
${['', '\n  direction: inverse'].map((dir) => `- !<MatrixTransform>\n  matrix: [${[...rows(g.matrix), ['0', '0', '0']].map((r, i) => [...r, i < 3 ? 0 : 1].join(', ')).join(',\n           ')}]${dir}`).join('\n')}`

// a transfer curve as the page prints it and the suite checks it: one JS expression of the code value V
// (profile.js CURVES x), parsed once – numbers, names, + − × /, **, max(), exp(), a comparison and one ?: –
// then rendered as math or evaluated, so the formula shown is the formula tested
const TOK = /\s*(\d+\.?\d*(?:e-?\d+)?|Math\.max|Math\.exp|[A-Za-z]\w*|\*\*|<=|>=|[-+*/()<>?:,])/y
const parse = (src) => {
	const toks = []; TOK.lastIndex = 0
	while (src.slice(TOK.lastIndex).trim()) { const m = TOK.exec(src); if (!m) throw Error(`formula: can't read ${src.slice(TOK.lastIndex)}`); toks.push(m[1]) }
	let i = 0
	const peek = () => toks[i], eat = (t) => { if (t && toks[i] !== t) throw Error(`formula: ${t} expected at ${toks[i]}`); return toks[i++] }
	const cond = () => { const c = cmp(); if (peek() !== '?') return c; eat('?'); const a = cond(); eat(':'); return { t: '?', c, a, b: cond() } }
	const cmp = () => { const a = add(); return /^[<>]=?$/.test(peek()) ? { t: 'op', op: eat(), a, b: add() } : a }
	const add = () => { let a = mul(); while (peek() === '+' || peek() === '-') a = { t: 'op', op: eat(), a, b: mul() }; return a }
	const mul = () => { let a = pow(); while (peek() === '*' || peek() === '/') a = { t: 'op', op: eat(), a, b: pow() }; return a }
	const pow = () => { const a = unary(); return peek() === '**' ? (eat(), { t: 'op', op: '**', a, b: pow() }) : a }
	const unary = () => peek() === '-' ? (eat(), { t: 'neg', a: unary() }) : prim()
	const prim = () => {
		const k = eat()
		if (k === '(') { const a = cond(); eat(')'); return { t: '()', a } }
		if (k === 'Math.max') { eat('('); const a = cond(); eat(','); const b = cond(); eat(')'); return { t: 'max', a, b } }
		if (k === 'Math.exp') { eat('('); const a = cond(); eat(')'); return { t: 'exp', a } }
		return /^\d/.test(k) ? { t: 'n', v: k } : { t: 'id', v: k }
	}
	const ast = cond(); if (i < toks.length) throw Error(`formula: trailing ${toks[i]}`); return ast
}
const OPS = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b, '**': (a, b) => a ** b,
	'<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b }
const ev = (n, env) => n.t === 'n' ? +n.v : n.t === 'id' ? env[n.v] : n.t === '()' ? ev(n.a, env) : n.t === 'neg' ? -ev(n.a, env)
	: n.t === 'max' ? Math.max(ev(n.a, env), ev(n.b, env)) : n.t === 'exp' ? Math.exp(ev(n.a, env))
	: n.t === '?' ? (ev(n.c, env) ? ev(n.a, env) : ev(n.b, env)) : OPS[n.op](ev(n.a, env), ev(n.b, env))
const SYM = { '*': ' × ', '/': ' / ', '+': ' + ', '-': ' − ', '<': ' < ', '<=': ' ≤ ', '>': ' > ', '>=': ' ≥ ' }
const NOT = { '<': '>=', '<=': '>', '>': '<=', '>=': '<' }
const html = (n) => n.t === 'n' ? n.v : n.t === 'id' ? `<var>${n.v.replace(/(\d)$/, '<sub>$1</sub>')}</var>` : n.t === '()' ? `(${html(n.a)})`
	: n.t === 'neg' ? `−${html(n.a)}` : n.t === 'max' ? `max(${html(n.a)}, ${html(n.b)})` : n.t === 'exp' ? `e<sup>${html(n.a.t === '()' ? n.a.a : n.a)}</sup>`
	: n.op === '**' ? `${html(n.a)}<sup>${html(n.b.t === '()' ? n.b.a : n.b)}</sup>` : `${html(n.a)}${SYM[n.op]}${html(n.b)}`

/** the curve's formula as lines of [L = …, the condition] – the else branch under the negated comparison */
export const formula = (c) => {
	const n = parse(c.x)
	return n.t === '?' ? [[html(n.a), html(n.c)], [html(n.b), html({ ...n.c, op: NOT[n.c.op] })]] : [[html(n), '']]
}
/** the curve's formula evaluated at code value V – the test holds it to the curve itself */
export const evaluate = (c, V) => ev(parse(c.x), { ...c.k, V })
/** the curve's named constants, as the formula names them */
export const constants = (c) => Object.entries(c.k || {}).map(([k, v]) => `${html({ t: 'id', v: k })} = ${v}`).join(', ')
