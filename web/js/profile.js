// Profile numerics — the ColorSync-grade record (primaries, white point, transfer-curve
// constants), COMPUTED from the shipped conversions and cross-verified against them,
// never stored. Shared by the catalog dossier and the atlas study.
import { space, meta } from './core.js'

// ── primaries as xy chromaticities + reference white XYZ — RGB-cube spaces only.
// The conversions land in the D65 hub, so computed corners are CHROMATICALLY ADAPTED for
// any space whose native white differs (flagged `adapted`); the native white itself comes
// from the CIE 15 / SMPTE tabulated tristimulus for the declared illuminant (2° observer). ──
const WHITE = { D65:[0.95047,1,1.08883], D50:[0.96422,1,0.82521], D60:[0.95265,1,1.00883],
	DCI:[0.89459,1,0.95442], C:[0.98074,1,1.18232], E:[1,1,1], A:[1.09850,1,0.35585] }
const PRIM = new Map()
export function primariesOf(s) {
	if (PRIM.has(s)) return PRIM.get(s)
	let out = null
	try {
		const m = meta[s]
		if ((m.method === 'transfer' || m.method === 'matrix') && m.channels.length === 3 && space[s].xyz) {
			const R = space[s].range, corner = v => space[s].xyz(...v)
			const xy = X => { const t = X[0] + X[1] + X[2]; return t ? [X[0]/t, X[1]/t] : null }
			const r = xy(corner([R[0][1], R[1][0], R[2][0]]))
			const g = xy(corner([R[0][0], R[1][1], R[2][0]]))
			const b = xy(corner([R[0][0], R[1][0], R[2][1]]))
			const wc = corner([R[0][1], R[1][1], R[2][1]])
			if (r && g && b && wc.every(isFinite) && wc[1]) {
				const adapted = !!(m.illuminant && m.illuminant !== 'D65')
				out = { r, g, b, adapted, ill: m.illuminant,
					w: WHITE[m.illuminant] || wc.map(v => v / wc[1]),   // native tabulated white; computed only when no illuminant is declared
					wSrc: WHITE[m.illuminant] ? 'cie' : 'computed' }
			}
		}
	} catch {}
	PRIM.set(s, out); return out
}

