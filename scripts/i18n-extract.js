#!/usr/bin/env node
/**
 * Extract every translatable English string into web/i18n/en.json – the translators' source.
 * The English stays where it lives; this file only reads it:
 *   web/index.html   markup: data-i18n="key" (the element's content), "attr:key" (an attribute)
 *   page code        t('key', 'English') – literal key, literal English – in web/index.html,
 *                    web/js/*.js and scripts/generate-landing.js (the stamped heads)
 *   data.json        space.<id>.desc · .use · .loss-note
 *   web/js/          lore.js lore.<id>.for|sin|nm · tour.js tour.<id>.title|body ·
 *                    categories.js cat.<id>.name|tip · purpose.js purpose.<tag>.name|tip|use ·
 *                    editors.js editor.* · cvd.js lens.<id> · channel names channel.<slug>
 * Output: { "@meta", key: { t, h } }, keys sorted, one per line – deterministic, so a diff
 * shows exactly which English changed; h is the English's fingerprint (scripts/i18n.js).
 *
 *   node scripts/i18n-extract.js            write en.json, report every language
 *   node scripts/i18n-extract.js --todo pt-BR   the keys pt-BR still needs, in its own format
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { hash, units, plan } from './i18n.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const DIR = join(root, 'web/i18n')

// t('key', 'English' | "English" | `English`) – the key and the English must be literals: a
// computed key is a data convention (enumerated below), never a call site's private invention
const CALL = /(?<![\w$.])t\(\s*(['"])([a-z][\w-]*(?:\.[\w-]+)+)\1\s*,\s*/g
const literal = (src, i, file) => {
	const q = src[i]
	if (!`'"\``.includes(q)) throw new Error(`i18n-extract: ${file}: t() needs literal English after its key (at ${src.slice(i - 40, i + 20).replace(/\s+/g, ' ')})`)
	let j = i + 1
	for (; src[j] !== q; j++) { if (src[j] === '\\') j++; if (j >= src.length) throw new Error(`i18n-extract: ${file}: unterminated string`) }
	const lit = src.slice(i, j + 1)
	if (q === '`' && lit.includes('${')) throw new Error(`i18n-extract: ${file}: t() English can't interpolate – use {name} placeholders (${lit.slice(0, 60)})`)
	return Function(`return ${lit}`)()
}
// comments blanked, same length (offsets hold) – an example in a comment is not a call site.
// A small lexer: strings, templates with nested ${…}, and regex literals pass through intact
const uncomment = (src) => {
	const o = [...src], blank = (a, b) => { for (let k = a; k < b; k++) if (o[k] !== '\n') o[k] = ' ' }
	const prev = (i) => { let k = i - 1; while (k >= 0 && /\s/.test(src[k])) k--; return k < 0 ? '(' : src[k] }
	const word = (i) => /\b(return|typeof|case|of|in)\s*$/.test(src.slice(Math.max(0, i - 8), i))
	const str = (i) => { const q = src[i]; for (i++; i < src.length && src[i] !== q; i++) if (src[i] === '\\') i++; return i + 1 }
	const tpl = (i) => { for (i++; i < src.length && src[i] !== '`'; i++) { if (src[i] === '\\') i++; else if (src[i] === '$' && src[i + 1] === '{') i = code(i + 2, true) - 1 } return i + 1 }
	const code = (i, inner) => { for (let depth = 0; i < src.length;) {
		const c = src[i], d = src[i + 1]
		if (c === '/' && d === '/') { const e = src.indexOf('\n', i); blank(i, e < 0 ? src.length : e); i = e < 0 ? src.length : e }
		else if (c === '/' && d === '*') { const e = src.indexOf('*/', i) + 2; blank(i, e); i = e }
		else if (c === "'" || c === '"') i = str(i)
		else if (c === '`') i = tpl(i)
		else if (c === '/' && (/[(,=:[!&|?{};+\-*%<>~^]/.test(prev(i)) || word(i))) { let cls = false; for (i++; i < src.length && (src[i] !== '/' || cls); i++) { if (src[i] === '\\') i++; else if (src[i] === '[') cls = true; else if (src[i] === ']') cls = false } i++ }
		else if (inner && c === '{') { depth++; i++ }
		else if (inner && c === '}') { if (!depth--) return i + 1; i++ }
		else i++ }
		return i }
	code(0, false)
	return o.join('') }
// in an HTML file only the <script> bodies are code
const scripts = (html) => html.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, js, b) => a + uncomment(js) + b)
const calls = (src, file) => { src = file.endsWith('.html') ? scripts(src) : uncomment(src)
	return [...src.matchAll(CALL)].map((m) => [m[2], literal(src, m.index + m[0].length, file)]) }

