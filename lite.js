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
 * The set is the working pipeline: rgb/lrgb/xyz with xyz-d50, xyY and LMS; the
 * display RGBs (P3, Rec. 2020, Adobe RGB, ProPhoto, Rec. 709); HSL/HSV/HWB; the
 * OKLab family; CIE Lab/Luv + DIN99; CAM16 and HCT; Y′CbCr, HDR opponent spaces,
 * ACES and camera logs; RYB and Munsell. CMYK (four channels) and the rest live
 * in the full catalog.
 * Parity with wasm's `spaces` list is pinned by test/batch.js.
 *
 * @module color-space/lite
 */
import { createHub, registerSpace } from './hub.js'
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
import xyzD50 from './spaces/xyz-d50.js'
import xyy from './spaces/xyy.js'
import lms from './spaces/lms.js'
import p3 from './spaces/p3.js'
import p3Linear from './spaces/p3-linear.js'
import rec2020 from './spaces/rec2020.js'
import rec2020Linear from './spaces/rec2020-linear.js'
import a98rgb from './spaces/a98rgb.js'
import a98Linear from './spaces/a98rgb-linear.js'
import prophoto from './spaces/prophoto.js'
import prophotoLinear from './spaces/prophoto-linear.js'
import rec709 from './spaces/rec709.js'
import hsl from './spaces/hsl.js'
import hsv from './spaces/hsv.js'
import hwb from './spaces/hwb.js'
import cam16 from './spaces/cam16.js'
import hct from './spaces/hct.js'
import ycbcrBt709 from './spaces/ycbcr-bt709.js'
import ycbcrBt2020 from './spaces/ycbcr-bt2020.js'
import ictcpHlg from './spaces/ictcp-hlg.js'
import acescg from './spaces/acescg.js'
import acescct from './spaces/acescct.js'
import acescc from './spaces/acescc.js'
import awg3 from './spaces/awg3.js'
import logc3 from './spaces/logc3.js'
import ryb from './spaces/ryb.js'
import munsell, { xyyMunsell } from './spaces/munsell.js'

/**
 * Dict with the compact space set, graph-wired: any space here converts to any
 * other, in scalar or batch form (see hub.js).
 */
xyy.munsell = xyyMunsell
const space = createHub([rgb, lrgb, xyz, xyzD50, xyy, lms, p3, p3Linear, rec2020, rec2020Linear, a98rgb, a98Linear, prophoto, prophotoLinear, rec709, hsl, hsv, hwb, oklab, oklrab, oklch, oklrch, lab, lchab, labD65, lchD65, din99oLab, din99oLch, din99d, luv, lchuv, hsluv, hpluv, cam16, hct, ycbcrBt709, ycbcrBt2020, jzazbz, jzczhz, ictcp, ictcpHlg, ipt, acescg, acescct, acescc, awg3, logc3, logc4, slog3, vlog, log3g10, clog2, ryb, munsell]);
export default space;

/**
 * Register a color space with one or more edges in each direction, then wire it
 * to every existing space. Methods on `newSpace` point OUT; `reverse` supplies the
 * inverse existing→new edges. Both are required so the hub stays any-to-any.
 * @param {space} newSpace
 * @param {Object<string, Function>} reverse existing-space name → existing→new converter
 */
export function register(newSpace, reverse) {
	return registerSpace(space, newSpace, reverse);
}
