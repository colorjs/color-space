#!/usr/bin/env node
/**
 * The atlas's icons as a font: every glyph in web/js/icons.js (the filled 16-grid family and the
 * stroked 24-grid one) compiled into a TrueType font, with no dependency. A font reaches where an
 * SVG can't: an <option> in a native select, a canvas label, a terminal, another tool's UI.
 *
 * Each icon keeps one codepoint. The lens icons sit on Unicode symbols that look like them
 * (▥ 10-step, ☰ Tailwind, △ P3…), so wherever the font isn't used – a list the operating system
 * draws itself – the system's own symbol stands in; the rest live in the Private Use Area.
 *
 * Geometry: the SVG elements are flattened to polygons (curves and arcs by subdivision); a stroke
 * becomes its segments as rectangles plus a disc at every vertex (round joins and caps), all wound
 * alike so the nonzero rule unions them; a paper-filled element cuts a hole. A font is one color:
 * opacity is dropped, except that a faint element covering much of the box (a backdrop) is drawn
 * as its outline, a faint stroke is drawn thinner, and a gradient fill becomes a ramp that widens
 * toward its opaque end.
 *
 *   node scripts/icon-font.js      → web/fonts/color-space-icons.ttf + .json (name → hex codepoint)
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as ICONS from '../web/js/icons.js'

const EM = 1024, ASC = 896, DESC = -128

// the fallback-friendly codepoints of the lens icons; everything else counts up from U+E000
const SYMBOL = {
	'QI.smooth': 0x25AC, 'QI.10': 0x25A5, 'QI.20': 0x25A6, 'QI.565': 0x25A4, 'QI.jnd': 0x25EB,
	'QI.web': 0x2058, 'QI.names': 0x25C8, 'QI.xkcd': 0x25D4, 'QI.tailwind': 0x2630, 'QI.pico8': 0x25A9, 'QI.ansi': 0x25B8,
	'LI.srgb': 0x25B5, 'LI.p3': 0x25B3, 'LI.rec2020': 0x25B2, 'LI.vis': 0x25D2, 'LI.locus': 0x25EF,
}

/* ---------- SVG → polygons ---------- */

const num = s => s.match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi)?.map(Number) || []
const attrs = s => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]))
const arcPts = (cx, cy, rx, ry, a0, da, n) => Array.from({ length: n + 1 }, (_, k) => { const t = a0 + da * k / n; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] })
const ellipse = (cx, cy, rx, ry) => arcPts(cx, cy, rx, ry, 0, 2 * Math.PI, Math.max(12, Math.round(8 * Math.sqrt(Math.max(rx, ry))))).slice(0, -1)
function roundRect(x, y, w, h, r) {
	r = Math.min(r || 0, w / 2, h / 2)
	if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
	const q = Math.PI / 2, c = (cx, cy, a) => arcPts(cx, cy, r, r, a, q, 4)
	return [...c(x + w - r, y + r, -q), ...c(x + w - r, y + h - r, 0), ...c(x + r, y + h - r, q), ...c(x + r, y + r, 2 * q)]
}

