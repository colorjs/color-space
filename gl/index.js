/**
 * color-space/gl/all — every color space as a GLSL (and, via ./wgsl.js, WGSL)
 * shader chunk, routable by name. This is the full-catalog registry: for
 * build-time-known spaces prefer `color-space/gl` (the lean composer).
 *
 *     import { glsl } from 'color-space/gl/all'
 *     const src = glsl('rgb', 'oklch')
 *     // → self-contained GLSL defining `vec3 rgb_oklch(vec3 c)` (plus the chunks
 *     //   it composes through), ready to paste/interpolate into any shader.
 *
 * Same hub-spoke graph as the JS library and the WASM kernel: each chunk declares
 * primitive edges to its natural neighbours; `glsl(from, to)` BFS-composes the
 * shortest path and emits only the code that path needs. A single chunk is also
 * importable directly (`import oklab from 'color-space/gl/oklab.glsl.js'`) as
 * `{ name, deps, edges, code }` for manual embedding — or composed without this
 * registry at a fraction of the bundle via ./compose.js (each chunk's `deps`
 * carries its own chain).
 *
 * Chunks target GLSL ES 3.00 (WebGL2) and also run under GLSL ES 1.00 (WebGL1)
 * unless they use const arrays or a `lut`. No `#version`, no `precision`, no
 * uniforms (a declared `lut` adds exactly one sampler — below) — pure function
 * libraries; the host shader supplies its own preamble. These are FUNCTION CHUNKS
 * in the three.js `*.glsl.js` mold, not `.vert`/`.frag` pipeline shaders —
 * nothing here compiles standalone, everything pastes into your stage.
 *
 * CHUNK CONTRACT (authoring gl/<space>.glsl.js — the subset keeps every chunk valid
 * GLSL, mechanically translatable to WGSL, and evaluable as JS for testing):
 * - Scalar math only: no vector/matrix arithmetic. vecN appears ONLY as function
 *   parameter/return, as the `vecN(a, b, c)` constructor, and as a local holding
 *   a helper/lut result for component reads (c.x/c.y/c.z/c.w). Expand matrix
 *   products into scalar rows.
 * - Edge functions: `vec3 <a>_<b>(vec3 c)` — a/b = space names, hyphens stripped
 *   (lab-d65 → labd65). Declared in `edges`: { neighbour: [intoThisSpace,
 *   outOfThisSpace] } — GLSL function names, or null for a one-way edge.
 * - Non-3-channel spaces (gray, kelvin, wavelength → float; rg → vec2;
 *   cmyk → vec4) declare `dim: 1|2|4`; their edge fns use that type.
 * - Private helpers are prefixed with the chunk name + trailing underscore
 *   (`oklab_toe_`) so composed sources never collide.
 * - No ternaries (WGSL lacks ?:) — use if/return, if/else, or mix/step.
 * - Never reassign a parameter (WGSL params are immutable) — copy to a local.
 * - Float literals always carry a dot (`1.0`, `1.0 / 3.0`).
 * - Builtins allowed: pow abs sign floor ceil sqrt exp log exp2 log2 sin cos tan
 *   asin acos min max clamp mix step fract. For everything else use the util
 *   helpers (auto-included when referenced): cbrt_ spow_ atan2_ mod_ polar_fwd
 *   polar_inv. NEVER call two-arg atan(), mod(), or pow() with a possibly
 *   negative base — their WGSL/GLSL/JS semantics diverge; use the helpers.
 * - Constant tables: `const float NAME_[N] = float[N](v0, v1, …);` as one
 *   statement (marks the chunk GLSL ES 3.00-only).
 * - Measured datasets too large for a const table declare `lut: { name, w, h,
 *   data }` (name `<chunk>_<x>_`-prefixed; data() → w·h·4 Float32Array). The
 *   composer emits `vec4 <name>(int i, int j)` backed by `uniform sampler2D
 *   <name>tex` — the ONE uniform a composed source may carry; the host uploads
 *   data() (RGBA32F, NEAREST) and binds it by that name (WGSL: texture_2d<f32>
 *   bindings in declaration order). texelFetch is exact — interpolation stays
 *   in chunk code, so JS, GLSL and WGSL read identical numbers.
 * - A chunk calling another chunk's functions declares `requires: ['thatChunk']`.
 * - `deps` imports every chunk named in `edges`/`requires` (rgb, the fileless
 *   root, excepted) — what lets ./compose.js build lean, registry-free bundles;
 *   test/gl.js enforces the invariant.
 * - Loops only as `for (int i = 0; i < N; i++)` with fixed bounds; cast the
 *   index into float math with `float(i)` (and back with `int(x)`).
 * - Iterative / table-interpolated chunks may declare `tol` — the normalized
 *   error bound test/gl.js holds them to (default 1e-6; justify anything above).
 *
 * @module color-space/gl/all
 */