// ── transfer-curve constants, ColorSync's TRC tags — curated from the defining specs and
// VERIFIED against the shipped implementation on the neutral axis before they may render.
// decode() maps the encoded value to linear; comparison is shape-normalized (y/y(1)), so
// scene-referred headroom and Y-scale conventions cancel out. dom:'abs' marks curves whose
// native domain is the channel's own range (the ACES logs), not the normalized 0..1 value. ──
export const CURVES = {
	srgb:   { name: 'sRGB piecewise · IEC 61966-2-1', par: [['γ','2.4'],['offset','0.055'],['slope','12.92'],['cut','0.04045']],
		f: E => E <= 0.04045 ? E/12.92 : ((E+0.055)/1.055)**2.4 },
	bt709:  { name: 'BT.709 / BT.2020 OETF · ITU-R', par: [['α','1.099'],['β','0.018'],['γ','0.45'],['slope','4.5']],
		f: E => E < 0.081 ? E/4.5 : ((E+0.099)/1.099)**(1/0.45) },
	s240:   { name: 'SMPTE 240M OETF', par: [['α','1.1115'],['β','0.0228'],['γ','0.45'],['slope','4.0']],
		f: E => E < 4*0.0228 ? E/4 : ((E+0.1115)/1.1115)**(1/0.45) },
	g22a:   { name: 'pure gamma · Adobe RGB (1998)', par: [['γ','2.19921875 (563/256)']], f: E => E**2.19921875 },
	g18:    { name: 'pure gamma', par: [['γ','1.8']], f: E => E**1.8 },
	g22:    { name: 'pure gamma', par: [['γ','2.2']], f: E => E**2.2 },
	g26:    { name: 'pure gamma · SMPTE RP 431-2', par: [['γ','2.6']], f: E => E**2.6 },
	romm:   { name: 'ROMM piecewise · ISO 22028-2', par: [['γ','1.8'],['slope','16'],['cut','0.001953']],
		f: E => E < 16/512 ? E/16 : E**1.8 },
	rimm:   { name: 'RIMM scene · ISO 22028-3', par: [['α','1.099'],['β','0.018'],['γ','0.45'],['clip','2.0']],
		f: E => { const V = 1.099*2**0.45 - 0.099, e = E*V
			return e < 4.5*0.018 ? e/4.5 : ((e+0.099)/1.099)**(1/0.45) } },
	pq:     { name: 'PQ · SMPTE ST 2084', par: [['m₁','0.15930'],['m₂','78.84375'],['c₁','0.8359375'],['c₂','18.8515625'],['c₃','18.6875']],
		f: E => { const m1 = 0.1593017578125, m2 = 78.84375, c1 = 0.8359375, c2 = 18.8515625, c3 = 18.6875
			const p = E**(1/m2); return (Math.max(p - c1, 0)/(c2 - c3*p))**(1/m1) } },
	hlg:    { name: 'HLG · ARIB STD-B67 / BT.2100', par: [['a','0.17883277'],['b','0.28466892'],['c','0.55991073']],
		f: E => E <= .5 ? E*E/3 : (Math.exp((E - 0.55991073)/0.17883277) + 0.28466892)/12 },
	logc3:  { name: 'ARRI LogC3 (EI 800)', par: [['cut','0.010591'],['a','5.555556'],['b','0.052272'],['c','0.247190'],['d','0.385537']],
		f: E => E > 5.367655*0.010591 + 0.092809 ? (10**((E - 0.385537)/0.247190) - 0.052272)/5.555556 : (E - 0.092809)/5.367655 },
	slog3:  { name: 'Sony S-Log3', par: [['pivot','420/1023'],['slope','261.5'],['toe','95/1023']],
		f: E => E >= 171.2102946929/1023 ? (10**((E*1023 - 420)/261.5))*(0.18 + 0.01) - 0.01 : (E*1023 - 95)*0.01125000/(171.2102946929 - 95) },
	acescc: { name: 'ACEScc · S-2014-003', dom: 'abs', par: [['base','log₂'],['scale','17.52'],['offset','9.72']],
		f: E => E < (9.72 - 15)/17.52 ? (2**(E*17.52 - 9.72) - 2**-16)*2 : 2**(E*17.52 - 9.72) },
	acescct: { name: 'ACEScct · S-2016-001', dom: 'abs', par: [['toe slope','10.5402'],['toe cut','0.155251'],['scale','17.52'],['offset','9.72']],
		f: E => E <= 0.155251141552511 ? (E - 0.0729055341958355)/10.5402377416545 : 2**(E*17.52 - 9.72) },
	cineon: { name: 'Cineon printing density', par: [['white','685'],['black','95'],['γ','0.6']],
		f: E => { const bo = 10**((95 - 685)*0.002/0.6); return (10**((E*1023 - 685)*0.002/0.6) - bo)/(1 - bo) } },
}
// pal is deliberately unmapped: the implementation carries pure γ 2.2 while ITU-R BT.470
// nominates 2.8 for 625-line PAL — until that intent is settled in the library, printing
// either number as verified reference would mislead.
export const TRCMAP = { rgb: 'srgb', p3: 'srgb', rec709: 'bt709', rec2020: 'bt709', 'smpte-240m': 's240',
	a98rgb: 'g22a', 'apple-rgb': 'g18', ntsc: 'g22', 'dci-p3': 'g26', prophoto: 'romm', rimm: 'rimm',
	'rec2100-pq': 'pq', 'rec2100-hlg': 'hlg', logc3: 'logc3', slog3: 'slog3', acescc: 'acescc', acescct: 'acescct', cineon: 'cineon' }

const TRCV = new Map()
export function trcOf(s) {
	if (TRCV.has(s)) return TRCV.get(s)
	let out = null
	const cu = CURVES[TRCMAP[s]]
	verify: if (cu) { try {
		const toL = space[s].lrgb; if (!toL) break verify
		const R = space[s].range, E = f => cu.dom === 'abs' ? R[0][0] + f*(R[0][1] - R[0][0]) : f
		const gray = f => toL(...R.map(([a, b]) => a + f*(b - a)))[1]
		const w = gray(1), c1 = cu.f(E(1)); if (!isFinite(w) || !w || !c1) break verify
		for (let k = 1; k <= 9; k++) { const f = k/10
			if (Math.abs(gray(f)/w - cu.f(E(f))/c1) > 3e-3) break verify }
		out = cu
	} catch {} }
	TRCV.set(s, out); return out
}