// an SVG path's subpaths as polylines: {pts, closed}
function path(d) {
	const out = [], toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g)
	let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, cur = null, px = 0, py = 0, prev = ''
	const n = () => +toks[i++]
	const start = () => { cur = { pts: [[x, y]], closed: false }; out.push(cur) }
	const to = (nx, ny) => { x = nx; y = ny; cur.pts.push([x, y]) }
	const bez = (pts, steps = 12) => { for (let k = 1; k <= steps; k++) { const t = k / steps
		if (pts.length === 3) { const [a, b, c] = pts, u = 1 - t; to(u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]) }
		else { const [a, b, c, e] = pts, u = 1 - t; to(u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * e[0], u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * e[1]) } } }
	// SVG arc → centre parameterization (SVG 1.1 implementation notes, F.6.5)
	const arc = (rx, ry, phi, fa, fs, ex, ey) => {
		rx = Math.abs(rx); ry = Math.abs(ry)
		if (!rx || !ry) return to(ex, ey)
		const r = phi * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r)
		const dx = (x - ex) / 2, dy = (y - ey) / 2, x1 = cs * dx + sn * dy, y1 = -sn * dx + cs * dy
		const L = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry)
		if (L > 1) { rx *= Math.sqrt(L); ry *= Math.sqrt(L) }
		const s = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, (rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1) / (rx * rx * y1 * y1 + ry * ry * x1 * x1)))
		const cx1 = s * rx * y1 / ry, cy1 = -s * ry * x1 / rx
		const cx = cs * cx1 - sn * cy1 + (x + ex) / 2, cy = sn * cx1 + cs * cy1 + (y + ey) / 2
		const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
		const t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
		let dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
		if (!fs && dt > 0) dt -= 2 * Math.PI; else if (fs && dt < 0) dt += 2 * Math.PI
		const steps = Math.max(4, Math.ceil(Math.abs(dt) / (Math.PI / 12)))
		for (let k = 1; k <= steps; k++) { const t = t1 + dt * k / steps, ux = rx * Math.cos(t), uy = ry * Math.sin(t); to(cs * ux - sn * uy + cx, sn * ux + cs * uy + cy) }
	}
	while (i < toks.length) {
		if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
		const rel = cmd === cmd.toLowerCase() && cmd !== 'z', C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0
		if (C === 'M') { x = ox + n(); y = oy + n(); sx = x; sy = y; start(); cmd = rel ? 'l' : 'L' }
		else if (C === 'L') to(ox + n(), oy + n())
		else if (C === 'H') to(ox + n(), y)
		else if (C === 'V') to(x, oy + n())
		else if (C === 'C') { const a = [ox + n(), oy + n()], b = [ox + n(), oy + n()], e = [ox + n(), oy + n()]; px = b[0]; py = b[1]; bez([[x, y], a, b, e]) }
		else if (C === 'S') { const a = /[CS]/i.test(prev) ? [2 * x - px, 2 * y - py] : [x, y], b = [ox + n(), oy + n()], e = [ox + n(), oy + n()]; px = b[0]; py = b[1]; bez([[x, y], a, b, e]) }
		else if (C === 'Q') { const a = [ox + n(), oy + n()], e = [ox + n(), oy + n()]; px = a[0]; py = a[1]; bez([[x, y], a, e], 10) }
		else if (C === 'T') { const a = /[QT]/i.test(prev) ? [2 * x - px, 2 * y - py] : [x, y], e = [ox + n(), oy + n()]; px = a[0]; py = a[1]; bez([[x, y], a, e], 10) }
		else if (C === 'A') { const rx = n(), ry = n(), phi = n(), fa = n(), fs = n(); arc(rx, ry, phi, fa, fs, ox + n(), oy + n()) }
		else if (C === 'Z') { cur.closed = true; x = sx; y = sy; if (i < toks.length && !/[a-zA-Z]/.test(toks[i])) start() }
		prev = C
	}
	return out
}

// a polyline stroked: each segment a rectangle, each vertex a disc (round joins and caps)
function stroke(pts, closed, w) {
	const h = w / 2, polys = []
	const segs = closed ? pts.map((p, k) => [p, pts[(k + 1) % pts.length]]) : pts.slice(1).map((p, k) => [pts[k], p])
	for (const [[ax, ay], [bx, by]] of segs) {
		const L = Math.hypot(bx - ax, by - ay); if (L < 1e-6) continue
		const nx = -(by - ay) / L * h, ny = (bx - ax) / L * h
		polys.push([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]])
	}
	for (const [x, y] of pts) polys.push(ellipse(x, y, h, h))
	return polys
}

const area = poly => poly.reduce((s, [x, y], k) => { const [u, v] = poly[(k + 1) % poly.length]; return s + x * v - u * y }, 0) / 2

// one icon (an <svg> string) → contours in its own viewBox units, each tagged hole or fill
function contours(svg) {
	const V = num(svg.match(/viewBox="([^"]+)"/)[1])[2], line = /class="ic"/.test(svg), out = []
	const add = (poly, hole = false) => poly.length > 2 && out.push({ poly, hole })
	for (const m of svg.matchAll(/<(rect|circle|ellipse|path)\b([^>]*)\/?>/g)) {
		const [, tag, raw] = m, a = attrs(raw), op = +(a.opacity ?? 1)
		let shapes
		if (tag === 'rect') shapes = [{ pts: roundRect(+a.x || 0, +a.y || 0, +a.width, +a.height, +(a.rx ?? a.ry ?? 0)), closed: true }]
		else if (tag === 'circle') shapes = [{ pts: ellipse(+a.cx, +a.cy, +a.r, +a.r), closed: true }]
		else if (tag === 'ellipse') shapes = [{ pts: ellipse(+a.cx, +a.cy, +a.rx, +a.ry), closed: true }]
		else shapes = path(a.d)
		const box = shapes.flatMap(s => s.pts), bw = Math.max(...box.map(p => p[0])) - Math.min(...box.map(p => p[0])), bh = Math.max(...box.map(p => p[1])) - Math.min(...box.map(p => p[1]))
		const backdrop = op <= .3 && bw * bh > .4 * V * V
		const stroked = line || a.fill === 'none' || backdrop
		const w = (line ? 2 : backdrop ? .9 : +(a['stroke-width'] ?? 1)) * (op < .5 && !backdrop ? .6 : 1)   // a faint stroke (the gamut icons' locus) drawn thinner, so what it frames stands out
		if (/url\(/.test(a.fill || '') && tag === 'rect') {   // a gradient bar: a ramp widening toward its opaque end
			const x = +a.x, y = +a.y, W = +a.width, H = +a.height
			add([[x, y + H * .42], [x + W, y], [x + W, y + H], [x, y + H * .58]])
			continue
		}
		for (const s of shapes) {
			if (stroked) for (const p of stroke(s.pts, s.closed, w)) add(p)
			else add(s.pts, /fill:var\(--paper\)/.test(a.style || ''))
		}
	}
	return { V, out }
}

/* ---------- polygons → a TrueType font ---------- */

function glyph(svg) {
	const { V, out } = contours(svg), s = (ASC - DESC) / V
	const conts = out.map(({ poly, hole }) => {
		let p = poly.map(([x, y]) => [Math.round(x * s), Math.round(ASC - y * s)])
		p = p.filter((q, k) => k === 0 || q[0] !== p[k - 1][0] || q[1] !== p[k - 1][1])
		if (p.length > 1 && p[0][0] === p.at(-1)[0] && p[0][1] === p.at(-1)[1]) p.pop()
		// TrueType: filled contours clockwise (negative area with y up), holes counterclockwise
		if ((area(p) > 0) !== hole) p.reverse()
		return p
	}).filter(p => p.length > 2)
	const all = conts.flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1])
	return { conts, xMin: Math.min(...xs), yMin: Math.min(...ys), xMax: Math.max(...xs), yMax: Math.max(...ys) }
}

