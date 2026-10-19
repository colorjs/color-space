/**
 * Colors in data files – read into the library's spaces and written back in place, each value in its own form:
 *
 *   Xcode color sets      Assets.xcassets/<name>.colorset/Contents.json: "color": { "color-space": "srgb" | "display-p3" |
 *                         "extended-srgb" | "extended-linear-srgb", "components": { "red": "0.500" | "0x80" | "128", … } }:
 *                         a float 0–1, a hex byte or an integer byte, as Xcode's input methods write them
 *                         (developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/Named_Color.html).
 *                         The gray spaces aren't read: their gamma isn't one this library has
 *   Design tokens         DTCG 2025.10 (designtokens.org/tr/2025.10/color): "$value": { "colorSpace", "components": [ … ],
 *                         "alpha"?, "hex"? } – components as CSS Color 4 numbers (srgb 0–1, hsl 0–360/0–100, lab 0–100…),
 *                         `none` as "none"; an edit updates the hex fallback too. rec2020 reads as rec2020-display (css.js)
 *   iTerm2 themes         .itermcolors: <dict> per color with Red/Green/Blue/Alpha Component <real> 0–1 and Color Space
 *                         <string>sRGB | P3</string>. A color without a Color Space is iTerm2's old "Calibrated" (a device
 *                         space): not read
 *   GIMP palettes         .gpl (GIMP, Inkscape, Krita): "GIMP Palette", then one color per line, R G B 0–255 and a name
 */
import { WRITE, fx, clamp, splice } from './colors.js'

// a JSON value's object: the balanced braces around offset i (strings skipped)
function objectAt(text, i) {
	let s = -1
	for (let d = 0, k = i; k >= 0; k--) {
		const c = text[k]
		if (c === '}') d++
		else if (c === '{') { if (!d) { s = k; break } d-- }
	}
	if (s < 0) return null
	for (let d = 0, k = s, str = false; k < text.length; k++) {
		const c = text[k]
		if (str) { if (c === '\\') k++; else if (c === '"') str = false; continue }
		if (c === '"') str = true
		else if (c === '{') d++
		else if (c === '}' && !--d) return [s, k + 1]
	}
	return null
}

/* ---------- Xcode color sets ---------- */

const COLORSET = { 'srgb': ['rgb', 'srgb'], 'display-p3': ['p3', 'p3'], 'extended-srgb': ['rgb', null], 'extended-linear-srgb': ['lrgb', null] }
// a component as Xcode writes it: "0.500" (0–1), "0x80" or "128" (a byte)
function component(s, at) {
	const t = s.trim(), hex = /^0x[0-9a-f]{1,2}$/i.test(t), int = /^\d+$/.test(t)
	const n = hex ? parseInt(t, 16) / 255 : int ? +t / 255 : +t
	return Number.isFinite(n) && t ? { n, at, len: s.length, hex, int, upper: /[A-F]/.test(t) } : null
}
function colorsets(text) {
	const out = []
	for (const m of text.matchAll(/"color-space"\s*:\s*"([\w-]+)"/g)) {
		const sp = COLORSET[m[1]], o = sp && objectAt(text, m.index)
		if (!o) continue
		const body = text.slice(o[0], o[1]), cm = body.match(/"components"\s*:\s*\{([^{}]*)\}/)
		if (!cm) continue
		const base = cm.index + cm[0].indexOf('{') + 1, get = k => {   // offsets into the color's object, the literal's text
			const km = cm[1].match(new RegExp(`"${k}"\\s*:\\s*"([^"]*)"`))
			return km && component(km[1], base + km.index + km[0].length - 1 - km[1].length)
		}
		const parts = ['red', 'green', 'blue'].map(get), al = get('alpha')
		if (parts.some(p => !p)) continue
		const k = sp[0] === 'rgb' ? 255 : 1
		out.push({ start: o[0], end: o[1], text: body, space: sp[0], v: parts.map(p => p.n * k), alpha: al ? clamp(al.n, 0, 1) : 1, nt: { fn: 'colorset', space: sp[0], k, parts, al, bound: sp[1] } })
	}
	return out
}
const xcode = (p, x) => p.hex ? '0x' + (s => p.upper ? s.toUpperCase() : s)(Math.round(clamp(x, 0, 1) * 255).toString(16).padStart(2, '0')) : p.int ? String(Math.round(clamp(x, 0, 1) * 255)) : x.toFixed(3)
WRITE.colorset = (nt, to, alpha, text) => {
	const v = to(nt.space), parts = nt.al ? [...nt.parts, nt.al] : nt.parts
	return splice(text, parts, parts.map((p, i) => { const x = i < 3 ? v[i] / nt.k : alpha; return xcode(p, x) === xcode(p, p.n) ? null : xcode(p, x) }))
}