export async function extract() {
	const out = new Map()
	const add = (k, en, from, fold) => {
		if (en == null || en === '') return
		if (fold && out.get(k)?.en.toLowerCase() === en.toLowerCase()) return   // vocabulary: Red-Green and Red-green are one term
		if (out.has(k) && out.get(k).en !== en) throw new Error(`i18n-extract: ${k} has two Englishes – “${out.get(k).en}” (${out.get(k).from}) and “${en}” (${from})`)
		out.set(k, { en, from })
	}
	const html = readFileSync(join(root, 'web/index.html'), 'utf8')
	for (const u of units(html)) if (u.key) add(u.key, u.en, 'web/index.html markup')
	const code = [['web/index.html', html], ['scripts/generate-landing.js'],
		...readdirSync(join(root, 'web/js')).filter((f) => f.endsWith('.js')).sort().map((f) => [`web/js/${f}`])]
	for (const [f, src = readFileSync(join(root, f), 'utf8')] of code) for (const [k, en] of calls(src, f)) add(k, en, f)
	// data conventions: ns.id.field over the modules that hold the English
	const { meta } = await import('../web/js/core.js')
	const { SPACES, chEn, chKey } = await import('../web/js/render.js')
	for (const s of SPACES) {
		add(`space.${s}.desc`, meta[s].description, 'data.json')
		add(`space.${s}.use`, meta[s].use, 'data.json')
		add(`space.${s}.loss-note`, meta[s].lossNote, 'data.json')
		for (const c of meta[s].channels || []) if (chKey(c)) add(chKey(c), chEn(c), 'data.json channels', true)
	}
	const LORE = (await import('../web/js/lore.js')).default
	for (const [s, l] of Object.entries(LORE)) for (const f of ['for', 'sin', 'nm']) add(`lore.${s}.${f}`, l[f], 'web/js/lore.js')
	for (const st of (await import('../web/js/tour.js')).default) { add(`tour.${st.s}.title`, st.t, 'web/js/tour.js'); add(`tour.${st.s}.body`, st.d, 'web/js/tour.js') }
	for (const c of (await import('../web/js/categories.js')).default) { add(`cat.${c.id}.name`, c.name, 'web/js/categories.js'); add(`cat.${c.id}.tip`, c.tip, 'web/js/categories.js') }
	const P = await import('../web/js/purpose.js')
	for (const p of P.ORDER) { add(`purpose.${p}.name`, p[0].toUpperCase() + p.slice(1), 'web/js/purpose.js'); add(`purpose.${p}.tip`, P.TIPS[p], 'web/js/purpose.js'); add(`purpose.${p}.use`, P.USE[p], 'web/js/purpose.js') }
	const E = await import('../web/js/editors.js')
	add('editor.soft', E.SOFT, 'web/js/editors.js'); add('editor.shaper', E.SHAPER_LABEL, 'web/js/editors.js')
	for (const [n, l] of Object.entries(E.SIZE_LABEL)) add(`editor.size.${n}`, l, 'web/js/editors.js')
	for (const e of E.default) {
		e.steps.forEach((st, i) => { if (!E.isCommand(st)) add(`editor.${e.id}.steps.${i}`, st, 'web/js/editors.js') })
		e.notes.forEach((n, i) => { if (n !== E.SOFT) add(`editor.${e.id}.notes.${i}`, n, 'web/js/editors.js') })
	}
	for (const l of (await import('../web/js/cvd.js')).LENSES) add(`lens.${l.id}`, l.label, 'web/js/cvd.js')
	return Object.fromEntries([...out].sort(([a], [b]) => a < b ? -1 : 1).map(([k, { en }]) => [k, en]))
}

// en.json: the English with its fingerprints, one key per line
export const format = (meta, entries) => '{\n' + [`"@meta": ${JSON.stringify(meta)}`,
	...Object.entries(entries).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)].join(',\n') + '\n}\n'
export const catalog = async () => {
	const en = await extract()
	return format({ name: 'English', source: 'generated by npm run i18n – edit the English where it lives, never here' },
		Object.fromEntries(Object.entries(en).map(([k, t]) => [k, { t, h: hash(t) }])))
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const text = await catalog(), file = join(DIR, 'en.json')
	const todo = process.argv.indexOf('--todo')
	if (todo > 0) {
		const code = process.argv[todo + 1], en = JSON.parse(text), f = join(DIR, `${code}.json`)
		const { status } = await import('./i18n.js'), { SPACES } = await import('../web/js/render.js')
		const st = status(en, existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}, SPACES)
		process.stdout.write(format({ lang: code, todo: 'missing, stale or invalid – translate t, keep h' },
			Object.fromEntries([...st.missing, ...st.stale, ...st.invalid].sort().map((k) => [k, en[k]]))))
	} else {
		writeFileSync(file, text)
		const en = JSON.parse(text), keys = Object.keys(en).length - 1
		const words = Object.values(en).reduce((n, e) => n + (e.t ? e.t.replace(/<[^>]*>/g, ' ').split(/\s+/).filter((w) => /\p{L}/u.test(w)).length : 0), 0)
		console.log(`en.json: ${keys} keys, ${words} English words`)
		const { SPACES } = await import('../web/js/render.js')
		for (const l of plan(DIR, SPACES).all)
			console.log(`${l.code}: ${l.ok.length} ok · ${l.stale.length} stale · ${l.missing.length} missing · ${l.invalid.length} invalid${l.extra.length ? ` · ${l.extra.length} unknown keys` : ''} → ${l.pages.size ? `${l.pages.has('') ? 'index + ' : ''}${[...l.pages].filter(Boolean).length} space pages` : 'no pages'}${l.reviewed ? ', reviewed' : l.pages.size ? ', unreviewed' : ''}`)
	}
}
