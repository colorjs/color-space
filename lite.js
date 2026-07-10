/**
 * color-space/lite — the compact hub: exactly the spaces `color-space/wasm`
 * covers, as plain JS. Same registry shape, same two-form conversions
 * (scalar args → array, interleaved array-like → new Float64Array), so the
 * three hubs interchange freely:
 *
 *     color-space       all spaces, JS
 *     color-space/lite  the modern working set below, JS, a fraction of the bundle
 *     color-space/wasm  the same set, prebuilt WASM — faster on whole buffers
 *
 * The set is the numeric working pipeline: rgb/lrgb/xyz, the OKLab family,
 * CIE Lab/Luv + DIN99, HDR opponent spaces, and camera logs. Device cylinders
 * (HSL/HSV…) and lookup/appearance spaces live in the full catalog.
 * Parity with wasm's `spaces` list is pinned by test/batch.js.
 *
 * @module color-space/lite
 */
import { createHub, wire } from './hub.js'
import rgb from './rgb.js'
import lrgb from './lrgb.js'
import xyz from './xyz.js'
import oklab from './oklab.js'
import oklrab from './oklrab.js'
import oklch from './oklch.js'
import oklrch from './oklrch.js'
import lab from './lab.js'
import lchab from './lchab.js'
import labD65 from './lab-d65.js'
import lchD65 from './lch-d65.js'
import din99oLab from './din99o-lab.js'
import din99oLch from './din99o-lch.js'
import din99d from './din99d.js'
import luv from './luv.js'
import lchuv from './lchuv.js'
import hsluv from './hsluv.js'
import hpluv from './hpluv.js'
import jzazbz from './jzazbz.js'
import jzczhz from './jzczhz.js'
import ictcp from './ictcp.js'
import ipt from './ipt.js'
import logc4 from './logc4.js'
import slog3 from './slog3.js'
import vlog from './vlog.js'
import log3g10 from './log3g10.js'
import clog2 from './clog2.js'

/**
 * Dict with the compact space set, graph-wired: any space here converts to any
 * other, in scalar or batch form (see hub.js).
 */
const space = createHub([rgb, lrgb, xyz, oklab, oklrab, oklch, oklrch, lab, lchab, labD65, lchD65, din99oLab, din99oLch, din99d, luv, lchuv, hsluv, hpluv, jzazbz, jzczhz, ictcp, ipt, logc4, slog3, vlog, log3g10, clog2]);
export default space;

/**
 * Register a color space and (re)wire conversions to/from every other space.
 * @param {space} newSpace
 */
export function register(newSpace) {
	space[newSpace.name] = newSpace;
	wire(space);
	return space;
}
