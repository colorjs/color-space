#!/usr/bin/env python3
"""Run color-space/ocio's snippets through real OpenColorIO (PyOpenColorIO), not part of npm test.

    python3 -m venv ocio-venv && ocio-venv/bin/pip install opencolorio
    ocio-venv/bin/python scripts/check-ocio.py

For each reference (aces2065-1, xyz-d65) it builds one config of every snippet colorspace()
returns, loads and validates it, and compares OCIO's float32 CPU processor, code to reference and
back, against color-space's own conversion (node computes the expected values): the error is a
fraction of the color's magnitude, floored at 0.18 mid grey, as test/ocio.js measures it, and the
bar is float32's: a log decode multiplies a code's 6e-8 rounding by ln(base)/log_side_slope, about
10 for LogC4, S-Log3, Log3G10, so 5e-6 (test/ocio.js holds the formulas to 1e-6 in double). Then
it compares the snippets with OCIO's camera BuiltinTransforms, the transforms of the Academy's
studio configs. Exits 1 if any snippet misses the bar.
"""
import json, os, subprocess, sys
import PyOpenColorIO as OCIO

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# node: the snippets, a grid of codes per space, and the library's reference values for them
JS = r"""
import space from './index.js'
import { colorspace } from './ocio.js'
import { gamut, whites, matrix } from './gamuts.js'
import { mat3, mul3, inv3 } from './math.js'
import { M_BRADFORD } from './spaces/xyz.js'
const CAT02 = [0.7328, 0.4296, -0.1624, -0.7036, 1.6975, 0.0061, 0.0030, 0.0136, 0.9834]
const W = (w) => { const [x, y] = whites[w]; return [x / y, 1, (1 - x - y) / y] }
const cat = (cone, a, b) => { const s = mat3(cone, ...W(a)), d = mat3(cone, ...W(b)); return mul3(inv3(cone), mul3([d[0] / s[0], 0, 0, 0, d[1] / s[1], 0, 0, 0, d[2] / s[2]], cone)) }
const UNIT = { xyz: 100, 'xyz-d50': 100 }, WHITE = { xyz: 'D65', 'xyz-d50': 'D50' }
const ids = Object.keys(space).filter((id) => colorspace(id))
const xyzOf = (id, c) => space[id].xyz(...c.map((v) => v * (UNIT[id] ?? 1))).map((v) => v / 100)
const out = { refs: {} }
for (const [ref, self] of [['aces2065-1', 'aces2065-1'], ['xyz-d65', 'xyz']]) {
	const cases = ids.map((id) => {
		const [lo, hi] = space[id].range[1].map((v) => v / (UNIT[id] ?? 1)), span = hi - lo, a = lo - 0.1 * span, b = hi + 0.25 * span
		const ax = Array.from({ length: 7 }, (_, i) => a + (b - a) * i / 6), codes = []
		for (const r of ax) for (const g of ax) for (const bl of ax) codes.push([r, g, bl])
		for (let i = 0; i <= 200; i++) { const v = a + (b - a) * i / 200; codes.push([v, v, v]) }
		let M = null
		if (ref === 'aces2065-1') {
			const w = WHITE[id] ?? gamut[(DATA[id].gamut)].white
			M = w === 'ACES' ? null : mul3(inv3(matrix(gamut.ap0)), mul3(cat(['vgamut', 'rwg'].includes(DATA[id].gamut) ? M_BRADFORD : CAT02, w, 'ACES'), cat(M_BRADFORD, 'D65', w)))
		}
		const expected = codes.map((c) => ref === 'xyz-d65' ? xyzOf(id, c) : M ? mat3(M, ...xyzOf(id, c)) : space[id]['aces2065-1'](...c))
		return { id, name: colorspace(id, { reference: ref }).match(/name: (.*)/)[1], codes, expected }
	})
	out.refs[ref] = { self: colorspace(self, { reference: ref }).match(/name: (.*)/)[1], yaml: ids.map((id) => colorspace(id, { reference: ref })).join(''), cases }
}
console.log(JSON.stringify(out))
"""
JS = "import data from './data.json' with { type: 'json' }\nconst DATA = data.spaces\n" + JS


