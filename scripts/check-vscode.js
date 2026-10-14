#!/usr/bin/env node
/**
 * Check the VS Code extension (plugins/vscode) without VS Code.
 *
 * 1. Its CSS color literals (plugins/vscode/src/colors.js): every notation parsed against colorjs.io (Lea Verou and
 *    Chris Lilley's implementation of CSS Color 4, https://colorjs.io) as the reference, compared in OKLab; CSS's
 *    parse-time clamps and invalid forms against the spec's own text; each literal written back in its own notation.
 *    Gradients (their stops, their mixing space) and url()s; a gradient's line mixed per CSS Color 4 (plugins/figma/src/mix.js).
 *    The colors beyond CSS – code (0x…, SwiftUI/UIKit/AppKit, Flutter, Compose, Unity, Godot, Unreal, shaders), data files
 *    (Xcode color sets, DTCG tokens, iTerm2, GIMP), Android's ARGB, Adobe .ase – each read as its documentation defines
 *    it, written back unchanged as the same text, an edit read back as the color written.
 * 2. The extension itself: the built dist/extension.cjs runs in Node against a mock `vscode` (scripts/vscode-mock.js),
 *    the built panel in a Chromium page, the messages bridged the way VS Code's webview bridges them. It covers the
 *    document's overview (every literal, the cursor's current, a range narrowing it), read → display → edit → write →
 *    re-read for oklch(), #hex, legacy rgba() and a gradient stop, one undo step per gesture, a paint chosen in the panel
 *    bringing the editor to it, gradient lines in their space, images from url()s, data: URLs and an open image tab, an
 *    out-of-gamut literal, a read-only document, the gamut setting, the hover, the convert command, the stored
 *    preferences and the MCP server definition.
 *
 *   node scripts/check-vscode.js      (npm run test:vscode)
 *
 * It does not cover VS Code itself: the real webview, its theme variables and the extension host are untested here.
 * VSCODE_SHOTS=<dir> saves the panel in a dark and a light theme.
 */
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import Color from 'colorjs.io'
import space from '../index.js'
import NAMES from '../web/js/names.js'
import { gamutMap, deltaEOK, DEST } from '../plugins/figma/src/gamut.js'
import { scan, serialize, toDoc, profileOf, gradients, mixOf, urls, nameAt } from '../plugins/vscode/src/colors.js'
import { mixer } from '../plugins/figma/src/mix.js'
import { scanCode } from '../plugins/vscode/src/code.js'
import { scanData } from '../plugins/vscode/src/data.js'
import { readAse } from '../plugins/vscode/src/ase.js'
import { mock, requireWith } from './vscode-mock.js'

const dir = fileURLToPath(new URL('../plugins/vscode/', import.meta.url))
execFileSync(process.execPath, [dir + 'build.js'], { stdio: 'inherit' })
const pkg = JSON.parse(readFileSync(dir + 'package.json', 'utf8'))

const failures = []
let passed = 0
const ok = (cond, msg) => { if (cond) passed++; else failures.push(msg) }
const one = s => { const l = scan(s, { named: true }); return l.length === 1 && l[0].start === 0 && l[0].end === s.length ? l[0] : null }
const oklabOf = l => space[l.space].oklab(...l.v)

/* ---------- 1. literals: parsed against colorjs.io ---------- */

{
	// random colors in every notation, inside each notation's range (colorjs.io doesn't clamp, CSS does: the clamps are
	// checked against the spec below); percentages, hue units, legacy commas and alphas mixed in
	let seed = 7
	const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
	const r = (lo, hi, d = 3) => +(lo + (hi - lo) * rnd()).toFixed(d)
	const pick = a => a[Math.floor(rnd() * a.length)]
	const hue = () => pick([() => `${r(0, 360, 2)}`, () => `${r(0, 360, 2)}deg`, () => `${r(0, 1, 4)}turn`, () => `${r(0, 6.28, 4)}rad`, () => `${r(0, 400, 2)}grad`])()
	const alpha = (legacy) => rnd() < 0.5 ? '' : legacy ? `, ${r(0, 1, 2)}` : ` / ${pick([`${r(0, 1, 2)}`, `${r(0, 100, 1)}%`])}`
	const hex = n => Array.from({ length: n }, () => '0123456789abcdefABCDEF'[Math.floor(rnd() * 22)]).join('')
	const GEN = [
		() => `rgb(${r(0, 255, 0)} ${r(0, 255, 1)} ${r(0, 255, 0)}${alpha()})`,
		() => `rgb(${r(0, 100, 1)}% ${r(0, 100, 1)}% ${r(0, 100, 1)}%${alpha()})`,
		() => `rgb(${r(0, 255, 0)}, ${r(0, 255, 0)}, ${r(0, 255, 0)})`,
		() => `rgba(${r(0, 255, 0)}, ${r(0, 255, 0)}, ${r(0, 255, 0)}${alpha(true) || ', 1'})`,
		() => `#${hex(pick([3, 4, 6, 8]))}`,
		() => `hsl(${hue()} ${r(0, 100, 1)}% ${r(0, 100, 1)}%${alpha()})`,
		() => `hsla(${r(0, 360, 1)}, ${r(0, 100, 1)}%, ${r(0, 100, 1)}%${alpha(true) || ', 1'})`,   // colorjs.io 0.5 reads hsla() only with its alpha; three arguments are checked below
		() => `hwb(${hue()} ${r(0, 50, 1)}% ${r(0, 50, 1)}%${alpha()})`,
		() => `lab(${pick([`${r(0, 100, 2)}%`, `${r(0, 100, 2)}`])} ${pick([`${r(-125, 125, 2)}`, `${r(-100, 100, 1)}%`])} ${r(-125, 125, 2)}${alpha()})`,
		() => `lch(${r(0, 100, 2)}% ${pick([`${r(0, 150, 2)}`, `${r(0, 100, 1)}%`])} ${hue()}${alpha()})`,
		() => `oklab(${pick([`${r(0, 1, 4)}`, `${r(0, 100, 2)}%`])} ${pick([`${r(-0.4, 0.4, 4)}`, `${r(-100, 100, 1)}%`])} ${r(-0.4, 0.4, 4)}${alpha()})`,
		() => `oklch(${pick([`${r(0, 1, 4)}`, `${r(0, 100, 2)}%`])} ${pick([`${r(0, 0.4, 4)}`, `${r(0, 100, 1)}%`])} ${hue()}${alpha()})`,
		() => `color(${pick(['srgb', 'srgb-linear', 'display-p3', 'a98-rgb', 'prophoto-rgb'])} ${r(0, 1, 4)} ${pick([`${r(0, 1, 4)}`, `${r(0, 100, 1)}%`])} ${r(0, 1, 4)}${alpha()})`,
		() => `color(${pick(['xyz', 'xyz-d65', 'xyz-d50'])} ${r(0, 0.95, 4)} ${r(0, 1, 4)} ${r(0, 0.82, 4)}${alpha()})`,
	]
	const corpus = [...Object.keys(NAMES), 'transparent', 'RebeccaPurple', 'RGB(10 20 30)', 'OKLCH(0.5 0.1 200)']
	for (let k = 0; k < 3000; k++) corpus.push(GEN[k % GEN.length]())
	let worst = 0, bad = '', missed = [], alphaBad = []
	for (const s of corpus) {
		const l = one(s)
		if (!l) { missed.push(s); continue }
		let ref; try { ref = new Color(s) } catch (e) { missed.push(`${s} (colorjs.io: ${e.message})`); continue }
		const d = deltaEOK(oklabOf(l), ref.to('oklab').coords.map(v => +v || 0))
		if (d > worst) { worst = d; bad = s }
		if (Math.abs(l.alpha - +ref.alpha) > 1e-9) alphaBad.push(`${s}: ${l.alpha} vs ${+ref.alpha}`)
	}
	ok(!missed.length, `every generated literal is found whole: missed ${missed.slice(0, 5).join(' | ')}`)
	// the tolerance: the library and colorjs.io agree to ~1e-4 ΔEOK on wide-gamut and D50 spaces (their matrices are
	// derived independently); a misread channel – a percentage's reference, a hue unit – is off by far more than this
	ok(worst < 5e-4, `${corpus.length} literals match colorjs.io: worst ΔEOK ${worst.toExponential(2)} (${bad})`)
	ok(!alphaBad.length, `alphas match colorjs.io: ${alphaBad.slice(0, 3).join(' | ')}`)

	// written back in its own notation, a literal names the same color, to that notation's printed precision: oklch() and
	// oklab() at three decimals stay within a fifth of a JND (plugins/figma/src/notation.js); rgb()/#hex at 8 bits within
	// half a level; the rest finer. Its form stays: the function's name, legacy commas, #hex's case and length
	let worstW = 0, badW = '', form = []
	for (const s of corpus) {
		const l = one(s); if (!l) continue
		const profile = profileOf([l], 'p3'), w = serialize(l.nt, toDoc(l, profile), profile, l.alpha), back = one(w)
		if (!back) { form.push(`${s} → ${w} (unreadable)`); continue }
		const d = deltaEOK(oklabOf(l), oklabOf(back))
		if (d > worstW) { worstW = d; badW = `${s} → ${w}` }
		if (Math.abs(back.alpha - l.alpha) > 0.0005 + (l.nt.fn === 'hex' || l.nt.fn === 'named' ? 1 / 510 : 0)) form.push(`${s} → ${w} (alpha)`)
		const fnOf = x => x.match(/^[a-z]+(?=\()/i)?.[0]
		if (l.nt.fn === 'named') { if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(w)) form.push(`${s} → ${w}`) }
		else if (l.nt.fn === 'hex') { if (w.length !== s.length && !(l.nt.short && w.length === 2 * s.length - 1) || (l.nt.upper && /[a-f]/.test(w)) || (!l.nt.upper && /[A-F]/.test(w))) form.push(`${s} → ${w}`) }
		else if (fnOf(w) !== fnOf(s) || s.includes(',') !== w.includes(',')) form.push(`${s} → ${w}`)
	}
	ok(worstW < 0.004, `written back, every literal names its color: worst ΔEOK ${worstW.toFixed(5)} (${badW})`)
	ok(!form.length, `written back in its own form: ${form.slice(0, 4).join(' | ')}`)
	console.log(`colors.js: ${corpus.length} literals vs colorjs.io, worst ΔEOK ${worst.toExponential(1)}; written back, worst ΔEOK ${worstW.toExponential(1)}`)
}

