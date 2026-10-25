/**
 * Colors as code writes them beyond CSS – each read into the library's spaces and written back in its own form: the
 * same call, labels, number forms (0.5f stays a float with its suffix, 51/255 stays over 255), only the values replaced.
 *
 *   0xRRGGBB, 0xAARRGGBB  three.js/PixiJS (RGB); Flutter Color(0x…), Jetpack Compose Color(0x…), Android (ARGB: the alpha
 *                         leads – api.flutter.dev Color(int), developer.android.com Color); Godot Color.hex(0xRRGGBBAA)
 *                         (RGBA). In code a bare 0x number is as often a mask, so it counts only beside a color word
 *                         (Color(, color:, setHex(…) on its line); in TOML and YAML (Alacritty's themes) a quoted '0x…' is one
 *   SwiftUI               Color(red:green:blue:opacity:) sRGB; Color(.sRGB | .sRGBLinear | .displayP3, red:…);
 *                         Color(hue:saturation:brightness:opacity:) HSB (developer.apple.com/documentation/swiftui/color)
 *   UIKit / AppKit        UIColor(red:green:blue:alpha:) extended sRGB, UIColor(displayP3Red:…), UIColor(hue:…);
 *                         NSColor(srgbRed:…), NSColor(displayP3Red:…). Not NSColor(red:…), calibratedRed:, deviceRed: –
 *                         their space is the device's or a generic one, not one this library has
 *   Flutter               Color.fromARGB(a, r, g, b), Color.fromRGBO(r, g, b, opacity): bytes, opacity 0–1
 *   Jetpack Compose       Color(r, g, b[, a]) floats 0–1 (0.5f) or ints 0–255; Color(red = …, green = …, blue = …, alpha = …)
 *   Unity (C#)            new Color(r, g, b[, a]) floats 0–1, gamma-encoded sRGB; new Color32(r, g, b, a) bytes
 *   Godot (GDScript)      Color(r, g, b[, a]) floats 0–1, sRGB; Color8(r, g, b[, a]) bytes
 *   Unreal (C++)          FLinearColor(r, g, b[, a]) linear-light sRGB; FColor(r, g, b[, a]) bytes, sRGB
 *   Shaders               vec3/vec4 (GLSL), vec3f/vec4f/vec3<f32> (WGSL), float3/float4/half3/half4 (HLSL, Metal): only
 *                         when the colorSpace.shaders setting says how to read them (sRGB or linear), since a vector is
 *                         as often a position; 0–1 components only
 */
import { WRITE, fx, splice } from './colors.js'
import { clamp } from '../../../math.js'

// a number as code writes it: 0.5, .5, 1., 1e-3, with a float suffix (0.5f, 1.0F, 0.5d), or a byte over 255 (51/255.0)
const NUM = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([fFdD]?)\s*(?:\/\s*(255(?:\.0*)?[fF]?)\s*)?$/
const num = (s, at) => {
	const m = s.match(NUM)
	if (!m) return null
	const lead = s.length - s.trimStart().length, len = s.trim().length
	return { n: m[3] ? +m[1] / 255 : +m[1], at: at + lead, len, float: m[3] ? false : /[.eE]/.test(m[1]) || !!m[2], suffix: m[2], div: m[3] || '' }
}
// a value written back in its argument's form: a float keeps a decimal point and its suffix, a byte stays an integer
const form = (p, x) => p.div ? `${Math.round(clamp(x * 255, 0, 255))}/${p.div}` : p.float ? (s => /[.e]/.test(s) ? s : s + '.0')(fx(x, 4)) + p.suffix : String(Math.round(x))

// a call's arguments ([label] value), with their offsets in the call's text; null if any isn't a plain number
function args(body, at) {
	const out = []
	let i = 0
	for (const raw of body.split(',')) {
		const m = raw.match(/^(\s*([A-Za-z_]\w*)\s*[:=](?!=)\s*)?([\s\S]*)$/)
		const label = m[2] || '', named = !label && /^\.[A-Za-z]/.test(raw.trim()), v = named ? null : num(m[3], at + i + (m[1] || '').length)
		if (named) out.push({ label: '', space: raw.trim() })   // Swift's color space, .displayP3
		else if (!v) return null
		else out.push({ label, ...v })
		i += raw.length + 1
	}
	return out
}

// a literal from a call: its channel arguments read through `read` into the library space, its alpha argument over adiv
// (255 for a byte). Arguments of a float parameter are floats whatever their form (Color(1, 0, 0) in C#), written back
// as floats with the language's suffix where it needs one (C#'s 0.5f)
function lit(m, space, parts, read, alphaPart, adiv, bound, floats = false, suffix = '') {
	if (floats) for (const p of [...parts, alphaPart].filter(p => p && !p.div)) { p.float = true; p.suffix ||= suffix }
	const v = read(parts.map(p => p.n)), alpha = alphaPart ? clamp(alphaPart.n / adiv, 0, 1) : 1
	if (!v.every(Number.isFinite)) return null
	return { start: m.index, end: m.index + m[0].length, text: m[0], space, v, alpha, nt: { fn: 'call', space, parts, alphaPart, adiv, bound, scale: read.scale } }
}
const scaled = k => Object.assign(c => c.map(x => x * k), { scale: [k, k, k] })   // a channel → the library's units
const HSB = Object.assign(([h, s, b]) => [h * 360, s * 100, b * 100], { scale: [360, 100, 100] })   // Apple's HSB 0–1 → hsv