class Buf {
	constructor() { this.b = [] }
	u8(v) { this.b.push(v & 255); return this }
	u16(v) { return this.u8(v >> 8).u8(v) }
	i16(v) { return this.u16(v < 0 ? v + 65536 : v) }
	u32(v) { return this.u16(v >>> 16).u16(v & 65535) }
	bytes(a) { for (const v of a) this.u8(v); return this }
	pad() { while (this.b.length % 4) this.u8(0); return this }
	get length() { return this.b.length }
	out() { return Uint8Array.from(this.b) }
}
const sum = t => { let s = 0; for (let k = 0; k < t.length; k += 4) s = (s + ((t[k] << 24) | (t[k + 1] << 16) | (t[k + 2] << 8) | t[k + 3]) >>> 0) >>> 0; return s }

function ttf(glyphs, family) {
	const n = glyphs.length + 1
	// glyf + loca: glyph 0 (.notdef) is empty
	const glyf = new Buf(), loca = [0, 0]   // numGlyphs + 1 offsets; .notdef spans nothing
	let maxPts = 0, maxCont = 0
	for (const g of glyphs) {
		glyf.i16(g.conts.length).i16(g.xMin).i16(g.yMin).i16(g.xMax).i16(g.yMax)
		let end = -1
		for (const c of g.conts) glyf.u16(end += c.length)
		glyf.u16(0)   // no instructions
		const pts = g.conts.flat()
		maxPts = Math.max(maxPts, pts.length); maxCont = Math.max(maxCont, g.conts.length)
		pts.forEach((_, k) => glyf.u8(k ? 1 : 0x41))   // on-curve, full 16-bit deltas; OVERLAP_SIMPLE on the first: its contours overlap by design
		let px = 0; for (const [x] of pts) { glyf.i16(x - px); px = x }
		let py = 0; for (const [, y] of pts) { glyf.i16(y - py); py = y }
		glyf.pad()
		loca.push(glyf.length)
	}
	const all = glyphs, B = k => Math.min(...all.map(g => g[k])), T = k => Math.max(...all.map(g => g[k]))
	const head = new Buf().u32(0x00010000).u32(0x00010000).u32(0).u32(0x5F0F3CF5).u16(0x000B).u16(EM)
		.u32(0).u32(0).u32(0).u32(0).i16(B('xMin')).i16(B('yMin')).i16(T('xMax')).i16(T('yMax')).u16(0).u16(8).i16(2).i16(1).i16(0)
	const hhea = new Buf().u32(0x00010000).i16(ASC).i16(DESC).i16(0).u16(EM).i16(0).i16(0).i16(T('xMax'))
		.i16(1).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).u16(n)
	const maxp = new Buf().u32(0x00010000).u16(n).u16(maxPts).u16(maxCont).u16(0).u16(0).u16(2).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0)
	const hmtx = new Buf().u16(EM).i16(0); for (const g of glyphs) hmtx.u16(EM).i16(g.xMin)
	const cps = glyphs.map(g => g.cp)
	const os2 = new Buf().u16(4).i16(EM).u16(400).u16(5).u16(0)
		.i16(650).i16(700).i16(0).i16(140).i16(650).i16(700).i16(0).i16(480).i16(50).i16(260).i16(0)
		.bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).u32(0).u32(0).u32(0).u32(0).bytes([...'CSPC'].map(c => c.charCodeAt(0)))
		.u16(0x40).u16(Math.min(...cps)).u16(Math.max(...cps)).i16(ASC).i16(DESC).i16(0).u16(ASC).u16(-DESC).u32(1).u32(0)
		.i16(512).i16(ASC).u16(0).u16(32).u16(1)
	// cmap: one format-4 subtable (Windows Unicode BMP), a segment per character, sorted
	const order = glyphs.map((g, k) => [g.cp, k + 1]).sort((a, b) => a[0] - b[0]), segs = [...order, [0xFFFF, 0]], sc = segs.length
	const sub = new Buf().u16(4).u16(16 + sc * 8).u16(0).u16(sc * 2)
	const pow = 2 ** Math.floor(Math.log2(sc))
	sub.u16(pow * 2).u16(Math.log2(pow)).u16(sc * 2 - pow * 2)
	for (const [c] of segs) sub.u16(c)
	sub.u16(0)
	for (const [c] of segs) sub.u16(c)
	for (const [c, g] of segs) sub.u16(c === 0xFFFF ? 1 : (g - c + 65536) & 65535)
	for (const _ of segs) sub.u16(0)
	const cmap = new Buf().u16(0).u16(1).u16(3).u16(1).u32(12).bytes(sub.out())
	const names = [[1, family], [2, 'Regular'], [4, family], [6, family.replace(/\s/g, '')]]
	const strs = names.map(([, s]) => { const b = new Buf(); for (const ch of s) b.u16(ch.charCodeAt(0)); return b.out() })
	const name = new Buf().u16(0).u16(names.length).u16(6 + names.length * 12)
	let off = 0
	names.forEach(([id], k) => { name.u16(3).u16(1).u16(0x409).u16(id).u16(strs[k].length).u16(off); off += strs[k].length })
	for (const s of strs) name.bytes(s)
	const post = new Buf().u32(0x00030000).u32(0).i16(-100).i16(50).u32(0).u32(0).u32(0).u32(0).u32(0)
	const locaB = new Buf(); for (const o of loca) locaB.u32(o)
	const tables = { 'OS/2': os2, cmap, glyf, head, hhea, hmtx, loca: locaB, maxp, name, post }
	const tags = Object.keys(tables).sort(), nt = tags.length, sr = 2 ** Math.floor(Math.log2(nt)) * 16
	const font = new Buf().u32(0x00010000).u16(nt).u16(sr).u16(Math.log2(sr / 16)).u16(nt * 16 - sr)
	let at = 12 + nt * 16
	const data = tags.map(t => { const b = tables[t].out(), padded = new Buf().bytes(b).pad().out(); const rec = { t, b, padded, at }; at += padded.length; return rec })
	for (const { t, b, padded, at: o } of data) font.bytes([...t.padEnd(4)].map(c => c.charCodeAt(0))).u32(sum(padded)).u32(o).u32(b.length)
	for (const { padded } of data) font.bytes(padded)
	const bytes = font.out(), headAt = data.find(d => d.t === 'head').at
	const adj = (0xB1B0AFBA - sum(bytes)) >>> 0
	new DataView(bytes.buffer).setUint32(headAt + 8, adj)
	return bytes
}