// CSS's parse-time clamps (CSS Color 4: #rgb-functions clamps rgb() to [0, 255]; #the-hsl-notation a negative
// saturation to 0; #specifying-lab-lch lab/lch lightness to [0, 100] and a negative chroma to 0; #specifying-oklab-oklch
// oklab/oklch lightness to [0, 1] and a negative chroma to 0; #alpha-syntax alpha to [0, 1])
{
	const v = s => { const l = one(s); return l && [...l.v.map(x => +x.toFixed(6)), +l.alpha.toFixed(6)].join(' ') }
	ok(v('rgb(300 -5 0 / 1.5)') === '255 0 0 1', `rgb() clamps to [0, 255], alpha to [0, 1]: ${v('rgb(300 -5 0 / 1.5)')}`)
	ok(v('hsl(10 -20% 50%)') === '10 0 50 1', `hsl() clamps a negative saturation to 0: ${v('hsl(10 -20% 50%)')}`)
	ok(v('lab(120% 10 10)') === '100 10 10 1' && v('lch(-5 -10 30)') === '0 0 30 1', `lab()/lch() clamp lightness and chroma: ${v('lab(120% 10 10)')} · ${v('lch(-5 -10 30)')}`)
	ok(v('oklch(1.2 -0.1 40)') === '1 0 40 1' && v('oklab(-0.1 0.1 0)') === '0 0.1 0 1', `oklab()/oklch() clamp lightness and chroma: ${v('oklch(1.2 -0.1 40)')} · ${v('oklab(-0.1 0.1 0)')}`)
	// modern hsl() and hwb() take bare numbers for their percentages (#the-hsl-notation, #the-hwb-notation); colorjs.io
	// 0.5 doesn't yet, so they're checked here
	ok(v('hsla(120, 50%, 25%)') === v('hsl(120 50% 25%)'), `hsla() is hsl(), its alpha optional (#the-hsl-notation): ${v('hsla(120, 50%, 25%)')}`)
	ok(v('hsl(120 50 25 / 0.5)') === v('hsl(120 50% 25% / 0.5)') && v('hwb(30 10 20)') === v('hwb(30 10% 20%)'), `modern hsl()/hwb() take numbers: ${v('hsl(120 50 25 / 0.5)')} · ${v('hwb(30 10 20)')}`)
	// `none` is a missing component, 0 for conversion (#missing)
	ok(v('oklch(0.5 none none)') === '0.5 0 0 1' && v('rgb(none 128 0 / none)') === '0 128 0 0', `none reads as 0: ${v('oklch(0.5 none none)')} · ${v('rgb(none 128 0 / none)')}`)
	// not literals: the forms CSS rejects (#rgb-functions: legacy syntax takes no `none`, no mixed numbers and
	// percentages, no mixed commas and spaces; #the-hsl-notation: legacy hsl() takes percentages), what only a browser can
	// resolve (var(), calc(), relative `from`), and color(rec2020 …), whose transfer this library doesn't share (css.js)
	const NOT = ['rgb(1, 2 3)', 'rgb(1, none, 3)', 'rgb(10%, 20, 30)', 'hsl(10, 20, 30)', 'rgb(var(--x))', 'rgb(calc(1) 2 3)', 'oklch(from #f00 l c h)', 'color(rec2020 1 0 0)', 'hwb(1, 2%, 3%)', 'lab(1 2)', 'oklch(0.5 0.1 40deg 1)', 'rgb(1 2 3 /)', 'color(display-p3 1 0 0deg)', 'oklch(0.5 0.1deg 40)']
	const found = NOT.filter(s => scan(s).some(l => l.text === s))
	ok(!found.length, `invalid or unresolvable forms are not literals: ${found.join(' | ')}`)
	// the smallest forms and the empty ones: #rgb and a bare rgb() are literals; nothing, an empty function, a lone # are not
	ok(scan('').length === 0 && scan('rgb()').length === 0 && scan('#').length === 0 && scan('color()').length === 0 && scan('oklch( )').length === 0, 'empty text and empty functions hold no literal')
	ok(v('#000') === '0 0 0 1' && v('#0000') === '0 0 0 0' && v('rgb(0 0 0)') === '0 0 0 1' && v('rgb(0,0,0)') === '0 0 0 1', `the smallest literals: ${v('#000')} · ${v('#0000')} · ${v('rgb(0,0,0)')}`)
	// A → A: a literal already in its notation's printed form, written back unchanged, is the same text (an edit that lands
	// on the color it started from rewrites nothing); A → B: two literals on one line are found apart, each in its place
	const same = ['oklch(0.7 0.15 40)', '#ff8000', '#F80', 'rgba(0, 128, 255, 0.5)', 'hsl(120 50% 25%)', 'color(display-p3 1 0 0)', 'lab(50% 40 -20)', 'oklch(62% 0.19 255 / 0.5)']
		.filter(t => { const l = one(t), p = profileOf([l], 'p3'); return serialize(l.nt, toDoc(l, p), p, l.alpha) !== t })
	ok(!same.length, `written back unchanged, a literal keeps its text: ${same.join(' | ')}`)
	const two = scan('a: #fff; b: oklch(0.5 0.1 40);')
	ok(two.length === 2 && two[0].text === '#fff' && two[0].start === 3 && two[1].text === 'oklch(0.5 0.1 40)' && two[1].start === 12, `two literals on a line, each in its place: ${two.map(l => `${l.text}@${l.start}`)}`)
	// where a literal stops: a hex in a URL fragment or an entity, a name inside a word or a selector, isn't one
	const texts = s => scan(s, { named: true }).map(l => l.text).join(' ')
	ok(texts('a { color: red; } .red #red $red --red red-ish x-red &#123; page#abc') === 'red', `named colors and hex only where they stand alone: ${texts('a { color: red; } .red #red $red --red red-ish x-red &#123; page#abc')}`)
	ok(scan('const red = "#f00"').map(l => l.text).join() === '#f00', 'in code, no keyword colors')
}

