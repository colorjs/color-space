// Vocabulary keys: a term IS its identity in the translation tables. Pure, no table and no fetch, so a bundle that
// can't load the site's runtime tables (the Figma plugin) keys its words the same way.

// 'Hue angle' → 'hue-angle', U* → u-star
export const slug = (s) => String(s).replace(/\*/g, '-star').replace(/[′']/g, '-prime').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// a channel's display name – English from the registry, translated as vocabulary (channel.<slug>)
export const chEn = c => c.name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/(\s*\b(percentage|percent|angle in degrees|in degrees|axis|component|coordinate)\b\s*)+$/i, '').trim()
// (a bare symbol – X, U, Z′ – is notation, not a word: it stays as it is)
export const chKey = c => { const en = chEn(c); return /\p{L}{2}/u.test(en) ? 'channel.' + slug(en) : null }