import { compose } from './compose.js'
import xyz from './xyz.glsl.js'
import hsl from './hsl.glsl.js'
import hsv from './hsv.glsl.js'
import hsi from './hsi.glsl.js'
import hwb from './hwb.glsl.js'
import cmyk from './cmyk.glsl.js'
import cmy from './cmy.glsl.js'
import xyy from './xyy.glsl.js'
import yiq from './yiq.glsl.js'
import yuv from './yuv.glsl.js'
import ydbdr from './ydbdr.glsl.js'
import ycgco from './ycgco.glsl.js'
import ypbpr from './ypbpr.glsl.js'
import ycbcr from './ycbcr.glsl.js'
import ycbcr_bt601_525 from './ycbcr-bt601-525.glsl.js'
import ycbcr_bt601_625 from './ycbcr-bt601-625.glsl.js'
import ycbcr_bt709 from './ycbcr-bt709.glsl.js'
import ycbcr_bt2020 from './ycbcr-bt2020.glsl.js'
import xvycc from './xvycc.glsl.js'
import yccbccrc from './yccbccrc.glsl.js'
import ucs from './ucs.glsl.js'
import uvw from './uvw.glsl.js'
import jpeg from './jpeg.glsl.js'
import lab from './lab.glsl.js'
import labh from './labh.glsl.js'
import lms from './lms.glsl.js'
import maxwell from './maxwell.glsl.js'
import lchab from './lchab.glsl.js'
import luv from './luv.glsl.js'
import lchuv from './lchuv.glsl.js'
import hsluv from './hsluv.glsl.js'
import hpluv from './hpluv.glsl.js'
import coloroid from './coloroid.glsl.js'
import hcg from './hcg.glsl.js'
import hcy from './hcy.glsl.js'
import tsl from './tsl.glsl.js'
import yes from './yes.glsl.js'
import osaucs from './osaucs.glsl.js'
import hsp from './hsp.glsl.js'
import hsm from './hsm.glsl.js'
import lrgb from './lrgb.glsl.js'
import oklab from './oklab.glsl.js'
import oklch from './oklch.glsl.js'
import okhsl from './okhsl.glsl.js'
import okhsv from './okhsv.glsl.js'
import oklrab from './oklrab.glsl.js'
import oklrch from './oklrch.glsl.js'
import jzazbz from './jzazbz.glsl.js'
import jzczhz from './jzczhz.glsl.js'
import p3 from './p3.glsl.js'
import p3_linear from './p3-linear.glsl.js'
import rec2020 from './rec2020.glsl.js'
import rec2020_linear from './rec2020-linear.glsl.js'
import rec2100_pq from './rec2100-pq.glsl.js'
import rec2100_hlg from './rec2100-hlg.glsl.js'
import a98rgb from './a98rgb.glsl.js'
import a98rgb_linear from './a98rgb-linear.glsl.js'
import prophoto from './prophoto.glsl.js'
import prophoto_linear from './prophoto-linear.glsl.js'
import acescg from './acescg.glsl.js'
import acescc from './acescc.glsl.js'
import ictcp from './ictcp.glsl.js'
import cam16 from './cam16.glsl.js'
import hct from './hct.glsl.js'
import xyz_d50 from './xyz-d50.glsl.js'
import xyz_abs_d65 from './xyz-abs-d65.glsl.js'
import lab_d65 from './lab-d65.glsl.js'
import gray from './gray.glsl.js'
import rg from './rg.glsl.js'
import hcl from './hcl.glsl.js'
import din99o_lab from './din99o-lab.glsl.js'
import din99o_lch from './din99o-lch.glsl.js'
import xyb from './xyb.glsl.js'
import lch_d65 from './lch-d65.glsl.js'
import cam16_ucs from './cam16-ucs.glsl.js'
import okhwb from './okhwb.glsl.js'
import aces2065_1 from './aces2065-1.glsl.js'
import acescct from './acescct.glsl.js'
import rec709 from './rec709.glsl.js'
import logc4 from './logc4.glsl.js'
import slog3 from './slog3.glsl.js'
import vlog from './vlog.glsl.js'
import log3g10 from './log3g10.glsl.js'
import clog2 from './clog2.glsl.js'
import dci_p3 from './dci-p3.glsl.js'
import smpte_c from './smpte-c.glsl.js'
import ipt from './ipt.glsl.js'
import scrgb from './scrgb.glsl.js'
import rec2100_linear from './rec2100-linear.glsl.js'
import din99d from './din99d.glsl.js'
import ciecam02 from './ciecam02.glsl.js'
import cam02_ucs from './cam02-ucs.glsl.js'
import photoycc from './photoycc.glsl.js'
import dsh from './dsh.glsl.js'
import ral_design from './ral-design.glsl.js'
import munsell from './munsell.glsl.js'
import uv from './uv.glsl.js'
import ohta from './ohta.glsl.js'
import anlab from './anlab.glsl.js'
import cie_rgb from './cie-rgb.glsl.js'
import ntsc from './ntsc.glsl.js'
import apple_rgb from './apple-rgb.glsl.js'
import pal from './pal.glsl.js'
import smpte_240m from './smpte-240m.glsl.js'
import rimm from './rimm.glsl.js'
import cineon from './cineon.glsl.js'
import logc3 from './logc3.glsl.js'
import slog2 from './slog2.glsl.js'
import clog from './clog.glsl.js'
import clog3 from './clog3.glsl.js'
import bmdfilm from './bmdfilm.glsl.js'
import flog from './flog.glsl.js'
import flog2 from './flog2.glsl.js'
import nlog from './nlog.glsl.js'
import applelog from './applelog.glsl.js'
import cam02_lcd from './cam02-lcd.glsl.js'
import cam02_scd from './cam02-scd.glsl.js'
import cam16_lcd from './cam16-lcd.glsl.js'
import cam16_scd from './cam16-scd.glsl.js'
import prolab from './prolab.glsl.js'
import dlog from './dlog.glsl.js'
import sucs from './sucs.glsl.js'
import hellwig2022 from './hellwig2022.glsl.js'
import izazbz from './izazbz.glsl.js'
import zcam from './zcam.glsl.js'
import macboyn from './macboyn.glsl.js'
import kelvin from './kelvin.glsl.js'
import cct_duv from './cct-duv.glsl.js'
import wavelength from './wavelength.glsl.js'
import icacb from './icacb.glsl.js'
import hdr_ipt from './hdr-ipt.glsl.js'
import hdr_cie_lab from './hdr-cie-lab.glsl.js'
import srlab2 from './srlab2.glsl.js'
import dkl from './dkl.glsl.js'
import rlab from './rlab.glsl.js'
import ryb from './ryb.glsl.js'
import davinci from './davinci.glsl.js'
import tlog from './tlog.glsl.js'
import dcdm from './dcdm.glsl.js'
import lalphabeta from './lalphabeta.glsl.js'
import yrg from './yrg.glsl.js'
import igpgtg from './igpgtg.glsl.js'
import slog from './slog.glsl.js'
import acesproxy from './acesproxy.glsl.js'
import redlog from './redlog.glsl.js'
import redlogfilm from './redlogfilm.glsl.js'
import log3g12 from './log3g12.glsl.js'
import panalog from './panalog.glsl.js'
import viperlog from './viperlog.glsl.js'
import llog from './llog.glsl.js'
import protune from './protune.glsl.js'
import milog from './milog.glsl.js'
import olog from './olog.glsl.js'
import filmicpro from './filmicpro.glsl.js'
import erimm from './erimm.glsl.js'
import llab from './llab.glsl.js'
import nayatani95 from './nayatani95.glsl.js'
import hunt from './hunt.glsl.js'
import ostwald from './ostwald.glsl.js'
import atd95 from './atd95.glsl.js'
import sgamut3cine from './sgamut3cine.glsl.js'