// gradients: where each runs and how it mixes (CSS Color 4 #interpolation-space: its `in`, else Oklab, legacy-only
// colors in sRGB); a stop's line takes its gradient's property; url()s are found with or without quotes
{
	const text = 'a { background: linear-gradient(in oklch longer hue, #f00, oklch(0.6 0.2 260) 50%,\n  #00f); }\nb { background: repeating-radial-gradient(circle, #fff 0 10px, #000 10px 20px); }\nc { background: conic-gradient(in rec2020, red, blue); x: url("img/a.png") url(b.jpg) url( \'c.webp\' ) }'
	const g = gradients(text), lits = scan(text, { named: true })
	const stopsOf = k => lits.filter(l => l.start > g[k].start && l.end <= g[k].end)
	ok(g.length === 3 && stopsOf(0).length === 3 && stopsOf(1).length === 2 && stopsOf(2).length === 2, `three gradients, their stops: ${g.map((_, k) => stopsOf(k).length)}`)
	ok(JSON.stringify(mixOf(g[0], stopsOf(0))) === '{"space":"oklch","hue":"longer"}', `in oklch longer hue: ${JSON.stringify(mixOf(g[0], stopsOf(0)))}`)
	ok(JSON.stringify(mixOf(g[1], stopsOf(1))) === '{"space":"rgb","hue":"shorter"}', `legacy colors only: sRGB: ${JSON.stringify(mixOf(g[1], stopsOf(1)))}`)
	ok(mixOf(g[2], stopsOf(2)) === null, 'in rec2020: no mix the library can draw')
	ok(JSON.stringify(mixOf({ in: null, hue: 'shorter' }, [one('#f00'), one('oklch(0.5 0.1 40)')])) === '{"space":"oklab","hue":"shorter"}', 'a modern color among them: Oklab')
	ok(nameAt(text, stopsOf(0)[2].start) === 'background' && nameAt(text, stopsOf(0)[0].start) === 'background', 'a stop on its own line is named by its declaration, as one on the gradient\'s line')
	const multi = 'a {\n  background:\n    url(x.png),\n    linear-gradient(#fff, #000);\n}', after = 'a { color: red; }\n#fff'
	ok(nameAt(multi, multi.indexOf('#fff')) === 'background' && nameAt(after, after.indexOf('#fff')) === '', 'a value over several lines takes its declaration\'s property; text after a declaration\'s end takes none')
	ok(urls(text).map(u => u.ref).join() === 'img/a.png,b.jpg,c.webp', `url()s: ${urls(text).map(u => u.ref)}`)
	ok(gradients('linear-gradient(#f00, #00f').length === 0, 'an unclosed gradient (still being typed) is none')
}

// a gradient's line: mixed in its space, a hue along its method (CSS Color 4 #hue-interpolation: from 50° to 330°,
// shorter and decreasing pass 10°, longer and increasing 190°), a powerless hue taken from the other stop (#powerless)
{
	const c = (L, C, h) => { const v = space.oklch.p3(L, C, h); return { r: v[0], g: v[1], b: v[2] } }
	const mid = (hue, a, b) => { const m = mixer({ space: 'oklch', hue }, 'p3', 1)(a, b, 0.5); return space.p3.oklch(m.r, m.g, m.b) }
	const hues = ['shorter', 'longer', 'increasing', 'decreasing'].map(h => Math.round(mid(h, c(0.7, 0.1, 50), c(0.7, 0.1, 330))[2]))
	ok(hues.join() === '10,190,190,10', `hue methods from 50° to 330°: ${hues}`)
	const gray = mid('shorter', c(0.9, 0, 0), c(0.5, 0.15, 250))
	ok(Math.abs(gray[2] - 250) < 0.5, `a gray stop takes the other's hue: ${gray[2].toFixed(1)}`)
	const lin = mixer({ space: 'oklab' }, 'rgb', 255)({ r: 1, g: 0, b: 0 }, { r: 0, g: 0, b: 1 }, 0.5), [a1, b1] = [space.rgb.oklab(255, 0, 0), space.rgb.oklab(0, 0, 255)]
	ok(deltaEOK(space.rgb.oklab(lin.r * 255, lin.g * 255, lin.b * 255), a1.map((v, i) => (v + b1[i]) / 2)) < 1e-6, 'in Oklab, the middle is the Oklab mean (to the library\'s round-trip precision)')
	ok(mixer(undefined, 'rgb', 255)({ r: 0, g: 0, b: 0 }, { r: 1, g: 0.5, b: 0 }, 0.5).g === 0.25 && mixer(null, 'rgb', 255) === null, 'no mix named: the file\'s RGB, as Figma; null: none')
}

