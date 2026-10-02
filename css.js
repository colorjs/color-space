/**
 * CSS Color 4 notation — a color as a native CSS string, only for the spaces CSS can
 * actually write (everything else has no textual notation, and inventing one would read
 * as a standard that doesn't exist). Pure: values in, string out, no conversion.
 *
 * Lifted from the atlas (web/index.html `fmt` / `CSSABLE`) so the MCP `css` tool and the
 * site speak one notation. Decimals are the atlas's: enough to round-trip what a slider
 * shows, fixed so trailing zeros state the precision.
 * @see https://drafts.csswg.org/css-color-4/
 *
 * lab()/lch() are D50 like this library's lab/lchab; color() takes the predefined RGB
 * spaces as 0–1 and xyz as Y = 1 (ours is 0–100, hence /100).
 * Not here: rec2020. The CSS Color 4 draft now defines color(rec2020 …) with a pure 2.4
 * gamma (BT.1886), while this library's rec2020 carries the BT.2020 OETF — the same
 * numbers would name a different color.
 * @see https://drafts.csswg.org/css-color-4/#predefined-rec2020
 */

const n = (x) => Math.round(x) || 0                       // || 0 — never "-0"
const f = (x, d) => (+x.toFixed(d) || 0).toFixed(d)       // fixed decimals, never "-0.000"
const fn = (name, d, k = 1) => (v) => `color(${name} ${v.map((x) => f(x / k, d)).join(' ')})`

/** library space id → its CSS Color 4 serializer */
export const CSS = {
	rgb: (v) => `rgb(${n(v[0])} ${n(v[1])} ${n(v[2])})`,
	hsl: (v) => `hsl(${n(v[0])} ${f(v[1], 1)}% ${f(v[2], 1)}%)`,
	hwb: (v) => `hwb(${n(v[0])} ${f(v[1], 1)}% ${f(v[2], 1)}%)`,
	lab: (v) => `lab(${f(v[0], 2)}% ${f(v[1], 2)} ${f(v[2], 2)})`,
	lchab: (v) => `lch(${f(v[0], 2)}% ${f(v[1], 2)} ${f(v[2], 2)})`,
	oklab: (v) => `oklab(${f(v[0], 4)} ${f(v[1], 4)} ${f(v[2], 4)})`,
	oklch: (v) => `oklch(${f(v[0], 4)} ${f(v[1], 4)} ${f(v[2], 1)})`,
	p3: fn('display-p3', 4),
	a98rgb: fn('a98-rgb', 3),
	prophoto: fn('prophoto-rgb', 3),
	xyz: fn('xyz-d65', 3, 100),
	'xyz-d50': fn('xyz-d50', 3, 100),
	lrgb: fn('srgb-linear', 3),
}

/** the library spaces CSS can write natively */
export const CSSABLE = new Set(Object.keys(CSS))

/** `space`'s values as a CSS string; undefined when CSS has no notation for the space */
export const css = (space, v) => CSS[space]?.(v)

/** sRGB 0–255 → #rrggbb (rounded, clamped) */
export const hex = (rgb) => '#' + rgb.slice(0, 3).map((x) => Math.min(255, Math.max(0, n(x))).toString(16).padStart(2, '0')).join('')

// Where CSS clamps at parsed-value time, a value past the bound makes the string name a
// different color: rgb() components clamp to [0, 255] (#rgb-functions); hsl() and hwb()
// resolve to sRGB (#the-hsl-notation, #the-hwb-notation); lightness clamps for lab()/lch()
// to [0, 100] (#specifying-lab-lch) and for oklab()/oklch() to [0, 1]
// (#specifying-oklab-oklch). color() keeps out-of-range values (#color-function).
const SRGB = new Set(['rgb', 'hsl', 'hwb']), LMAX = { lab: 100, lchab: 100, oklab: 1, oklch: 1 }
const EPS = 1e-4

/** Does css(space, v) name this exact color? `srgb` = whether the color sits inside sRGB. */
export const exact = (space, v, srgb) => v.every(Number.isFinite)
	&& (SRGB.has(space) ? !!srgb : !(space in LMAX) || (v[0] >= -EPS && v[0] <= LMAX[space] + EPS))
