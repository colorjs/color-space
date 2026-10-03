// Translations at runtime. A page speaks the language its document declares: the build
// stamps /<lang>/… documents with <html lang> from their path prefix and compiles
// web/i18n/<lang>.json into i18n/<lang>.json – key → text, holding only translations that
// are valid and fresh (their h matches the current English). Every call site carries its
// own English, so a key missing from that table falls back per key, never per page.
// English documents fetch nothing. Format and workflow: web/i18n/README.md.

// site-root-relative: this module sits one level below the root (web/js/, _site/js/), so
// assets resolve the same from / and from /<lang>/ – a document-relative URL would not
export const at = (p) => new URL('../' + p, import.meta.url).href
export let LANG = globalThis.document?.documentElement.lang || 'en'
let DICT = LANG === 'en' ? {} : await fetch(at(`i18n/${LANG}.json`)).then((r) => r.ok ? r.json() : {}).catch(() => ({}))
// the build renders one language at a time (node has no document): it swaps the table in
export const use = (d, lang = 'en') => { DICT = d || {}; LANG = lang }
// t('ui.find', 'search spaces…') – named placeholders, so a translation can reorder words:
// t('ui.nores', 'no space matches “{q}”', { q })
export const t = (k, en, v) => { const s = DICT[k] ?? en
	return v ? s.replace(/\{(\w+)\}/g, (m, n) => n in v ? v[n] : m) : s }
// a vocabulary key: the term IS its identity (channel names) – 'Hue angle' → 'hue-angle', U* → u-star
export const slug = (s) => String(s).replace(/\*/g, '-star').replace(/[′']/g, '-prime').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// the same page in another language: swap the path prefix, keep the space, view and color
export const langHref = (code) => { const root = new URL(at('')).pathname
	const rest = location.pathname.slice(root.length).replace(LANG === 'en' ? '' : new RegExp(`^${LANG}(/|$)`), '')
	return root + (code === 'en' ? '' : code + '/') + rest + location.search + location.hash }