// colors beyond CSS (code.js, data.js, ase.js): each read as its platform's documentation defines it, written back
// unchanged as the same text, and an edit read back as the color written
{
	const read = (text, lang, path) => [...scanCode(text, lang, { shaders: 'srgb' }), ...scanData(text, lang, path)].sort((a, b) => a.start - b.start)
	const v = l => [...l.v.map(x => +x.toFixed(3)), +l.alpha.toFixed(3)].join(' ')
	const cases = [
		// [language, path, text, the values read (library units, then alpha) per literal, in order]
		// Flutter Color(int): "Bits 24-31 are the alpha value, bits 16-23 red" (api.flutter.dev/flutter/dart-ui/Color/Color.html)
		['dart', 'a.dart', 'final c = Color(0x8042A5F5); final d = Color.fromARGB(128, 255, 0, 0); final e = Color.fromRGBO(66, 165, 245, 0.5);', ['66 165 245 0.502', '255 0 0 0.502', '66 165 245 0.5']],
		// three.js Color(0xRRGGBB); a 0x number beside no color word is a number; Godot Color.hex(0xRRGGBBAA) is RGBA (docs.godotengine.org Color.hex)
		['javascript', 'a.js', 'const c = new THREE.Color(0xff8000); mat.color.setHex(0x00FF00); const mask = 0xff00ff;', ['255 128 0 1', '0 255 0 1']],
		['gdscript', 'a.gd', 'var a = Color.hex(0xFF800080); var b = Color(0.5, 0.2, 0.1, 1.0); var c = Color8(255, 128, 0); var d = Color(1, 0, 0)', ['255 128 0 0.502', '127.5 51 25.5 1', '255 128 0 1', '255 0 0 1']],
		// Alacritty's TOML: quoted '0xRRGGBB'; an unquoted 0x number isn't a color
		['toml', 'alacritty.toml', "background = '0x1d1f21'\nflags = 0xffffff", ['29 31 33 1']],
		// SwiftUI Color(red:green:blue:) is sRGB, Color(.displayP3, …) P3, Color(hue:…) HSB (developer.apple.com/documentation/swiftui/color);
		// UIColor(red:…) extended sRGB; NSColor(red:…) names no fixed space: not read
		['swift', 'a.swift', 'Color(red: 0.5, green: 0.2, blue: 0.1); Color(.displayP3, red: 1, green: 0, blue: 0, opacity: 0.5); UIColor(red: 51/255, green: 102/255.0, blue: 1, alpha: 1); Color(hue: 0.6, saturation: 0.5, brightness: 0.9); NSColor(red: 1, green: 0, blue: 0, alpha: 1); NSColor(srgbRed: 0, green: 1, blue: 0, alpha: 1)', ['127.5 51 25.5 1', '1 0 0 0.5', '51 102 255 1', '216 50 90 1', '0 255 0 1']],
		// Jetpack Compose Color(Long) ARGB, Color(Float…) 0–1, Color(Int…) 0–255 (developer.android.com/reference/kotlin/androidx/compose/ui/graphics/package-summary#Color)
		['kotlin', 'a.kt', 'val a = Color(0x8042A5F5); val b = Color(0.5f, 0.2f, 0.1f); val c = Color(255, 128, 0); val d = Color(red = 0.1f, green = 0.2f, blue = 0.3f, alpha = 0.5f); val mask = 0xFFFFFFFF', ['66 165 245 0.502', '127.5 51 25.5 1', '255 128 0 1', '25.5 51 76.5 0.5']],
		// Unity Color is 0–1 floats, Color32 bytes (docs.unity3d.com/ScriptReference/Color.html, Color32.html)
		['csharp', 'a.cs', 'var a = new Color(1, 0.5f, 0); var b = new Color32(255, 128, 0, 128);', ['255 127.5 0 1', '255 128 0 0.502']],
		// Unreal FLinearColor is linear-light, FColor sRGB bytes (dev.epicgames.com: FLinearColor, FColor)
		['cpp', 'a.cpp', 'FLinearColor A(1.0f, 0.5f, 0.0f, 1.0f); FColor B(255, 128, 0, 255); auto C = FColor(255, 128, 0);', ['1 0.5 0 1', '255 128 0 1', '255 128 0 1']],
		// shaders, read as sRGB here (the setting); a vector with a component past 0–1 is a position
		['glsl', 'a.frag', 'vec3 c = vec3(1.0, 0.5, 0.0); vec4 p = vec4(10.0, 2.0, 0.0, 1.0); vec4 d = vec4(0.0, 0.0, 1.0, 0.5);', ['255 127.5 0 1', '0 0 255 0.5']],
		// Xcode color set: components as floats, hex bytes or integer bytes (Asset Catalog Format: Named Color)
		['json', 'Brand.colorset/Contents.json', '{\n  "colors" : [ { "color" : { "color-space" : "display-p3", "components" : { "alpha" : "1.000", "blue" : "0x2E", "green" : "0.420", "red" : "255" } }, "idiom" : "universal" } ]\n}', ['1 0.42 0.18 1']],
		// DTCG 2025.10: colorSpace + components (+ alpha, hex fallback); none is 0 (designtokens.org/tr/2025.10/color)
		['json', 'tokens.json', '{ "brand": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.62, 0.19, 255], "alpha": 0.9, "hex": "#3b82f6" } }, "ink": { "$type": "color", "$value": { "colorSpace": "hsl", "components": ["none", 0, 10] } } }', ['0.62 0.19 255 0.9', '0 0 10 1']],
		// iTerm2: components 0–1 and a Color Space; one without it (the old Calibrated) is skipped
		['xml', 'Theme.itermcolors', '<dict>\n<key>Ansi 0 Color</key>\n<dict>\n<key>Blue Component</key>\n<real>0.2</real>\n<key>Color Space</key>\n<string>P3</string>\n<key>Green Component</key>\n<real>0.4</real>\n<key>Red Component</key>\n<real>0.6</real>\n</dict>\n<key>Old</key>\n<dict>\n<key>Blue Component</key>\n<real>0.2</real>\n<key>Green Component</key>\n<real>0.2</real>\n<key>Red Component</key>\n<real>0.2</real>\n</dict>\n</dict>', ['0.6 0.4 0.2 1']],
		// GIMP palette: R G B 0–255 and a name per line
		['plaintext', 'Tango.gpl', 'GIMP Palette\nName: Tango\nColumns: 3\n#\n252 233  79\tButter 1\n  0   0   0\tBlack\n', ['252 233 79 1', '0 0 0 1']],
	]
	for (const [lang, path, text, want] of cases) {
		const lits = read(text, lang, path), got = lits.map(v)
		ok(JSON.stringify(got) === JSON.stringify(want), `${path}: read ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`)
		for (const l of lits) {
			const p = profileOf([l], 'p3'), same = serialize(l.nt, toDoc(l, p), p, l.alpha, l.text)
			ok(same === l.text, `${path}: ${l.text.slice(0, 60)} written back unchanged: ${same.slice(0, 80)}`)
			// an edit: an sRGB color and alpha 0.5 where the notation has an alpha; read back from the edited text
			const c = { r: 0.2, g: 0.4, b: 0.6 }, edited = text.slice(0, l.start) + serialize(l.nt, c, 'SRGB', 0.5, l.text) + text.slice(l.end)
			const back = read(edited, lang, path).find(x => x.start === l.start)
			const lab = space.rgb.oklab(51, 102, 153), d = back ? deltaEOK(space[back.space].oklab(...back.v), lab) : 1
			ok(back && d < 0.005, `${path}: ${l.text.slice(0, 40)} edited reads back as the color written: ΔEOK ${d.toFixed(4)} in ${back && back.text.slice(0, 80)}`)
		}
	}
	ok(scanData(cases.at(-2)[2], 'xml', 'Theme.itermcolors').skipped === 1, 'the iTerm2 color without a Color Space is counted as skipped')
	ok(scanData(cases[10][2], 'json', 'tokens.json').map(l => l.name).join() === 'brand,ink', 'design tokens are named by their keys')
	// a DTCG edit renews the hex fallback; an unchanged one keeps it as it was
	{
		const [l] = scanData(cases[10][2], 'json', 'tokens.json'), w = serialize(l.nt, { r: 0.2, g: 0.4, b: 0.6 }, 'SRGB', 0.9, l.text)
		ok(/"hex": "#336699"/.test(w) && /"alpha": 0\.9/.test(w), `a DTCG edit renews its hex fallback: ${w}`)
	}
	// Android resource XML (and Color.parseColor in Java/Kotlin) leads with the alpha; the same text in CSS doesn't
	{
		const android = scan('<color name="half_red">#80FF0000</color>', { argb: true })[0], css = scan('#80FF0000')[0]
		ok(v(android) === '255 0 0 0.502' && v(css) === '128 255 0 0', `#80FF0000: Android ARGB ${v(android)}, CSS RGBA ${v(css)}`)
		ok(serialize(android.nt, { r: 0, g: 0, b: 1 }, 'SRGB', 0.5) === '#800000FF', 'and is written back alpha first')
	}
	// shaders: none without the setting
	ok(scanCode('vec3 c = vec3(1.0, 0.5, 0.0);', 'glsl').length === 0, 'shader vectors are colors only when the setting says how to read them')
	// an Adobe Swatch Exchange file: its RGB swatches, the others counted (CMYK here)
	{
		const name = s => [s.length + 1, ...[...s].map(c => c.charCodeAt(0)), 0]
		const block = (nm, model, vals) => { const n = name(nm), len = 2 + (n.length - 1) * 2 + 4 + vals.length * 4 + 2, b = new DataView(new ArrayBuffer(6 + len)); let o = 0
			b.setUint16(o, 1); b.setUint32(o + 2, len); o = 6; b.setUint16(o, n[0]); o += 2; for (const u of n.slice(1)) { b.setUint16(o, u); o += 2 }
			for (const ch of model) b.setUint8(o++, ch.charCodeAt(0)); for (const x of vals) { b.setFloat32(o, x); o += 4 } b.setUint16(o, 2); return new Uint8Array(b.buffer) }
		const head = new DataView(new ArrayBuffer(12)); 'ASEF'.split('').forEach((c, i) => head.setUint8(i, c.charCodeAt(0))); head.setUint16(4, 1); head.setUint16(6, 0); head.setUint32(8, 2)
		const parts = [new Uint8Array(head.buffer), block('Orange', 'RGB ', [1, 0.5, 0]), block('Ink', 'CMYK', [0, 0, 0, 1])]
		const bytes = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { bytes.set(p, o); o += p.length }
		const r = readAse(bytes)
		ok(r && r.colors.length === 1 && r.colors[0].name === 'Orange' && r.colors[0].v.join() === '255,127.5,0' && r.skipped === 1, `an .ase file: its RGB swatch, the CMYK one skipped: ${JSON.stringify(r)}`)
		ok(readAse(new Uint8Array([1, 2, 3])) === null, 'not an .ase file: nothing')
		// malformed and cut short: a block whose name runs past its length, a file ending mid-block – read without a throw
		const bad = bytes.slice(), dvb = new DataView(bad.buffer); dvb.setUint16(18, 999)
		const r2 = readAse(bad), r3 = readAse(bytes.slice(0, 30)), r4 = readAse(bytes.slice(0, 12))
		ok(r2 && r2.colors.length === 0 && r2.skipped === 2 && r3 && r3.colors.length === 0 && r4 && r4.colors.length === 0, `a malformed or cut .ase reads what it can, throws nothing: ${JSON.stringify([r2, r3, r4])}`)
	}
	// the empty and the smallest: no text, no colors, from every reader; one color alone in each format
	{
		ok([['', 'swift'], ['', 'dart'], ['', 'glsl']].every(([t, l]) => scanCode(t, l, { shaders: 'srgb' }).length === 0) && scanData('', 'json', 'tokens.json').length === 0 && scanData('GIMP Palette\n', 'plaintext', 'a.gpl').length === 0, 'empty texts hold no colors')
		ok(scanData('GIMP Palette\n0 0 0', 'plaintext', 'a.gpl').length === 1 && scanCode('Color(red: 0, green: 0, blue: 0)', 'swift').length === 1 && scanCode('color = 0x000000', 'python').length === 1, 'one color alone is read: a nameless GIMP line, a Swift call, a 0x number')
	}
}

