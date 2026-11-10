# Conformance suite

`conformance.json` is a list of color conversions, each printed by the document that defines the space or computed by a named reference implementation, with a link to the page that prints it. color-space's own tests hold the library to every row; any color library, in any language, can run the same rows.

Get it from the npm package, `color-space/conformance.json`, or from <https://color-space.io/conformance.json>. Both are CC0.

## What it is and is not

It is a set of point checks: an input, the output its source gives, a tolerance and the source. A passing row says a conversion agrees with the cited document at that point.

It is not:

- a test of gamut mapping, parsing, serialization, interpolation or ΔE;
- a grid: a row pins a formula at one point and cannot reach every branch of it (color-space also tests 29 spaces against colorjs.io over a grid, [formula-verification.md](formula-verification.md));
- free of conventions: the space ids, ranges, white points and the 203 cd/m² HDR white below are color-space's, chosen to match CSS Color 4 wherever CSS defines the space; an adapter maps them to a library's own;
- a ranking of libraries.

## The file

```json
{ "name": "color-space conformance", "version": "…", "about": "…", "license": "CC0-1.0",
  "tolerance": 0.0001, "fields": { … }, "spaces": { … }, "rows": [ … ] }
```

`spaces` describes every space a row uses, for example `"lab": { "name": "CIELAB", "channels": ["L", "a", "b"], "range": [[0, 100], [-125, 125], [-125, 125]], "white": "D50" }`. `fields` repeats the table below, one line per field.

A row:

```json
{ "s": "lab", "f": "rgb", "t": "lab", "in": [118, 84, 205], "out": [44.36, 36.05, -58.99],
  "src": "CSS Color 4 CR Draft 2026-11-03 §10.9 example: \"These are exactly equivalent: #7654CD, rgb(46.27% 32.94% 80.39%), lab(44.36% 36.05 -58.99)\" (D50, Bradford)",
  "url": "https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#ex-xyz", "kind": "published" }
```