def config(ref):
    text = f"""ocio_profile_version: 2

search_path: ""
strictparsing: true
luma: [0.2126, 0.7152, 0.0722]

roles:
  default: {ref['self']}
  scene_linear: {ref['self']}

file_rules:
  - !<Rule> {{name: Default, colorspace: default}}

displays:
  None:
    - !<View> {{name: Raw, colorspace: {ref['self']}}}

active_displays: []
active_views: []

colorspaces:
{ref['yaml']}"""
    cfg = OCIO.Config.CreateFromStream(text)
    cfg.validate()
    return cfg


def rel(got, exp):
    return max(abs(g - e) for g, e in zip(got, exp)) / max(0.18, *map(abs, exp))


def cpu(proc):
    # no fast log/exp approximations: OCIO's exact float32 path
    return proc.getOptimizedCPUProcessor(OCIO.OPTIMIZATION_NONE)


def main():
    data = json.loads(subprocess.run(['node', '--input-type=module', '-e', JS], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
    print(f'OpenColorIO {OCIO.__version__}')
    bad = []
    for refname, ref in data['refs'].items():
        cfg = config(ref)
        worst = {}
        for case in ref['cases']:
            fwd = cpu(cfg.getProcessor(case['name'], ref['self']))
            inv = cpu(cfg.getProcessor(ref['self'], case['name']))
            ef = max(rel(fwd.applyRGB(c), e) for c, e in zip(case['codes'], case['expected']))
            # backward: OCIO's code for the color, decoded again by OCIO's forward (float32 both ways)
            eb = max(rel(fwd.applyRGB(inv.applyRGB(e)), e) for e in case['expected'])
            kind = cfg.getColorSpace(case['name']).getEncoding()
            w = worst.setdefault(kind, [0, 0, 0])
            w[0], w[1], w[2] = max(w[0], ef), max(w[1], eb), w[2] + 1
            if ef > 5e-6 or eb > 5e-6:
                bad.append(f'{refname} {case["id"]}: {ef:.1e} {eb:.1e}')
        print(f'\n{refname}: {len(ref["cases"])} colorspaces load and validate')
        for kind, (ef, eb, n) in worst.items():
            print(f'  {kind:13} ({n:2}) max code→ref vs color-space {ef:.2e}, round trip {eb:.2e}')

    # against OCIO's builtins, the camera transforms of the Academy's OCIO studio configs
    print('\nagainst OCIO BuiltinTransforms (code→ref):')
    builtins = [
        ('aces2065-1', 'sgamut3cine', 'SONY_SLOG3-SGAMUT3.CINE_to_ACES2065-1'),
        ('aces2065-1', 'slog3', 'SONY_SLOG3-SGAMUT3_to_ACES2065-1'),
        ('aces2065-1', 'logc3', 'ARRI_ALEXA-LOGC-EI800-AWG_to_ACES2065-1'),
        ('aces2065-1', 'logc4', 'ARRI_LOGC4_to_ACES2065-1'),
        ('aces2065-1', 'vlog', 'PANASONIC_VLOG-VGAMUT_to_ACES2065-1'),
        ('aces2065-1', 'log3g10', 'RED_LOG3G10-RWG_to_ACES2065-1'),
        ('aces2065-1', 'acescct', 'ACEScct_to_ACES2065-1'),
        ('aces2065-1', 'acescg', 'ACEScg_to_ACES2065-1'),
        ('xyz-d65', 'aces2065-1', 'UTILITY - ACES-AP0_to_CIE-XYZ-D65_BFD'),
        ('xyz-d65', 'acescg', 'UTILITY - ACES-AP1_to_CIE-XYZ-D65_BFD'),
    ]
    for refname, id, style in builtins:
        ref = data['refs'][refname]
        cfg = config(ref)
        case = next(c for c in ref['cases'] if c['id'] == id)
        ours = cpu(cfg.getProcessor(case['name'], ref['self']))
        theirs = cpu(cfg.getProcessor(OCIO.BuiltinTransform(style)))
        e = max(rel(ours.applyRGB(c), theirs.applyRGB(c)) for c in case['codes'])
        print(f'  {id:12} vs {style}: {e:.2e}')

    if bad:
        print('\nover 5e-6:', *bad, sep='\n  ')
        sys.exit(1)


if __name__ == '__main__':
    main()