// the call and its arguments' text, wherever `name(` stands as a word
const calls = (text, name) => text.matchAll(new RegExp(`(?<![\\w.])${name}\\s*\\(([^()]*)\\)`, 'g'))
const bodyAt = m => m.index + m[0].indexOf('(') + 1

// positional constructors: [language, call, floats (0–1) or bytes, space, the alpha's divisor, float suffix, order]
const POSITIONAL = [
	['csharp', 'new\\s+Color', true, 'rgb', 1, 'f'], ['csharp', 'new\\s+Color32', false, 'rgb', 255],
	['gdscript', 'Color', true, 'rgb', 1], ['gdscript', 'Color8', false, 'rgb', 255],
	['cpp', 'FLinearColor(?:\\s+[A-Za-z_]\\w*)?', true, 'lrgb', 1, 'f'], ['cpp', 'FColor(?:\\s+[A-Za-z_]\\w*)?', false, 'rgb', 255],   // a temporary, or a declaration: FColor C(…)
	['dart', 'Color\\.fromARGB', false, 'rgb', 255, '', 'argb'], ['dart', 'Color\\.fromRGBO', false, 'rgb', 1],
]

function positional(text, lang) {
	const out = []
	for (const [l, name, floats, sp, adiv, suffix, order] of POSITIONAL) if (l === lang) for (const m of calls(text, name)) {
		const a = args(m[1], bodyAt(m) - m.index)
		if (!a || a.length < 3 || a.length > 4 || a.some(x => x.label)) continue
		const [ch, al] = order === 'argb' ? [a.slice(1), a[0]] : [a.slice(0, 3), a[3]]
		if (al && sp === 'rgb' && !floats && adiv === 1) al.float = true   // fromRGBO's opacity is a double
		const r = lit(m, sp, ch, scaled(floats && sp === 'rgb' ? 255 : 1), al, adiv, 'srgb', floats, suffix)
		if (r) out.push(r)
	}
	return out
}

// Jetpack Compose: Color(r, g, b[, a]) – all floats (0–1) or all ints (0–255) – or with red = … labels
function compose(text) {
	const out = []
	for (const m of calls(text, 'Color')) {
		const a = args(m[1], bodyAt(m) - m.index)
		if (!a || a.length < 3 || a.length > 4) continue
		const by = a.every(x => x.label) ? Object.fromEntries(a.map(x => [x.label, x])) : null
		const [ch, al] = by ? [[by.red, by.green, by.blue], by.alpha] : [a.slice(0, 3), a[3]]
		if (ch.some(x => !x) || (!by && a.some(x => x.label))) continue
		const floats = ch.every(p => p.float)
		if (!floats && ch.some(p => p.float)) continue
		const r = lit(m, 'rgb', ch, scaled(floats ? 255 : 1), al, al && !al.float ? 255 : 1, 'srgb')
		if (r) out.push(r)
	}
	return out
}

// SwiftUI, UIKit, AppKit: labeled 0–1 components; the space from the call and its labels
function swift(text) {
	const out = []
	for (const m of text.matchAll(/(?<![\w.])(Color|UIColor|NSColor)\s*\(([^()]*)\)/g)) {
		const type = m[1], a = args(m[2], m.index + m[0].indexOf('(') + 1 - m.index)
		if (!a) continue
		const by = Object.fromEntries(a.filter(x => x.label).map(x => [x.label, x])), sp = a.find(x => x.space)?.space
		const al = by.opacity || by.alpha
		let space, ch, read = scaled(255), bound = 'srgb'
		if (by.hue && type !== 'NSColor') { space = 'hsv'; ch = [by.hue, by.saturation, by.brightness]; read = HSB }
		else if (type === 'Color' && by.red) { ch = [by.red, by.green, by.blue]; space = sp === '.displayP3' ? 'p3' : sp === '.sRGBLinear' ? 'lrgb' : !sp || sp === '.sRGB' ? 'rgb' : null }
		else if (by.displayP3Red && type !== 'Color') { ch = [by.displayP3Red, by.green, by.blue]; space = 'p3' }
		else if ((type === 'UIColor' && by.red) || (type === 'NSColor' && by.srgbRed)) { ch = [by.red || by.srgbRed, by.green, by.blue]; space = 'rgb' }
		if (!space || !ch || ch.some(x => !x) || a.length !== ch.length + (al ? 1 : 0) + (sp ? 1 : 0)) continue
		if (space === 'p3' || space === 'lrgb') { read = scaled(1); bound = space === 'p3' ? 'p3' : 'srgb' }
		const r = lit(m, space, ch, read, al, 1, bound, true)
		if (r) out.push(r)
	}
	return out
}

