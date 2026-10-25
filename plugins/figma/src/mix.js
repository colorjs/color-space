/**
 * A gradient's colors between two stops, for the line the panel draws through them on the plane.
 *
 * Figma blends a gradient in the file's encoded RGB. A host whose gradients mix elsewhere names the space on its stops
 * (p.mix: { space, hue } – VS Code's CSS gradients): there the two colors are mixed channel by channel in that space
 * (CSS Color 4 #interpolation), a hue along its hue interpolation method (#hue-interpolation: shorter, longer,
 * increasing, decreasing) and taken from the other color where it is powerless, as an achromatic color's is
 * (#powerless). Premultiplied alpha is left out: the line is the colors' path, not their coverage.
 * @see https://drafts.csswg.org/css-color-4/#interpolation
 */
import { space } from '../../../web/js/core.js'
import { mix as mixIn, missing } from '../../../web/js/stops.js'

/**
 * @param {{space: string, hue?: string} | null | undefined} mix  the stops' mixing space (a library id); undefined: the
 *   file's RGB, as Figma; null: a space the library can't mix in (no line)
 * @param {string} id  the file's RGB (the library's 'rgb' or 'p3')
 * @param {number} scale  its channels' scale (255 or 1): stops are {r, g, b} 0..1
 * @returns {((a, b, f: number) => {r: number, g: number, b: number}) | null}  the color f of the way from a to b
 */
export function mixer(mix, id, scale) {
	if (mix === null) return null
	if (!mix) return (a, b, f) => ({ r: a.r + (b.r - a.r) * f, g: a.g + (b.g - a.g) * f, b: a.b + (b.b - a.b) * f })
	const sp = mix.space, base = c => [c.r * scale, c.g * scale, c.b * scale]
	const into = c => sp === id ? base(c) : missing(sp, space[id][sp](...base(c))), back = v => sp === id ? v : space[sp][id](...v)
	return (a, b, f) => { const v = back(mixIn(sp, into(a), into(b), f, mix.hue)); return { r: v[0] / scale, g: v[1] / scale, b: v[2] / scale } }
}
