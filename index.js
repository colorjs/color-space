/**
 * Color space data and conversions
 *
 * @module color-space
 *
 */
import rgb from './rgb.js'
import hsl from './hsl.js'
import hsv from './hsv.js'
import hsi from './hsi.js'
import hwb from './hwb.js'
import cmyk from './cmyk.js'
import cmy from './cmy.js'
import xyz from './xyz.js'
import xyy from './xyy.js'
import yiq from './yiq.js'
import yuv from './yuv.js'
import ydbdr from './ydbdr.js'
import ycgco from './ycgco.js'
import ypbpr from './ypbpr.js'
import ycbcr from './ycbcr.js'
import xvycc from './xvycc.js'
import yccbccrc from './yccbccrc.js'
import ucs from './ucs.js'
import uvw from './uvw.js'
import jpeg from './jpeg.js'
import lab from './lab.js'
import labh from './labh.js'
import lms from './lms.js'
import lchab from './lchab.js'
import luv from './luv.js'
import lchuv from './lchuv.js'
import hsluv from './hsluv.js'
import hpluv from './hpluv.js'
import cubehelix from './cubehelix.js'
import coloroid from './coloroid.js'
import hcg from './hcg.js'
import hcy from './hcy.js'
import tsl from './tsl.js'
import yes from './yes.js'
import osaucs from './osaucs.js'
import hsp from './hsp.js'
import hsm from './hsm.js'
import lrgb from './lrgb.js'
import oklab from './oklab.js'
import oklch from './oklch.js'
import okhsl from './okhsl.js'
import okhsv from './okhsv.js'
import oklrab from './oklrab.js'
import oklrch from './oklrch.js'
import jzazbz from './jzazbz.js'
import jzczhz from './jzczhz.js'
import p3 from './p3.js'
import p3Linear from './p3-linear.js'
import rec2020 from './rec2020.js'
import rec2020Linear from './rec2020-linear.js'
import rec2100pq from './rec2100-pq.js'
import rec2100hlg from './rec2100-hlg.js'
import a98rgb from './a98rgb.js'
import a98Linear from './a98rgb-linear.js'
import prophoto from './prophoto.js'
import prophotoLinear from './prophoto-linear.js'
import acescg from './acescg.js'
import acescc from './acescc.js'
import ictcp from './ictcp.js'
import cam16jmh from './cam16.js'
import hct from './hct.js'
import xyzD50 from './xyz-d50.js'
import xyzAbsD65 from './xyz-abs-d65.js'
import labD65 from './lab-d65.js'
import gray from './gray.js'
import rg from './rg.js'
import hcl from './hcl.js'
import din99oLab from './din99o-lab.js'
import din99oLch from './din99o-lch.js'
import xyb from './xyb.js'
import lchD65 from './lch-d65.js'
import cam16ucs from './cam16-ucs.js'
import okhwb from './okhwb.js'
import aces2065 from './aces2065-1.js'
import acescct from './acescct.js'
import rec709 from './rec709.js'
import logc4 from './logc4.js'
import slog3 from './slog3.js'
import vlog from './vlog.js'
import log3g10 from './log3g10.js'
import clog2 from './clog2.js'
import dciP3 from './dci-p3.js'
import smpteC from './smpte-c.js'
import ipt from './ipt.js'
import scrgb from './scrgb.js'
import rec2100Linear from './rec2100-linear.js'
import din99d from './din99d.js'
import ciecam02 from './ciecam02.js'
import cam02ucs from './cam02-ucs.js'

/**
 * Dict with all color spaces
 */
const space = {};
export default space;


/**
 * Wire conversions between every pair of spaces.
 *
 * Each space file declares conversions only to its natural neighbours (e.g.
 * `oklab.rgb`, `din99o-lab.lab`). This builds the conversion graph from those
 * direct edges and fills every remaining pair with the shortest-path
 * composition — so any space reaches any other with the fewest hops.
 */
function wire() {
	const names = Object.keys(space);

	// direct adjacency: conversions defined in the source files (not our compositions)
	const direct = {};
	for (const a of names) {
		direct[a] = {};
		for (const b of names)
			if (a !== b && typeof space[a][b] === 'function' && !space[a][b].chained)
				direct[a][b] = space[a][b];
	}

	// shortest path of direct conversions from `from` to `to` (BFS)
	const path = (from, to) => {
		const queue = [[from]], seen = new Set([from]);
		while (queue.length) {
			const p = queue.shift(), last = p[p.length - 1];
			for (const next in direct[last]) {
				if (next === to) return [...p, next];
				if (!seen.has(next)) { seen.add(next); queue.push([...p, next]); }
			}
		}
		return null;
	};

	for (const from of names) for (const to of names) {
		if (from === to || direct[from][to]) continue;
		const p = path(from, to);
		if (!p) continue;
		const steps = p.slice(1).map((n, i) => direct[p[i]][n]);
		const convert = (...args) => steps.reduce((vals, fn) => fn(...vals), args);
		convert.chained = true; // exclude from `direct` so re-wiring rebuilds from source edges
		space[from][to] = convert;
	}
}

/**
 * Register a color space and (re)wire conversions to/from every other space.
 * @param {space} newSpace
 */
export function register(newSpace) {
	space[newSpace.name] = newSpace;
	wire();
	return space;
}

// register all spaces, then wire the graph once
[rgb, xyz, hsl, hsv, hsi, hwb, cmyk, cmy, xyy, yiq, yuv, ydbdr, ycgco, ypbpr, ycbcr, xvycc, yccbccrc, ucs, uvw, jpeg, lab, labh, lms, lchab, luv, lchuv, hsluv, hpluv, cubehelix, coloroid, hcg, hcy, tsl, yes, osaucs, hsp, hsm, lrgb, oklab, oklch, okhsl, okhsv, oklrab, oklrch, jzazbz, jzczhz, p3, p3Linear, rec2020, rec2020Linear, rec2100pq, rec2100hlg, a98rgb, a98Linear, prophoto, prophotoLinear, acescg, acescc, ictcp, cam16jmh, hct, xyzD50, xyzAbsD65, labD65, gray, rg, hcl, din99oLab, din99oLch, xyb, lchD65, cam16ucs, okhwb, aces2065, acescct, rec709, logc4, slog3, vlog, log3g10, clog2, dciP3, smpteC, ipt, scrgb, rec2100Linear, din99d, ciecam02, cam02ucs].forEach(s => { space[s.name] = s; });
wire();