/** The font and its map: { ttf: Uint8Array, map: { 'QI.tailwind': '2630', … } } – hex codepoints, as CSS `content: '\\2630'` takes them */
export function buildIconFont(family = 'color-space icons', only = null) {   // only: icon keys to keep (a subset for one tool); codepoints stay the full font's
	let pua = 0xE000
	const glyphs = []
	for (const [set, icons] of Object.entries(ICONS)) {
		// an icon is an SVG string; other exports (shape data, helpers) are not icons
		const isIcon = v => typeof v === 'string' && v.startsWith('<svg')
		const entries = typeof icons === 'string' ? (isIcon(icons) ? [[set, icons]] : []) : Object.entries(icons).filter(([, v]) => isIcon(v)).map(([k, v]) => [`${set}.${k}`, v])
		for (const [key, svg] of entries) glyphs.push({ key, cp: SYMBOL[key] ?? pua++, ...glyph(svg) })
	}
	const kept = only ? glyphs.filter(g => only(g.key)) : glyphs
	return { ttf: ttf(kept, family), map: Object.fromEntries(kept.map(g => [g.key, g.cp.toString(16).toUpperCase()])) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const dir = fileURLToPath(new URL('../web/fonts/', import.meta.url))
	const { ttf: bytes, map } = buildIconFont()
	mkdirSync(dir, { recursive: true })
	writeFileSync(dir + 'color-space-icons.ttf', bytes)
	writeFileSync(dir + 'color-space-icons.json', JSON.stringify(map, null, '\t') + '\n')
	console.log(`web/fonts/color-space-icons.ttf  ${(bytes.length / 1024).toFixed(1)} KB, ${Object.keys(map).length} icons`)
}
