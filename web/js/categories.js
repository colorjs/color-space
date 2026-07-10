// Catalog sections (README grouping). Spaces not listed fall into "more".
// Order within a section = popularity/relevance: the first three are its folded preview.
export default [
	{ name: 'Display & web', spaces: ['rgb', 'p3', 'rec2020', 'lrgb', 'rec709', 'prophoto', 'a98rgb', 'dci-p3', 'p3-linear', 'rec2020-linear', 'a98rgb-linear', 'prophoto-linear', 'scrgb', 'rimm', 'cie-rgb', 'ntsc', 'pal', 'apple-rgb', 'smpte-240m'] },
	{ name: 'Cylindrical', spaces: ['hsl', 'hsv', 'hwb', 'hsi', 'hcg', 'hcl', 'hsp', 'hcy', 'hsm'] },
	{ name: 'Perceptual — modern', spaces: ['oklch', 'oklab', 'hct', 'okhsl', 'okhsv', 'okhwb', 'oklrab', 'oklrch', 'srlab2', 'prolab', 'sucs', 'igpgtg'] },
	{ name: 'Perceptual — CIE classic', spaces: ['lab', 'lchab', 'luv', 'hsluv', 'lchuv', 'lab-d65', 'lch-d65', 'hpluv', 'din99o-lab', 'din99o-lch', 'din99d', 'labh', 'ucs', 'uvw', 'anlab'] },
	{ name: 'HDR & wide gamut', spaces: ['ictcp', 'jzazbz', 'rec2100-pq', 'rec2100-hlg', 'jzczhz', 'ipt', 'izazbz', 'rec2100-linear', 'hdr-ipt', 'hdr-cie-lab', 'icacb'] },
	{ name: 'Colorimetry & vision', spaces: ['xyz', 'xyy', 'lms', 'xyz-d50', 'uv', 'kelvin', 'wavelength', 'xyz-abs-d65', 'macboyn', 'dkl', 'gray', 'dsh', 'rg', 'yrg'] },
	{ name: 'Video & broadcast', spaces: ['ycbcr', 'yuv', 'yiq', 'ypbpr', 'ycgco', 'jpeg', 'ydbdr', 'yccbccrc', 'xvycc', 'smpte-c', 'photoycc'] },
	{ name: 'Film & camera', spaces: ['acescg', 'acescc', 'logc3', 'slog3', 'aces2065-1', 'acescct', 'logc4', 'cineon', 'davinci', 'slog2', 'vlog', 'log3g10', 'clog', 'clog2', 'clog3', 'flog', 'flog2', 'nlog', 'applelog', 'bmdfilm', 'dlog', 'tlog', 'dcdm', 'slog', 'acesproxy', 'erimm', 'llog', 'protune', 'milog', 'olog', 'redlog', 'redlogfilm', 'log3g12', 'panalog', 'viperlog', 'filmicpro'] },
	{ name: 'Appearance models', spaces: ['cam16', 'ciecam02', 'cam16-ucs', 'zcam', 'cam02-ucs', 'cam16-lcd', 'cam16-scd', 'cam02-lcd', 'cam02-scd', 'hellwig2022', 'rlab', 'llab', 'nayatani95', 'hunt', 'atd95'] },
	{ name: 'Print & physical', spaces: ['cmyk', 'munsell', 'ryb', 'cmy', 'ral-design', 'coloroid', 'ostwald'] },
	{ name: 'Specialty & research', spaces: ['cubehelix', 'xyb', 'osaucs', 'tsl', 'yes', 'ohta', 'lalphabeta'] },
]