/* ---------- design tokens (DTCG) ---------- */

// colorSpace → [library space, its scale over the token's numbers, places written, bound]
const DTCG = {
	'srgb': ['rgb', 255, 4, 'srgb'], 'srgb-linear': ['lrgb', 1, 4, null], 'display-p3': ['p3', 1, 4, 'p3'], 'a98-rgb': ['a98rgb', 1, 4, null],
	'prophoto-rgb': ['prophoto', 1, 5, null], 'rec2020': ['rec2020-display', 1, 5, null], 'hsl': ['hsl', 1, 2, 'srgb'], 'hwb': ['hwb', 1, 2, 'srgb'], 'lab': ['lab', 1, 3, null],
	'lch': ['lchab', 1, 3, null], 'oklab': ['oklab', 1, 4, null], 'oklch': ['oklch', 1, 4, null], 'xyz-d65': ['xyz', 100, 5, null], 'xyz-d50': ['xyz-d50', 100, 5, null],
}
function tokens(text) {
	const out = []
	for (const m of text.matchAll(/"colorSpace"\s*:\s*"([\w-]+)"/g)) {
		const sp = DTCG[m[1]], o = sp && objectAt(text, m.index)
		if (!o) continue
		const body = text.slice(o[0], o[1]), cm = body.match(/"components"\s*:\s*\[([^\]]*)\]/)
		if (!cm) continue
		let at = cm.index + cm[0].indexOf('[') + 1
		const parts = cm[1].split(',').map(s => { const p = { at: at + s.length - s.trimStart().length, len: s.trim().length, none: s.trim() === '"none"', n: +s }; at += s.length + 1; return p })
		if (parts.length !== 3 || parts.some(p => !p.none && !Number.isFinite(p.n))) continue
		const am = body.match(/"alpha"\s*:\s*([-+\d.eE]+)/), hm = body.match(/"hex"\s*:\s*"(#[0-9a-fA-F]{6})"/)
		const al = am && { at: am.index + am[0].length - am[1].length, len: am[1].length, n: +am[1] }
		const hex = hm && { at: hm.index + hm[0].length - 1 - hm[1].length, len: hm[1].length }
		const token = objectAt(text, o[0] - 1), name = token && (text.slice(0, token[0]).match(/"([^"]+)"\s*:\s*$/) || [])[1]   // the token's own key
		out.push({ start: o[0], end: o[1], text: body, name, space: sp[0], v: parts.map(p => p.none ? 0 : p.n * sp[1]), alpha: al ? clamp(al.n, 0, 1) : 1, nt: { fn: 'dtcg', sp, parts, al, hex, bound: sp[3] } })
	}
	return out
}
WRITE.dtcg = (nt, to, alpha, text) => {
	// a component that keeps its value keeps its text ("none" included, where the value is still 0)
	const [id, k, d] = nt.sp, v = to(id), strs = nt.parts.map((p, i) => { const s = fx(v[i] / k, d); return fx(p.none ? 0 : p.n, d) === s ? null : s })
	const parts = [...nt.parts], out = [...strs]
	if (nt.al) { parts.push(nt.al); out.push(fx(nt.al.n, 3) === fx(alpha, 3) ? null : fx(alpha, 3)) }
	if (nt.hex && out.some(s => s != null)) { parts.push(nt.hex); out.push(WRITE.hex6(to)) }   // an edit renews the fallback, 6-digit sRGB (the spec's own rule)
	return splice(text, parts, out)
}
WRITE.hex6 = to => '#' + to('rgb').map(x => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('')

/* ---------- iTerm2 ---------- */

const ITERM = { sRGB: ['rgb', 255, 'srgb'], P3: ['p3', 1, 'p3'] }
function itermcolors(text) {
	const out = []
	out.skipped = 0
	for (const m of text.matchAll(/<key>([^<]+)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g)) {
		const body = m[2], at = m.index + m[0].indexOf('<dict>') + 6 - m.index
		const sp = ITERM[(body.match(/<key>Color Space<\/key>\s*<string>([^<]*)<\/string>/) || [])[1]]
		const get = k => { const r = body.match(new RegExp(`<key>${k} Component</key>\\s*<real>([^<]*)</real>`)); return r && { at: at + r.index + r[0].length - 7 - r[1].length, len: r[1].length, n: +r[1] } }   // 7: </real>
		const parts = ['Red', 'Green', 'Blue'].map(get), al = get('Alpha')
		if (parts.some(p => !p || !Number.isFinite(p.n))) continue
		if (!sp) { out.skipped++; continue }   // no Color Space, or one not this library's: said, not guessed
		out.push({ start: m.index, end: m.index + m[0].length, text: m[0], name: m[1], space: sp[0], v: parts.map(p => p.n * sp[1]), alpha: al ? clamp(al.n, 0, 1) : 1, nt: { fn: 'iterm', sp, parts, al, bound: sp[2] } })
	}
	return out
}
WRITE.iterm = (nt, to, alpha, text) => {
	const v = to(nt.sp[0]), parts = nt.al ? [...nt.parts, nt.al] : nt.parts
	return splice(text, parts, parts.map((p, i) => { const x = i < 3 ? v[i] / nt.sp[1] : alpha; return Math.abs(x - p.n) < 5e-7 ? null : String(+x.toFixed(6)) }))
}

/* ---------- GIMP palettes ---------- */

function gpl(text) {
	if (!/^GIMP Palette\r?\n/.test(text)) return []
	const out = []
	for (const m of text.matchAll(/^([ \t]*)(\d+)([ \t]+)(\d+)([ \t]+)(\d+)(?=[ \t]|\r?$)(?:[ \t]+(.*))?$/gm)) {
		let at = m[1].length
		const parts = [2, 4, 6].map(g => { const p = { at, len: m[g].length, n: +m[g] }; at += m[g].length + (m[g + 1] || '').length; return p })
		if (parts.some(p => p.n > 255)) continue
		out.push({ start: m.index, end: m.index + m[0].length, text: m[0], name: (m[7] || '').trim(), space: 'rgb', v: parts.map(p => p.n), alpha: 1, nt: { fn: 'gpl', parts, bound: 'srgb' } })
	}
	return out
}
// the three bytes as GIMP writes them, each right-aligned three wide ("%3d %3d %3d", 252 233  79); the name stays
WRITE.gpl = (nt, to, alpha, text) => {
	const b = to('rgb').map(x => Math.round(clamp(x, 0, 255)))
	if (b.every((x, i) => x === nt.parts[i].n)) return text
	const end = nt.parts[2].at + nt.parts[2].len
	return b.map(x => String(x).padStart(3, ' ')).join(' ') + text.slice(end)
}

/** The data-file colors in a text, by its language and its path; `skipped` on the list counts the colors not read. */
export function scanData(text, lang, path = '') {
	if (/\.colorset\/Contents\.json$/.test(path)) return colorsets(text)
	if (/\.itermcolors$/i.test(path)) return itermcolors(text)
	if (/\.gpl$/i.test(path) || /^GIMP Palette\r?\n/.test(text)) return gpl(text)
	if (/^jsonc?$/.test(lang) && text.includes('"colorSpace"')) return tokens(text)
	return []
}
