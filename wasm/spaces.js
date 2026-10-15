/**
 * The 54 three-channel spaces compiled into color-space/wasm.
 * Kept as a data-only module so the atlas can describe WASM coverage without
 * downloading the inlined binary or instantiating the kernel.
 */
export const spaces = [
	'rgb', 'lrgb', 'xyz', 'xyz-d50', 'xyy', 'lms',
	'p3', 'p3-linear', 'rec2020', 'rec2020-linear', 'a98rgb', 'a98rgb-linear', 'prophoto', 'prophoto-linear', 'rec709',
	'hsl', 'hsv', 'hwb',
	'oklab', 'oklrab', 'oklch', 'oklrch',
	'lab', 'lchab', 'lab-d65', 'lch-d65', 'din99o-lab', 'din99o-lch',
	'luv', 'lchuv', 'hsluv', 'hpluv', 'cam16', 'hct',
	'ycbcr-bt709', 'ycbcr-bt2020', 'jzazbz', 'jzczhz', 'ictcp', 'ictcp-hlg', 'ipt', 'din99d',
	'acescg', 'acescct', 'acescc', 'awg3', 'logc3', 'logc4', 'slog3', 'vlog', 'log3g10', 'clog2',
	'ryb', 'munsell',
]

export default spaces