/* ---------- 2. the extension ---------- */

const executablePath = [process.env.CHROME_PATH, chromium.executablePath(), '/usr/bin/google-chrome'].find(p => p && existsSync(p))
if (!executablePath) throw new Error('Chromium is not installed; run `npx playwright install chromium` or set CHROME_PATH')
const browser = await chromium.launch({ headless: true, executablePath })
const ORIGIN = 'http://localhost:9'
const WEB = fileURLToPath(new URL('../web/', import.meta.url))   // a stylesheet there names web/img/ by relative url()
// a few of VS Code's theme variables, as the workbench sets them on a webview's <html> (Dark Modern and Light Modern)
const THEMES = {
	dark: ['vscode-dark', { 'sideBar-background': '#181818', 'input-background': '#313131', foreground: '#cccccc', descriptionForeground: '#9d9d9d', 'dropdown-border': '#3c3c3c', 'input-border': '#3c3c3c', focusBorder: '#0078d4', 'font-family': '-apple-system, BlinkMacSystemFont, sans-serif' }],
	light: ['vscode-light', { 'sideBar-background': '#f8f8f8', 'input-background': '#ffffff', foreground: '#3b3b3b', descriptionForeground: '#3b3b3b', 'dropdown-border': '#cecece', 'input-border': '#cecece', focusBorder: '#005fb8', 'font-family': '-apple-system, BlinkMacSystemFont, sans-serif' }],
}

const until = async (f, ms = 3000) => { const t = Date.now(); while (!(await f())) { if (Date.now() - t > ms) return false; await new Promise(r => setTimeout(r, 15)) } return true }

async function session({ text, theme = 'dark', uri = `file://${WEB}a.css`, languageId, selections, state = {} }) {
	const m = mock()
	const ext = requireWith(dir + 'dist/extension.cjs', m.vscode)
	const store = new Map(Object.entries(state))
	const ctx = { subscriptions: [], asAbsolutePath: p => dir + p, globalState: { get: k => store.get(k), update: async (k, v) => { store.set(k, v) } }, extension: { packageJSON: pkg } }
	m.open(text, { uri, languageId, selections })
	ext.activate(ctx)
	m.log.providers['colorSpace.picker'].resolveWebviewView(m.view)
	const context = await browser.newContext({ viewport: { width: 300, height: 900 } })
	const page = await context.newPage()
	const errors = [], fromUI = [], toUI = []
	page.on('pageerror', e => errors.push(e.message))
	page.on('console', msg => { if (msg.type() === 'error' && !/Permissions policy violation: The Clipboard API/.test(msg.text())) errors.push(msg.text()) })
	await page.exposeFunction('__toHost', msg => { fromUI.push(msg.pluginMessage); m.view.receive(msg) })
	await page.addInitScript(() => { let given = false; window.acquireVsCodeApi = () => { if (given) throw new Error('acquireVsCodeApi: called twice'); given = true; return { postMessage: m => window.__toHost(m), getState() {}, setState() {} } } })
	// VS Code hands a webview typed arrays as they are; through page.evaluate they travel as plain arrays, made bytes again
	m.view.bridge = { toPage: msg => { toUI.push(msg.pluginMessage); const pm = msg.pluginMessage, b = pm.bytes; page.evaluate(([d, b]) => { if (b) d.pluginMessage.bytes = new Uint8Array(b); window.dispatchEvent(new MessageEvent('message', { data: d })) }, [b ? { pluginMessage: { ...pm, bytes: null } } : msg, b ? [...b] : null]).catch(() => {}) } }
	const [cls, vars] = THEMES[theme]
	const html = m.view.webview.html
		.replace('<html lang="en">', `<html lang="en" style="${Object.entries(vars).map(([k, v]) => `--vscode-${k}:${v}`).join(';')}">`)
		.replace('<body>', `<body class="${cls}">`)
	await page.route(ORIGIN + '/**', route => route.fulfill({ contentType: 'text/html', body: html }))
	await page.goto(`${ORIGIN}/?cb=${Date.now()}`)
	await until(() => toUI.some(x => x.type === 'selection'))
	await page.waitForTimeout(80)
	const sel = () => toUI.filter(x => x.type === 'selection')
	return { m, page, errors, toUI, store, sel, line: n => m.editor.document.lines[n], close: () => context.close() }
}
const inputs = page => page.locator('#channels .cv:not([data-i="a"])')
const shown = async page => (await inputs(page).evaluateAll(els => els.map(e => e.value))).map(Number)
const held = async page => (await page.locator('#channels .nrg:not([data-i="a"])').evaluateAll(els => els.map(e => e.getAttribute('aria-valuenow')))).map(Number)   // the coordinates held, unrounded
const pressed = page => page.locator('#paints .paint[aria-pressed="true"] .pn').innerText()
async function type(s, i, value) {
	const n = s.sel().length, w = s.m.log.edits.length
	const f = i === 'a' ? s.page.locator('#channels .cv[data-i="a"]') : inputs(s.page).nth(i)
	await f.fill(String(value))
	await f.press('Tab')
	await until(() => s.m.log.edits.length > w && s.sel().length > n)
	await s.page.waitForTimeout(40)
}
async function moveTo(s, line, ch) {
	const n = s.sel().length
	s.m.select([line, ch, line, ch])
	await until(() => s.sel().length > n)
	await s.page.waitForTimeout(60)
}
async function useSpace(page, id) {
	await page.locator('#spbtn').click()
	await page.locator('#spq').fill(id)
	await page.locator(`#splist .spo[data-id="${id}"]`).first().click()
	await page.waitForTimeout(60)
}
// the line a gradient draws on the plane, as points (0..100 across and down), per polyline
const polylines = page => page.locator('#marks svg.links polyline').evaluateAll(els => els.map(e => e.getAttribute('points').split(' ').map(p => p.split(',').map(Number))))
// how far a run of points strays from the chord between its ends, in plane percent
const bow = pts => { const [a, b] = [pts[0], pts.at(-1)], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return Math.max(...pts.map(p => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / d)) }

