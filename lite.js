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
import rgb from './spaces/rgb.js'
import lrgb from './spaces/lrgb.js'
import xyz from './spaces/xyz.js'
import oklab from './spaces/oklab.js'
import oklrab from './spaces/oklrab.js'
import oklch from './spaces/oklch.js'
import oklrch from './spaces/oklrch.js'
import lab from './spaces/lab.js'
import lchab from './spaces/lchab.js'
import labD65 from './spaces/lab-d65.js'
import lchD65 from './spaces/lch-d65.js'
import din99oLab from './spaces/din99o-lab.js'
import din99oLch from './spaces/din99o-lch.js'
import din99d from './spaces/din99d.js'
import luv from './spaces/luv.js'
import lchuv from './spaces/lchuv.js'
import hsluv from './spaces/hsluv.js'
import hpluv from './spaces/hpluv.js'
import jzazbz from './spaces/jzazbz.js'
import jzczhz from './spaces/jzczhz.js'
import ictcp from './spaces/ictcp.js'
import ipt from './spaces/ipt.js'
import logc4 from './spaces/logc4.js'
import slog3 from './spaces/slog3.js'
import vlog from './spaces/vlog.js'
import log3g10 from './spaces/log3g10.js'
import clog2 from './spaces/clog2.js'

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