/** The full registry: every chunk, ready-composed (lean tier: color-space/gl). */
const reg = compose([xyz, hsl, hsv, hsi, hwb, cmyk, cmy, xyy, yiq, yuv, ydbdr, ycgco, ypbpr, ycbcr, ycbcr_bt601_525, ycbcr_bt601_625, ycbcr_bt709, ycbcr_bt2020, xvycc, yccbccrc, ucs, uvw, jpeg, lab, labh, lms, maxwell, lchab, luv, lchuv, hsluv, hpluv, coloroid, hcg, hcy, tsl, yes, osaucs, hsp, hsm, lrgb, oklab, oklch, okhsl, okhsv, oklrab, oklrch, jzazbz, jzczhz, p3, p3_linear, rec2020, rec2020_linear, rec2100_pq, rec2100_hlg, a98rgb, a98rgb_linear, prophoto, prophoto_linear, acescg, acescc, ictcp, cam16, hct, xyz_d50, xyz_abs_d65, lab_d65, gray, rg, hcl, din99o_lab, din99o_lch, xyb, lch_d65, cam16_ucs, okhwb, aces2065_1, acescct, rec709, logc4, slog3, vlog, log3g10, clog2, dci_p3, smpte_c, ipt, scrgb, rec2100_linear, din99d, ciecam02, cam02_ucs, photoycc, dsh, ral_design, munsell, uv, ohta, anlab, cie_rgb, ntsc, apple_rgb, pal, smpte_240m, rimm, cineon, logc3, slog2, clog, clog3, bmdfilm, flog, flog2, nlog, applelog, cam02_lcd, cam02_scd, cam16_lcd, cam16_scd, prolab, dlog, sucs, hellwig2022, izazbz, zcam, macboyn, kelvin, cct_duv, wavelength, icacb, hdr_ipt, hdr_cie_lab, srlab2, dkl, rlab, ryb, davinci, tlog, dcdm, lalphabeta, yrg, igpgtg, slog, acesproxy, redlog, redlogfilm, log3g12, panalog, viperlog, llog, protune, milog, olog, filmicpro, erimm, llab, nayatani95, hunt, ostwald, atd95, sgamut3cine])