// 0x colors: beside a color word in code (or quoted in TOML/YAML); Godot's Color.hex(…) is RGBA, an 8-digit one elsewhere ARGB
const HEX0 = /(?<![\w.])0([xX])([0-9a-fA-F]{8}|[0-9a-fA-F]{6})(?![\w.])/g
const COLORISH = /(colou?r|setHex|tint|fill|stroke|background|foreground)/i
function hex0x(text, lang) {
	const out = [], data = lang === 'toml' || lang === 'yaml'
	for (const m of text.matchAll(HEX0)) {
		const lineStart = text.lastIndexOf('\n', m.index - 1) + 1, before = text.slice(lineStart, m.index)
		if (data ? !/['"]$/.test(before) : !COLORISH.test(before.slice(before.lastIndexOf(';') + 1).slice(-48))) continue   // in its own statement
		const d = m[2], rgba = /Color\.hex\(\s*$/.test(before), bytes = d.match(/../g).map(h => parseInt(h, 16))
		const [r, g, b, a = 255] = d.length === 6 ? bytes : rgba ? bytes : [...bytes.slice(1), bytes[0]]
		out.push({ start: m.index, end: m.index + m[0].length, text: m[0], space: 'rgb', v: [r, g, b], alpha: a / 255, nt: { fn: '0x', x: m[1], digits: d.length, order: d.length === 6 ? 'rgb' : rgba ? 'rgba' : 'argb', upper: /[A-F]/.test(d) && !/[a-f]/.test(d), bound: 'srgb' } })
	}
	return out
}

// shader vectors, read as the setting says (sRGB or linear), their components 0–1
const VEC = /(?<![\w.])(vec[34]|vec[34]f|vec[34]<f32>|float[34]|half[34])\s*\(([^()]*)\)/g
function shader(text, how) {
	const out = []
	for (const m of text.matchAll(VEC)) {
		const a = args(m[2], m[0].indexOf('(') + 1), n = m[1].includes('4') ? 4 : 3
		if (!a || a.length !== n || a.some(x => x.label || !(x.n >= 0 && x.n <= 1))) continue
		const sp = how === 'linear' ? 'lrgb' : 'rgb', r = lit(m, sp, a.slice(0, 3), scaled(sp === 'rgb' ? 255 : 1), a[3], 1, 'srgb', true)
		if (r) out.push(r)
	}
	return out
}

/**
 * The code colors in a text of language `lang` (a VS Code language id, or the file's extension where VS Code has none:
 * dart, gdscript…). shaders: 'srgb' | 'linear' to read shader vectors, else none.
 */
export function scanCode(text, lang, { shaders } = {}) {
	const out = []
	if (lang === 'c') lang = 'cpp'   // a .h VS Code takes for C may be Unreal's
	if (/^(dart|kotlin|java|javascript|javascriptreact|typescript|typescriptreact|csharp|cpp|c|swift|gdscript|python|lua|go|rust|toml|yaml)$/.test(lang)) out.push(...hex0x(text, lang))
	if (lang === 'swift') out.push(...swift(text))
	if (lang === 'kotlin') out.push(...compose(text))
	out.push(...positional(text, lang))
	if (shaders && /^(glsl|wgsl|hlsl|metal|shaderlab)$/.test(lang)) out.push(...shader(text, shaders))
	return out
}

// the writers: a call's values replaced in place; a 0x literal rewritten in its order, digits and case
WRITE.call = (nt, to, alpha, text) => {
	const v = to(nt.space), parts = nt.alphaPart ? [...nt.parts, nt.alphaPart] : nt.parts
	// a value its argument already holds (to the precision it would be written at) keeps its text: 1 stays 1, not 1.0
	const same = (p, x) => p.float && !p.div ? Math.abs(x - p.n) < 5e-5 : Math.round(x * (p.div ? 255 : 1)) === Math.round(p.n * (p.div ? 255 : 1))
	return splice(text, parts, parts.map((p, i) => { const x = i < 3 ? v[i] / nt.scale[i] : alpha * nt.adiv; return same(p, x) ? null : form(p, x) }))
}
WRITE['0x'] = (nt, to, alpha) => {
	const [r, g, b] = to('rgb').map(x => Math.round(clamp(x, 0, 255))), a = Math.round(alpha * 255)
	const bytes = nt.order === 'rgb' ? [r, g, b] : nt.order === 'rgba' ? [r, g, b, a] : [a, r, g, b]
	const d = bytes.map(x => x.toString(16).padStart(2, '0')).join('')
	return `0${nt.x}${nt.upper ? d.toUpperCase() : d}`
}