| Field | Meaning |
|---|---|
| `s` | the space the row anchors |
| `f`, `t` | the spaces converted from and to, keys of `spaces` |
| `in` | the input, one number per channel of `f` |
| `out` | the expected output, one number per channel of `t` |
| `tol` | optional absolute tolerance: one number for every channel of `t`, or one per channel with `null` for the default |
| `src` | the source, quoting the printed value, and how `in` and `out` were scaled from it (x255, x100, x100/203) |
| `url` | the page that prints it: a dated W3C snapshot, a pinned commit, a PDF page |
| `kind` | `published`, `implementation` or `computed`, [below](#kinds-and-how-far-to-trust-them) |

Rows have no id: `f`, `t` and `in` identify one.

## Units and ranges

Every number is in its space's conventional units, the ones its own literature or CSS uses, listed in `spaces[id].range`:

- `rgb` (sRGB) 0–255; every other RGB space, linear or encoded (`lrgb`, `p3`, `a98rgb`, `prophoto`, `rec2020`, …), 0–1;
- XYZ (`xyz`, `xyz-d50`) with Y = 100 at the white;
- CIELAB, CIELUV and their LCh forms with L 0–100; OKLab and OKLCh with L 0–1, as CSS writes them;
- hue in degrees, 0–360; HSL, HSV and HWB with the other two channels in percent, 0–100.

`range` is what the tolerance is a fraction of, not a clamp. Out-of-gamut rows keep their negative and above-range values, and RGB transfer functions extend past 0–1 as `sign(x) · f(|x|)`, as in CSS Color 4's sample code.

The ids that a name alone does not settle:

| Id | Space | White |
|---|---|---|
| `rgb` / `lrgb` | sRGB (IEC 61966-2-1) / its linear light | D65 |
| `xyz` / `xyz-d50` | CIE XYZ | D65 / D50 |
| `lab`, `lchab` | CIELAB and its LCh, as CSS `lab()` and `lch()` | D50 |
| `lab-d65`, `lch-d65` | CIELAB and its LCh | D65 |
| `luv`, `lchuv` | CIELUV and its LCh | D65 |
| `p3`, `a98rgb`, `prophoto` | Display P3, Adobe RGB (1998), ProPhoto (ROMM) RGB | D65, D65, D50 |
| `rec2020` | BT.2020 primaries with BT.2020's camera curve (OETF) | D65 |
| `rec2020-display` | BT.2020 primaries with BT.1886 gamma 2.4: CSS `color(rec2020)` | D65 |
| `rec2100-pq` | a BT.2100 PQ signal, absolute | D65 |
| `ictcp` | BT.2100 ICtCp (PQ), Ct whole, not ITP's T = Ct / 2 (BT.2124) | D65 |
| `jzazbz` | Safdar et al. 2017 | D65 |

## White points and adaptation

These settle most disagreements between faithful implementations.

- D65 is xy (0.3127, 0.3290), XYZ [95.0456, 100, 108.9058], not ASTM E308's [95.047, 100, 108.883].
- D50 is xy (0.3457, 0.3585), XYZ [96.4296, 100, 82.5105], as CSS Color 4 computes it, not ICC's [96.42, 100, 82.49] or [96.422, 100, 82.521].
- D65 and D50 are bridged by Bradford, the matrices derived from these two whites: CSS Color 4's printed `D65_to_D50` and `D50_to_D65` to the last digit. `lab` is D50, so sRGB to `lab` adapts D65 to D50.
- ICtCp, Jzazbz and PQ are absolute. XYZ Y = 100 here is 203 cd/m², the HDR reference white of ITU-R BT.2408 and CSS Color HDR: a library that takes XYZ in cd/m² multiplies the suite's XYZ by 2.03.
- A hue a library leaves undefined (NaN, `undefined`) for an achromatic color reads as 0.

## Tolerance

Channel k of a row passes when |got − out[k]| ≤ `tolerance` × (max − min) of `spaces[t].range[k]`, with `tolerance` 1e-4: 0.01 of L\*, 0.0255 of an 8-bit code, 0.1 of a 10-bit code. A row's `tol` replaces it where the source prints fewer digits than that (half a unit of the last printed digit) or a stated convention difference forces it, and `src` says which; no `tol` is widened to make a row pass. A channel whose range is 0–360 is a hue: compare the difference around the circle.

## Kinds, and how far to trust them

- `published`: printed by the source, a standard, specification, paper, web-platform-tests or the author's own reference data. It carries the source's rounding and, rarely, its errors; [errata.md](errata.md) lists those found.
- `implementation`: computed by the named implementation at a pinned version (colour-science 0.4.7, colorjs.io 0.5.2, the HSLuv reference implementation, …) from the cited definition. It shows agreement with that implementation and inherits its conventions; for that implementation itself the row is not independent evidence.
- `computed`: arithmetic on a printed definition, a matrix or a transfer function, done here. Redo it from `src`.

## Running it

An adapter maps each suite id a library implements to its own id and units; the loop converts `in`, scales the result back and compares. In JavaScript against colorjs.io (Node 22):

```js
import Color from 'colorjs.io'
import suite from 'color-space/conformance.json' with { type: 'json' }

// the spaces colorjs.io shares with the suite: [its id, its unit in the suite's units]
const ids = { rgb: ['srgb', 255], lrgb: ['srgb-linear', 1], p3: ['p3', 1], a98rgb: ['a98rgb', 1], prophoto: ['prophoto', 1], xyz: ['xyz-d65', 100],
	'xyz-d50': ['xyz-d50', 100], lab: ['lab', 1], lchab: ['lch', 1], oklab: ['oklab', 1], oklch: ['oklch', 1], hsl: ['hsl', 1], hwb: ['hwb', 1],
	hsv: ['hsv', 1], luv: ['luv', 1], lchuv: ['lchuv', 1], jzazbz: ['jzazbz', 1], ictcp: ['ictcp', 1] }
let run = 0, failed = 0
for (const r of suite.rows) {
	const [f, fu] = ids[r.f] ?? [], [t, tu] = ids[r.t] ?? []
	if (!f || !t) continue
	const got = new Color(f, r.in.map(v => v / fu)).to(t).coords.map(v => (v || 0) * tu)   // a missing hue reads 0
	const off = r.out.some((v, k) => {
		const [lo, hi] = suite.spaces[r.t].range[k], d = Math.abs(got[k] - v)
		return (hi === 360 ? Math.min(d, 360 - d) : d) > ((Array.isArray(r.tol) ? r.tol[k] : r.tol) ?? suite.tolerance * (hi - lo))
	})
	run++
	if (off) failed++, console.log(`${r.f} → ${r.t} [${r.in}]: got [${got}], expected [${r.out}] ${r.url}`)
}
console.log(`${run} rows run, ${failed} failed`)
```

In Python against colour-science, through XYZ:

```py
import json, numpy as np, colour

suite = json.load(open('node_modules/color-space/conformance.json'))
D65 = colour.CCS_ILLUMINANTS['CIE 1931 2 Degree Standard Observer']['D65']
# the spaces colour-science shares with the suite: (to XYZ, from XYZ) in the suite's units, XYZ D65 with Y = 100
via = {'xyz': (lambda v: v, lambda v: v),
       'rgb': (lambda v: colour.sRGB_to_XYZ(v / 255) * 100, lambda v: colour.XYZ_to_sRGB(v / 100) * 255),
       'oklab': (lambda v: colour.Oklab_to_XYZ(v) * 100, lambda v: colour.XYZ_to_Oklab(v / 100)),
       'luv': (lambda v: colour.Luv_to_XYZ(v, D65) * 100, lambda v: colour.XYZ_to_Luv(v / 100, D65))}
run = failed = 0
for r in suite['rows']:
    if r['f'] not in via or r['t'] not in via: continue
    got = via[r['t']][1](via[r['f']][0](np.array(r['in'], float)))
    rng = np.array(suite['spaces'][r['t']]['range']); tol = r.get('tol')
    tol = [suite['tolerance'] * (hi - lo) if x is None else x for x, (lo, hi) in zip(tol if isinstance(tol, list) else [tol] * len(rng), rng)]
    d = np.abs(got - r['out']); d = np.where(rng[:, 1] == 360, np.minimum(d, 360 - d), d)
    run += 1
    if (d > tol).any(): failed += 1; print(r['f'], '->', r['t'], r['in'], 'got', got, 'expected', r['out'], r['url'])
print(run, 'rows run,', failed, 'failed')
```

Each prints the rows that miss, with their links, then the count. [benchmark/conformance.js](../benchmark/conformance.js) runs the suite the same way against colorjs.io, culori, @texel/color, chroma-js, d3-color and color-convert (`node benchmark/conformance.js [library]`); its adapters note where a library's space of the same name is another definition and is left unmapped.

A row that fails is one of three things: the library's error, the adapter's (a range, a white point, a transfer curve, a same-named space with another definition) or the row's. Read the row's `src` and `url` before deciding which.

## A wrong row

Open a [Wrong value](https://github.com/colorjs/color-space/issues/new?template=wrong-value.yml) issue with the row (`f`, `t`, `in`), the value the defining document gives and where it prints it. A confirmed fix corrects the row, and the library if it was wrong; an error in the published source itself goes into [errata.md](errata.md).

## Citing

Cite color-space from [CITATION.cff](../CITATION.cff), with the `version` of the file you ran, and a row's own `url` for the value itself.

## Versions

`version` is the color-space release the file was generated from, and that release passes every row. Rows are added and corrected between releases, so compare results of the same `version`. `fields` and `spaces` arrived after 3.5.0; in older files the ranges are in `data.json` (`spaces[id].channels`). Top-level keys may be added; `rows` keeps its fields.