try {
	const CSS = [
		'a { color: oklch(0.7 0.15 40); }',
		'b { background: #ff8000; border: 1px solid rgba(0, 128, 255, 0.5); }',
		'c { fill: oklch(0.7 0.35 150); }',
		'd { background: linear-gradient(in oklab, #ff0000, oklch(0.6 0.2 260) 50%,',
		'  #00c000); }',
		'e { background: url(img/locus-64.png) no-repeat, linear-gradient(#ff0000, #0000ff); }',
		'f { background: conic-gradient(in rec2020, #fff, #000); }',
	].join('\n')

	{
		const s = await session({ text: CSS, selections: [[0, 14, 0, 14]] })
		// the overview: every color target of the document, the one under the cursor current
		const last = s.sel().at(-1)
		ok(last.paints.length === 11 && last.paints.filter(p => p.current).length === 1 && last.paints[0].current, `the document's 11 literals, the cursor's current: ${last.paints.length}`)
		ok(last.profile === 'DISPLAY_P3' && last.editable === true && last.images.length === 1 && last.images[0].name === 'locus-64.png', `P3, editable, one image: ${JSON.stringify(last.images)}`)
		ok(await s.page.locator('#paints .paint').count() === 10 && await pressed(s.page) === 'color', 'the palette: a swatch per color (the two #ff0000 are one), the current one pressed')
		ok(await s.page.locator('#paints .paint', { hasText: 'line 4, stop 1' }).getAttribute('data-tip') === 'background, line 4, stop 1\nbackground, line 6, stop 1', 'a color used twice: one swatch, its tooltip naming both uses')
		ok(await s.page.locator('#paints .paint[aria-pressed="true"]').getAttribute('data-tip') === 'color\nline 1', 'its tooltip: what it sets, and its line')
		ok(s.m.log.marked?.length === 1 && s.m.log.marked[0].start.line === 0 && s.m.log.marked[0].start.character === 11, 'the current literal is outlined in the editor')
		ok(await s.page.locator('#spbtn').getAttribute('data-id') === 'oklch', 'the panel opens in OKLCH')
		const v = await shown(s.page)
		ok(Math.abs(v[0] - 0.7) < 1e-3 && Math.abs(v[1] - 0.15) < 1e-3 && Math.abs(v[2] - 40) < 0.05, `the literal's values: ${v}`)
		ok(await s.page.locator('#badge').textContent() === 'P3' && /^In Display P3/.test(await s.page.locator('#gamut').innerText()), 'the badge and the gamut status')
		ok(/^In Display P3\.\nEdits are written inside Display P3\nDots are the other colors and image pixels\.$/.test(await s.page.locator('#badge').getAttribute('data-tip')), `the badge's breakdown, in VS Code's words: ${JSON.stringify(await s.page.locator('#badge').getAttribute('data-tip'))}`)
		ok(await s.page.locator('#grip').isHidden(), 'no size grip: the sidebar sets the width')
		ok(!(await s.page.content()).includes('font-family:Inter;') && /-apple-system/.test(await s.page.evaluate(() => getComputedStyle(document.body).fontFamily)), 'VS Code: the workbench\'s face, Inter not bundled')
		ok(await s.page.locator('#marks .dm').count() >= 5, `the other colors are dots: ${await s.page.locator('#marks .dm').count()}`)
		// the image a url() names: its pixels read, as histograms along the bars
		ok(await until(() => s.page.locator('#channels .hist').evaluateAll(els => els.some(e => !e.hidden)), 5000), 'the url() image\'s pixels: histograms on the bars')

		// a typed value: one write in the literal's notation, one undo step
		await type(s, 0, 0.6)
		ok(s.line(0) === 'a { color: oklch(0.6 0.15 40); }', `typed L = 0.6 writes oklch(0.6 0.15 40): ${s.line(0)}`)
		const e = s.m.log.edits.at(-1)
		ok(e.before === true && e.after === true, `a typed value is one undo step: ${JSON.stringify(e)}`)

		// a drag on the plane: live writes, then the release – one undo step, its stops only at its ends
		const w0 = s.m.log.edits.length, pb = await s.page.locator('#plane').boundingBox()
		await s.page.mouse.move(pb.x + pb.width * 0.3, pb.y + pb.height * 0.3)
		await s.page.mouse.down()
		for (let k = 1; k <= 6; k++) { await s.page.mouse.move(pb.x + pb.width * (0.3 + k * 0.04), pb.y + pb.height * (0.3 + k * 0.02)); await s.page.waitForTimeout(30) }
		await s.page.mouse.up()
		await until(() => s.m.log.edits.length > w0 && s.m.log.edits.at(-1).after)
		await s.page.waitForTimeout(60)
		const g = s.m.log.edits.slice(w0)
		ok(g.length >= 3 && g[0].before && !g[0].after && g.slice(1, -1).every(x => !x.before && !x.after) && !g.at(-1).before && g.at(-1).after, `a drag is one undo step: ${g.map(x => `${+x.before}${+x.after}`).join(' ')}`)
		const lit = scan(s.line(0))[0]
		ok(lit && lit.nt.fn === 'oklch' && s.line(0).startsWith('a { color: oklch(') && s.line(0).endsWith('); }'), `the drag writes an oklch() in place: ${s.line(0)}`)
		const p3 = space.oklch.p3(...lit.v)
		ok(p3.every(x => x >= -1e-3 && x <= 1 + 1e-3), `the dragged color is inside Display P3: ${p3.map(x => x.toFixed(4))}`)

		await useSpace(s.page, 'hct')
		await until(() => s.store.get('pref.space') === 'hct')
		ok(s.store.get('pref.space') === 'hct', 'the chosen space is stored')

		// the cursor moves to #ff8000: the panel follows it; a #hex edits in sRGB and stays #hex
		await moveTo(s, 1, 20)
		ok(await pressed(s.page) === 'background', `the cursor's literal becomes current: ${await pressed(s.page)}`)
		ok(s.sel().at(-1).profile === 'SRGB' && await s.page.locator('#badge').textContent() === 'sRGB', `a #hex literal edits in sRGB: ${s.sel().at(-1).profile} ${await s.page.locator('#badge').textContent()}`)
		await useSpace(s.page, 'oklch')
		const before = await held(s.page)
		await type(s, 2, 200)
		const hx = scan(s.line(1))[0].text
		const exp = '#' + gamutMap([before[0], before[1], 200], DEST.rgb).rgb.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
		ok(hx === exp, `H = 200 on #ff8000 writes the gamut-mapped #hex: ${hx}, expected ${exp}`)

		// legacy rgba(): its commas and its alpha; the opacity field sets the alpha
		await moveTo(s, 1, 55)
		ok(await s.page.locator('#channels .cv[data-i="a"]').inputValue() === '50', 'rgba(…, 0.5) shows opacity 50')
		await type(s, 'a', 25)
		ok(/border: 1px solid rgba\(0, 128, 255, 0\.25\);/.test(s.line(1)), `opacity 25 writes rgba(0, 128, 255, 0.25): ${s.line(1)}`)

		// a wider literal than the gamut: read exactly, said to be outside, not written until edited
		const kept = s.line(2)
		await moveTo(s, 2, 14)
		const v2 = await shown(s.page)
		ok(Math.abs(v2[0] - 0.7) < 1e-3 && Math.abs(v2[1] - 0.35) < 1e-3 && Math.abs(v2[2] - 150) < 0.05, `oklch(0.7 0.35 150) reads exactly: ${v2}`)
		ok(/^Outside Display P3/.test(await s.page.locator('#gamut').innerText()), `and is said to be outside Display P3: ${await s.page.locator('#gamut').innerText()}`)
		ok(s.line(2) === kept, 'reading writes nothing')

		// the gamut setting: sRGB
		let n = s.sel().length
		s.m.setGamut('srgb')
		await until(() => s.sel().length > n)
		ok(s.sel().at(-1).profile === 'SRGB', 'colorSpace.gamut = srgb reads oklch() in sRGB')
		n = s.sel().length
		s.m.setGamut('p3')
		await until(() => s.sel().length > n)

		// a paint chosen in the panel: the editor goes to its literal
		await moveTo(s, 0, 14)
		const r0 = s.m.log.revealed.length
		await s.page.locator('#paints .paint').nth(2).click()
		await until(() => s.m.log.revealed.length > r0)
		const sel0 = s.m.editor.selection.start
		ok(sel0.line === 1 && sel0.character === s.line(1).indexOf('rgba('), `choosing the third row brings the cursor to its rgba(): ${sel0.line}:${sel0.character}`)
		ok(await pressed(s.page) === 'border', 'and it stays current')
		ok(s.m.log.marked?.[0]?.start.line === 1 && s.m.log.marked[0].start.character === sel0.character, 'and is outlined in the editor')
		// a dot on the plane: the same – the editor goes to its literal
		const d0 = s.m.log.revealed.length
		await s.page.locator('#marks .dm').first().dispatchEvent('pointerdown', { button: 0, pointerId: 1 })
		await until(() => s.m.log.revealed.length > d0)
		ok(s.m.log.revealed.length > d0, 'a dot on the plane brings the editor to its literal')
		await s.page.mouse.up()
		await moveTo(s, 1, sel0.character)

		// gradients: their stops, named by the gradient's property, mixed in its space
		const stops = s.sel().at(-1).paints.filter(p => p.id === s.sel().at(-1).paints.find(q => q.stop === 2)?.id)
		ok(stops.length === 3 && stops.every(p => p.name === 'background' && p.index === 3 && JSON.stringify(p.mix) === '{"space":"oklab","hue":"shorter"}'), `the multi-line gradient: 3 stops on line 4, in oklab: ${JSON.stringify(stops.map(p => [p.name, p.index, p.stop, p.mix]))}`)
		ok(s.sel().at(-1).paints.filter(p => p.mix === null).length === 2, 'the rec2020 gradient: stops, but no line')
		await moveTo(s, 3, 55)
		await useSpace(s.page, 'oklab')
		const lines = await polylines(s.page)
		// on OKLab's a × b plane a gradient mixed in OKLab runs straight between its stops; one mixed in sRGB bends
		const runs = lines.map(pts => [pts.slice(0, 25), pts.slice(24)])
		ok(lines.length === 2, `two gradients drawn (rec2020's not): ${lines.length}`)
		const [okRun, srgbRun] = lines.map(pts => bow(pts.slice(0, 25)))
		ok(okRun < 0.3, `the oklab gradient is straight on the a × b plane: strays ${okRun.toFixed(2)}%`)
		ok(srgbRun > 2, `the sRGB one bends: strays ${srgbRun.toFixed(2)}%`)
		// a stop edited: its own literal, the gradient's others untouched
		const kept3 = s.line(4)
		await useSpace(s.page, 'oklch')
		await type(s, 0, 0.5)
		ok(/linear-gradient\(in oklab, #ff0000, oklch\(0\.5 0\.2 260\) 50%,$/.test(s.line(3)) && s.line(4) === kept3, `the middle stop: ${s.line(3)}`)

		// a color used twice is one swatch: an edit writes both literals, in one edit, each in its own notation
		await moveTo(s, 3, 44)
		await type(s, 0, 0.5)
		const both = s.m.log.edits.at(-1)
		ok(both.reps.length === 2 && both.reps.every(r => r.text.startsWith('#')) && new Set(both.reps.map(r => r.text)).size === 1 && both.before && both.after, `the two #ff0000 written as one, one undo step: ${JSON.stringify(both.reps)}`)
		// fold: --brand's swatch dropped onto the rgba() border's – --brand takes its color, in its own notation (oklch), and
		// the two are one swatch
		const nS = await s.page.locator('#paints .paint').count(), w1 = s.m.log.edits.length
		const [fa, fb] = [await s.page.locator('#paints .paint').first().boundingBox(), await s.page.locator('#paints .paint', { hasText: 'border' }).boundingBox()]
		await s.page.mouse.move(fa.x + fa.width / 2, fa.y + fa.height / 2); await s.page.mouse.down()
		await s.page.mouse.move(fa.x + fa.width / 2 + 3, fa.y + fa.height / 2, { steps: 2 }); await s.page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2, { steps: 6 })
		await s.page.mouse.up()
		await until(() => s.m.log.edits.length > w1)
		await s.page.waitForTimeout(80)
		const folded = scan(s.line(0))[0], border = scan(s.line(1)).find(l => l.nt.fn === 'rgb')
		ok(folded && folded.nt.fn === 'oklch' && border && deltaEOK(space.oklch.oklab(...folded.v), space.rgb.oklab(...border.v)) < 0.005 && Math.abs(folded.alpha - border.alpha) < 0.002, `folded: line 1 takes the border's color as an oklch(): ${s.line(0)} vs ${s.line(1)}`)
		ok(await s.page.locator('#paints .paint').count() === nS - 1, `and the palette has one swatch fewer (${nS} → ${await s.page.locator('#paints .paint').count()})`)
		// a drag that lands on no other swatch – onto itself, or off the palette – folds nothing
		const w2 = s.m.log.edits.length, fc = await s.page.locator('#paints .paint').first().boundingBox()
		for (const [x, y] of [[fc.x + fc.width / 2 + 1, fc.y + fc.height / 2], [fc.x + fc.width / 2, fc.y + 200]]) {
			await s.page.mouse.move(fc.x + fc.width / 2, fc.y + fc.height / 2); await s.page.mouse.down()
			await s.page.mouse.move(fc.x + fc.width / 2 + 6, fc.y + fc.height / 2, { steps: 2 }); await s.page.mouse.move(x, y, { steps: 4 }); await s.page.mouse.up()
		}
		await s.page.waitForTimeout(80)
		ok(s.m.log.edits.length === w2 && await s.page.locator('#paints .paint.lift, #paints .paint.drop').count() === 0, 'a drag onto itself or off the palette folds nothing, and leaves no lifted or marked swatch')

		// a range: only the literals inside it, as rows and dots; the url() outside it isn't read
		n = s.sel().length
		s.m.select([0, 0, 2, 30])
		await until(() => s.sel().length > n)
		await s.page.waitForTimeout(80)
		ok(s.sel().at(-1).paints.length === 4 && await s.page.locator('#paints .paint').count() === 3 && s.sel().at(-1).images.length === 0, `a selected range: its 4 literals – 3 swatches, line 1 folded into the border above – no image (${s.sel().at(-1).paints.length})`)
		ok(JSON.stringify(s.sel().at(-1).paints.map(p => p.name)) === '["color","background","border","fill"]', `named by their properties: ${s.sel().at(-1).paints.map(p => p.name)}`)
		if (process.env.VSCODE_SHOTS) await s.page.screenshot({ path: `${process.env.VSCODE_SHOTS}/vscode-dark.png`, fullPage: true })

		// the hover: the literal in OKLCH, P3 and hex, its gamut, the link to the panel
		const h = s.m.log.hover.provideHover(s.m.editor.document, new s.m.vscode.Position(2, 16))
		ok(h && /color\(display-p3/.test(h.contents.value) && /#[0-9a-f]{6}/.test(h.contents.value) && /Outside Display P3/.test(h.contents.value) && /command:colorSpace\.pick\?/.test(h.contents.value), `hover: ${h && h.contents.value}`)
		ok(!s.m.log.hover.provideHover(s.m.editor.document, new s.m.vscode.Position(0, 2)), 'no hover off a color')
		await s.m.log.commands['colorSpace.pick']({ uri: `file://${WEB}a.css`, line: 2, character: 12 })
		ok(s.m.editor.selection.start.line === 2 && s.m.editor.selection.start.character === 12 && s.m.log.opened.includes('colorSpace.picker.focus'), 'Pick Color moves the cursor and focuses the panel')

		// Convert Color To…: the selected literals rewritten
		s.m.select([1, 0, 1, 80])
		s.m.log.pickAnswer = i => i.fn === 'oklch'
		await s.m.log.commands['colorSpace.convert']()
		const conv = scan(s.line(1))
		ok(conv.length === 2 && conv.every(l => l.nt.fn === 'oklch') && /\/ 0\.25\)/.test(s.line(1)), `Convert to OKLCH rewrites both, alpha kept: ${s.line(1)}`)
		ok(s.m.log.quickPick.items.length === 9, 'the formats offered: the panel\'s nine')

		// an image open in its own tab: its pixels, no paint to edit
		n = s.sel().length
		s.m.setTab(`file://${WEB}img/jungle.jpg`)
		await until(() => s.sel().length > n)
		ok(s.sel().at(-1).paints.length === 0 && s.sel().at(-1).images[0]?.name === 'jungle.jpg', 'an open image: its pixels, no literals')
		ok(await until(() => s.page.locator('#paints .paint').count().then(c => c === 1)) && /pixels are shown here/.test(await s.page.locator('#notes').innerText()), `its color stands in, not editable: ${await s.page.locator('#notes').innerText()}`)
		n = s.sel().length
		s.m.setTab(null)
		await until(() => s.sel().length > n)
		ok(s.sel().at(-1).paints.length === 2, 'back to the document: the range on line 2, its two literals')

		// the MCP server: the bundled mcp.js, run by the editor's own Node
		const defs = s.m.log.mcp.p.provideMcpServerDefinitions()
		ok(s.m.log.mcp.id === 'colorSpace.mcp' && pkg.contributes.mcpServerDefinitionProviders[0].id === 'colorSpace.mcp', 'the MCP provider is the one package.json declares')
		ok(defs[0].command === process.execPath && defs[0].args[0] === dir + 'dist/mcp.mjs' && defs[0].env.ELECTRON_RUN_AS_NODE === '1', `MCP definition: ${JSON.stringify(defs[0])}`)
		const reply = await new Promise((resolve, reject) => {
			const p = spawn(defs[0].command, defs[0].args, { env: { ...process.env, ...defs[0].env } })
			let out = ''
			p.stdout.on('data', d => { out += d; if (out.includes('\n')) { p.kill(); resolve(out) } })
			p.on('error', reject)
			p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n')
			setTimeout(() => { p.kill(); resolve(out) }, 5000)
		})
		ok(/"name":"convert"/.test(reply), `the bundled MCP server lists its tools: ${reply.slice(0, 120)}`)

		ok(!s.errors.length, `page errors: ${s.errors.join(' | ')}`)
		await s.close()
	}

	// error paths: a url() to a missing file is listed, answered with no bytes, and breaks nothing; a write or a choice
	// naming a literal the document no longer holds where it was read (text changed under the panel, no read since)
	// writes nothing and moves nothing; a key never sent is ignored
	{
		const s = await session({ text: 'a { background: url(img/missing.png); color: #112233; border-color: #445566; }', selections: [[0, 50, 0, 50]] })
		const img = s.sel().at(-1).images[0]
		ok(img && img.name === 'missing.png', 'a url() to a missing file is listed')
		ok(await until(() => s.toUI.some(x => x.type === 'image' && x.hash === img.hash && x.bytes === null)), 'and answered with no bytes')
		const last = s.sel().at(-1), p0 = last.paints[0], w = s.m.log.edits.length, r = s.m.log.revealed.length
		s.m.editor.document.lines[0] = 'a { background: url(img/missing.png); color: #000000; border-color: #445566; }'   // changed under the panel
		await s.m.view.receive({ pluginMessage: { type: 'set', id: p0.id, kind: 'fills', index: p0.index, stop: -1, profile: last.profile, color: { r: 1, g: 0, b: 0 }, opacity: 1, commit: true, seq: 99 } })
		await s.m.view.receive({ pluginMessage: { type: 'choose', id: 'c7', stop: -1 } })
		await s.m.view.receive({ pluginMessage: { type: 'set', id: 'c7', stop: -1, profile: last.profile, color: { r: 1, g: 0, b: 0 }, opacity: 1, commit: true, seq: 100 } })
		ok(s.m.log.edits.slice(w).every(e => !e.reps.length) && s.m.editor.document.lines[0].includes('#000000; border-color: #445566'), `a stale or unknown key writes nothing: ${JSON.stringify(s.m.log.edits.slice(w))}`)
		ok(s.m.log.revealed.length === r, 'and an unknown key reveals nothing')
		await s.page.waitForTimeout(100)
		ok(!s.errors.length, `missing image page errors: ${s.errors.join(' | ')}`)
		await s.close()
	}

	// colors in code and in a binary swatch file, through the extension: a Swift file's calls are its palette, an edit
	// keeps the call's form; an .ase file opened in a tab shows its swatches, read-only, the CMYK one counted
	{
		const s = await session({ text: 'let brand = Color(.displayP3, red: 1, green: 0.4, blue: 0)\nlet ink = UIColor(red: 51/255, green: 51/255, blue: 51/255, alpha: 1)\nlet accent = Color(red: 1, green: 0.5, blue: 0)', uri: `file://${WEB}a.swift`, languageId: 'swift', selections: [[0, 20, 0, 20]] })
		ok(JSON.stringify(s.sel().at(-1).paints.map(p => p.name)) === '["brand","ink","accent"]' && s.sel().at(-1).profile === 'DISPLAY_P3', `a Swift file's colors, the P3 one current: ${JSON.stringify(s.sel().at(-1).paints.map(p => p.name))} ${s.sel().at(-1).profile}`)
		await type(s, 0, 0.5)
		ok(/^let brand = Color\(\.displayP3, red: [\d.]+, green: [\d.]+, blue: [\d.]+\)$/.test(s.line(0)), `an edit keeps the call: ${s.line(0)}`)
		const tmp = mkdtempSync(join(tmpdir(), 'cs-ase-')), file = join(tmp, 'swatches.ase')
		const u16 = (dv, o, x) => dv.setUint16(o, x), body = (nm, model, vals) => { const len = 2 + (nm.length + 1) * 2 + 4 + vals.length * 4 + 2, dv = new DataView(new ArrayBuffer(6 + len)); let o = 0
			u16(dv, 0, 1); dv.setUint32(2, len); o = 6; u16(dv, o, nm.length + 1); o += 2; for (const c of nm) { u16(dv, o, c.charCodeAt(0)); o += 2 } o += 2
			for (const c of model) dv.setUint8(o++, c.charCodeAt(0)); for (const x of vals) { dv.setFloat32(o, x); o += 4 } u16(dv, o, 2); return Buffer.from(dv.buffer) }
		const head = Buffer.alloc(12); head.write('ASEF', 0, 'ascii'); head.writeUInt16BE(1, 4); head.writeUInt32BE(2, 8)
		writeFileSync(file, Buffer.concat([head, body('Sky', 'RGB ', [0.2, 0.6, 1]), body('Ink', 'CMYK', [0, 0, 0, 1])]))
		const n = s.sel().length
		s.m.setTab(`file://${file}`)
		await until(() => s.sel().at(-1).paints.length === 1 && s.sel().length > n + 1)
		const sel = s.sel().at(-1)
		ok(sel.paints[0].name === 'Sky' && sel.paints[0].where === 'swatch 1' && sel.editable === false && sel.mixed === 1, `an .ase file: its RGB swatch, read-only, one skipped: ${JSON.stringify(sel).slice(0, 200)}`)
		ok(/aren't read/.test(await s.page.locator('#notes').innerText()) && /read-only/.test(await s.page.locator('#notes').innerText()), `the panel says what's skipped and that it can't edit: ${await s.page.locator('#notes').innerText()}`)
		rmSync(tmp, { recursive: true, force: true })
		ok(!s.errors.length, `swift/ase page errors: ${s.errors.join(' | ')}`)
		await s.close()
	}

	// an image in a data: URL is read too
	{
		const b64 = readFileSync(WEB + 'img/locus-64.png').toString('base64')
		const s = await session({ text: `a { background: url(data:image/png;base64,${b64}); color: #123456; }` })
		ok(s.sel().at(-1).images.length === 1 && s.sel().at(-1).images[0].name === 'data: URL', 'a data: URL image is listed')
		ok(await until(() => s.page.locator('#channels .hist').evaluateAll(els => els.some(e => !e.hidden)), 5000), 'and its pixels read')
		ok(!s.errors.length, `data: URL page errors: ${s.errors.join(' | ')}`)
		await s.close()
	}

	// a read-only document: the panel reads it and says so; nothing is written
	{
		const s = await session({ text: CSS, uri: 'git:/a.css', selections: [[0, 14, 0, 14]], theme: 'light' })
		ok(s.sel().at(-1).editable === false && /read-only/.test(await s.page.locator('#notes').innerText()), `read-only: ${await s.page.locator('#notes').innerText()}`)
		ok(await inputs(s.page).first().evaluate(e => e.readOnly), 'its fields are read-only')
		if (process.env.VSCODE_SHOTS) await s.page.screenshot({ path: `${process.env.VSCODE_SHOTS}/vscode-light.png`, fullPage: true })
		ok(!s.errors.length, `read-only page errors: ${s.errors.join(' | ')}`)
		await s.close()
	}

	// a stored space opens the panel in it; a document without colors: the hint
	{
		const s = await session({ text: 'nothing here', state: { 'pref.space': 'cam16' } })
		ok(await s.page.locator('#spbtn').getAttribute('data-id') === 'cam16', 'the stored space opens')
		ok(await s.page.locator('#empty').isVisible() && /No colors here/.test(await s.page.locator('#empty').innerText()), `the empty hint: ${await s.page.locator('#empty').innerText()}`)
		ok(!s.errors.length, `empty page errors: ${s.errors.join(' | ')}`)
		await s.close()
	}
} finally {
	await browser.close()
}

for (const f of failures) console.log('not ok -', f)
console.log(`\n${passed} passed, ${failures.length} failed`)
process.exit(failures.length ? 1 : 0)