/** All chunks by space name (rgb is the root — it has no chunk of its own). */
export const chunks = reg.chunks

/** Directed edge graph: graph[a][b] = { fn, chunk } (primitive step a → b). */
export const graph = reg.graph

/** LUT descriptors by name — { name, w, h, data } for every measured-dataset
 *  chunk (munsell's renotation). A composed source that reads one declares
 *  `uniform sampler2D <name>tex`; upload data() (w×h RGBA32F, NEAREST) there. */
export const luts = reg.luts

/** Space names reachable by the composer (edges declared), rgb included. */
export const spaces = Object.keys(graph)

/**
 * Compose the GLSL source converting `from` → `to`: every chunk the shortest
 * path needs plus an entry function `${from}_${to}` (hyphens stripped),
 * e.g. `glsl('rgb', 'oklch')` → `vec3 rgb_oklch(vec3 c)`.
 *
 * One shader often needs several conversions (paint in one space, gamut-test in
 * another): pass an array of pairs — `glsl([['oklch','rgb'], ['oklch','xyz'],
 * ['xyz','p3-linear']])` — to get a single source with every entry function and
 * each chunk emitted once.
 * @param {string|Array<[string,string]>} from source space name, or pair list
 * @param {string} [to] target space name
 * @returns {string} self-contained GLSL source
 */
export const glsl = reg.glsl

export default glsl
