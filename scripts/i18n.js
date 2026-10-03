// Translations, the build side: the markup units web/index.html marks with data-i18n, each
// language's status against the current English (ok · stale · missing · invalid), the
// compiled runtime table, and the plan of which /<lang>/ documents get stamped. Extraction
// lives in i18n-extract.js, the runtime in web/js/i18n.js, the format in web/i18n/README.md.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// h: the fingerprint of the English a translation was made from – it changes when the English does
export const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8)

// ── markup units: data-i18n="key attr:key …" – a bare key is the element's content, attr:key
// one attribute. Script and style bodies are code: their template markup is never a unit.
const TAG = /<([a-zA-Z][\w-]*)((?:\s+[^\s=>"'/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?)*)\s*\/?>/g
const code = (html) => [...html.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => [m.index, m.index + m[0].length])
// the element's matching close tag, nesting-aware (same-name descendants)
const closeOf = (html, tag, from) => {
	const rx = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi'); rx.lastIndex = from
	for (let depth = 1, m; (m = rx.exec(html));) { depth += m[1] ? -1 : 1; if (!depth) return m.index }
	throw new Error(`i18n: <${tag}> at ${from} never closes`)
}
export function units(html) {
	const out = [], skip = code(html)
	for (const m of html.matchAll(TAG)) {
		if (skip.some(([a, b]) => m.index > a && m.index < b)) continue
		const mark = m[2].match(/\s+data-i18n="([^"]*)"/)
		if (!mark) continue
		const at = m.index + 1 + m[1].length   // where the attribute list starts
		out.push({ strip: [at + mark.index, at + mark.index + mark[0].length] })
		for (const spec of mark[1].trim().split(/\s+/)) {
			const [attr, key] = spec.includes(':') ? spec.split(':') : [null, spec]
			if (attr) {
				const a = m[2].match(new RegExp(`\\s${attr}="([^"]*)"`))
				if (!a) throw new Error(`i18n: ${key} names ${attr}, but <${m[1]}> has no ${attr}="…"`)
				const s = at + a.index + a[0].indexOf('"') + 1
				out.push({ key, attr, range: [s, s + a[1].length], en: a[1] })
			} else {
				const s = m.index + m[0].length, e = closeOf(html, m[1], s), inner = html.slice(s, e)
				if (inner.includes('data-i18n=')) throw new Error(`i18n: ${key} – a translated element can't hold another (translate the parts, or the whole)`)
				out.push({ key, range: [s, e], en: inner.replace(/\s+/g, ' ').trim() })
			}
		}
	}
	return out
}
// translate the marked units the table carries, then drop every marker – an empty table
// yields the source byte-for-byte minus the data-i18n attributes (the English document)
export function apply(html, table = {}) {
	const edits = units(html).flatMap((u) => u.strip ? [[u.strip, '']] : table[u.key] != null ? [[u.range, table[u.key]]] : [])
	edits.sort((a, b) => b[0][0] - a[0][0])
	for (const [[s, e], text] of edits) html = html.slice(0, s) + text + html.slice(e)
	return html
}

// ── validity: a translation keeps its English's markup and placeholders – tags may move with
// the word order, explanatory attributes inside them (title, aria-label, alt) may translate –
// and adds no straight double quote (it would end an HTML attribute; use typographic quotes)
const tagsOf = (s) => (s.match(/<\/?[a-zA-Z][^>]*>/g) || []).map((x) => x.replace(/\s(title|aria-label|alt)="[^"]*"/g, ' $1')).sort().join('\n')
const holesOf = (s) => (s.match(/\{\w+\}/g) || []).sort().join()
export const valid = (en, tr) => typeof tr === 'string' && !!tr.trim() && tagsOf(tr) === tagsOf(en) && holesOf(tr) === holesOf(en) && (en.includes('"') || !tr.includes('"'))

// a key belongs to one space's page (its description, use, lore) or to every page (the rest)
export const ownerOf = (key) => /^(space|lore)\.([^.]+)\./.exec(key)?.[2] ?? ''

// one language against the current English: every key's state, the compiled table (fresh +
// valid only – the runtime falls back per key for the rest), and the pages it may stamp.
// Unreviewed: a page needs every key it shows ok – complete and current, so the native
// reader reviews what will ship. Reviewed: promoted pages stay up through English drift – a
// changed or new string falls back to English per key (the build reports it) – and a space
// page needs only that its own content has been translated at all.
export function status(en, file, spaces) {
	const meta = file['@meta'] || {}, keys = Object.keys(en).filter((k) => k !== '@meta')
	const state = {}, table = {}
	for (const k of keys) {
		const e = file[k]
		state[k] = !e?.t ? 'missing' : !valid(en[k].t, e.t) ? 'invalid' : e.h !== en[k].h ? 'stale' : 'ok'
		if (state[k] === 'ok') table[k] = e.t
	}
	const of = (o) => keys.filter((k) => ownerOf(k) === o)
	const shared = of('').every((k) => state[k] === 'ok')
	const own = (s) => of(s).every((k) => state[k] === 'ok' || (meta.reviewed && state[k] === 'stale'))
	const pages = new Set(meta.reviewed || shared ? ['', ...spaces.filter(own)] : [])
	const extra = Object.keys(file).filter((k) => k !== '@meta' && !en[k])
	const count = (s) => keys.filter((k) => state[k] === s)
	return { meta, table, pages, state, ok: count('ok'), stale: count('stale'), missing: count('missing'), invalid: count('invalid'), extra }
}

// every language in a directory of <lang>.json files (en.json is the source, not a language)
export const CODE = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-\d{3})?$/   // BCP 47 language[-Script][-REGION]
export function plan(dir, spaces) {
	const enFile = join(dir, 'en.json')
	const en = existsSync(enFile) ? JSON.parse(readFileSync(enFile, 'utf8')) : {}
	const langs = (existsSync(dir) ? readdirSync(dir) : []).filter((f) => f.endsWith('.json') && f !== 'en.json').sort().map((f) => {
		const code = f.slice(0, -5)
		if (!CODE.test(code)) throw new Error(`i18n: ${f} – name language files by their BCP 47 tag (pt-BR.json, es.json)`)
		const file = JSON.parse(readFileSync(join(dir, f), 'utf8')), st = status(en, file, spaces)
		if (!st.meta.name) throw new Error(`i18n: ${f} – "@meta": { "name": … } is the language's own name, shown in the language select`)
		return { code, name: st.meta.name, reviewed: st.meta.reviewed || null, indexed: !!st.meta.reviewed && st.pages.size > 0, ...st }
	})
	return { en, langs: langs.filter((l) => l.pages.size), all: langs }
}
