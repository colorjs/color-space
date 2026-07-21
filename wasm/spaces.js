/**
 * The 27 three-channel spaces compiled into color-space/wasm.
 * Kept as a data-only module so the atlas can describe WASM coverage without
 * downloading the inlined binary or instantiating the kernel.
 */
export const spaces = [
	'rgb', 'lrgb', 'xyz',
	'oklab', 'oklrab', 'oklch', 'oklrch',
	'lab', 'lchab', 'lab-d65', 'lch-d65', 'din99o-lab', 'din99o-lch',
	'luv', 'lchuv', 'hsluv', 'hpluv',
	'jzazbz', 'jzczhz', 'ictcp', 'ipt', 'din99d',
	'logc4', 'slog3', 'vlog', 'log3g10', 'clog2',
]

export default spaces
