/**
 * ACEScc — the Academy Color Encoding System's logarithmic grading space, sharing the
 * AP1 primaries with ACEScg but applying a pure log2 curve so exposure stops map to
 * code values the way film-trained colorists expect. Unlike its sibling ACEScct, it
 * has no linear toe near black, favoring mathematical purity over legacy
 * grading-control behavior. It's used as the working space for color grading within
 * ACES-managed post-production pipelines, ahead of final render back to ACEScg or
 * ACES2065-1.
 *
 * @see {@link https://docs.acescentral.com/encodings/acescc/}
 * @wiki {@link https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACEScc_&_ACEScct}
 * @year 2014
 * @by Academy (AMPAS)
 * @use Log2 color-grading working space in ACES post-production; current, though largely superseded by ACEScct on legacy grading control surfaces.
 * @channel {R} -0.35828683 1.4679963120447153 Red
 * @channel {G} -0.35828683 1.4679963120447153 Green
 * @channel {B} -0.35828683 1.4679963120447153 Blue
 * @method transfer
 * @encoding log
 * @referred scene
 * @dynamic hdr
 */
import acescg from './acescg.js';
import xyz from './xyz.js';

// Exact ACEScc log bounds (S-2014-003): (log2(2^-16)+9.72)/17.52 .. (log2(65504)+9.72)/17.52
const LO = -0.35828683, HI = 1.4679963120447153;
const acescc = {
	name: 'acescc',
	range: [[LO, HI], [LO, HI], [LO, HI]]
};

const eps = Math.pow(2, -16);
const low = (9.72 - 15) / 17.52;

function toLinear(val) {
	// ACEScc (Log) -> ACEScg (Linear)
	if (val <= low) {
		return (Math.pow(2, val * 17.52 - 9.72) - eps) * 2;
	} else if (val < 1.468) {
		return Math.pow(2, val * 17.52 - 9.72);
	} else {
		return 65504;
	}
}

function fromLinear(val) {
	// ACEScg (Linear) -> ACEScc (Log)
	if (val <= 0) {
		return (Math.log2(eps) + 9.72) / 17.52;
	} else if (val < eps) {
		return (Math.log2(eps + val * 0.5) + 9.72) / 17.52;
	} else {
		return (Math.log2(val) + 9.72) / 17.52;
	}
}

acescc.xyz = (r, g, b) => {
	// ACEScc -> ACEScgLinear -> XYZ
	// Reuse acescg.xyz logic by passing linear values
	return acescg.xyz(toLinear(r), toLinear(g), toLinear(b));
}

xyz.acescc = (x, y, z) => {
	// XYZ -> ACEScgLinear -> ACEScc
	const [r, g, b] = xyz.acescg(x, y, z);
	return [fromLinear(r), fromLinear(g), fromLinear(b)];
}

export default acescc;
