// Catalog sections (README grouping). Spaces not listed fall into "more".
export default [
	{ name: 'Display & web', spaces: ['rgb', 'lrgb', 'scrgb', 'p3', 'p3-linear', 'dci-p3', 'rec2020', 'rec2020-linear', 'rec709', 'a98rgb', 'a98rgb-linear', 'prophoto', 'prophoto-linear', 'rimm', 'cie-rgb', 'ntsc', 'pal', 'apple-rgb', 'smpte-240m'] },
	{ name: 'Cylindrical', spaces: ['hsl', 'hsv', 'hwb', 'hsi', 'hcg', 'hcl', 'hsp', 'hcy', 'hsm'] },
	{ name: 'Perceptual — modern', spaces: ['oklab', 'oklch', 'okhsl', 'okhsv', 'okhwb', 'oklrab', 'oklrch', 'hct', 'sucs', 'prolab', 'srlab2', 'igpgtg'] },
	{ name: 'Perceptual — CIE classic', spaces: ['lab', 'lchab', 'lab-d65', 'lch-d65', 'luv', 'lchuv', 'hsluv', 'hpluv', 'labh', 'ucs', 'uvw', 'din99o-lab', 'din99o-lch', 'din99d', 'anlab'] },
	{ name: 'HDR & wide gamut', spaces: ['jzazbz', 'jzczhz', 'izazbz', 'rec2100-pq', 'rec2100-hlg', 'rec2100-linear', 'ictcp', 'ipt', 'hdr-ipt', 'hdr-cie-lab', 'icacb'] },
	{ name: 'Colorimetry & vision', spaces: ['xyz', 'xyy', 'xyz-d50', 'xyz-abs-d65', 'lms', 'uv', 'macboyn', 'dkl', 'gray', 'dsh', 'kelvin', 'wavelength', 'rg', 'yrg'] },
	{ name: 'Video & broadcast', spaces: ['yuv', 'yiq', 'ycbcr', 'yccbccrc', 'ypbpr', 'ydbdr', 'ycgco', 'jpeg', 'xvycc', 'smpte-c', 'photoycc'] },
	{ name: 'Film & camera', spaces: ['acescg', 'acescc', 'acescct', 'aces2065-1', 'logc3', 'logc4', 'slog2', 'slog3', 'vlog', 'log3g10', 'clog', 'clog2', 'clog3', 'flog', 'flog2', 'nlog', 'applelog', 'bmdfilm', 'dlog', 'cineon', 'davinci', 'tlog', 'dcdm', 'slog', 'acesproxy', 'erimm', 'llog', 'protune', 'milog', 'olog', 'redlog', 'redlogfilm', 'log3g12', 'panalog', 'viperlog', 'filmicpro'] },
	{ name: 'Appearance models', spaces: ['cam16', 'cam16-ucs', 'cam16-lcd', 'cam16-scd', 'ciecam02', 'cam02-ucs', 'cam02-lcd', 'cam02-scd', 'hellwig2022', 'zcam', 'rlab'] },
	{ name: 'Print & physical', spaces: ['cmyk', 'cmy', 'munsell', 'ral-design', 'coloroid', 'ryb'] },
	{ name: 'Specialty & research', spaces: ['cubehelix', 'tsl', 'yes', 'osaucs', 'xyb', 'ohta', 'lalphabeta'] },
]
