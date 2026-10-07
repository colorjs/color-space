// Catalog families – the shelves the page cuts by default (the owner's seven, 2026-10-06; the README lists them too).
// Order within a family = popularity/relevance, our starred ones first: the first three are its featured spaces. Spaces not listed fall
// into "more". tip: the family in one sentence – the rail shows it under the family on screen.
// id: the family's stable handle – its translation keys (cat.<id>.name, cat.<id>.tip) survive a renamed name.
export default [
	{ id: 'display', name: 'Display & web', tip: 'Working and delivery RGB spaces, from the web default to wider display gamuts.',
		spaces: ['rgb', 'p3', 'rec2020', 'lrgb', 'rec709', 'prophoto', 'a98rgb', 'dci-p3', 'p3-linear', 'rec2020-linear', 'a98rgb-linear', 'prophoto-linear', 'scrgb', 'rimm', 'cie-rgb', 'ntsc', 'pal', 'apple-rgb', 'smpte-240m'] },
	{ id: 'remixes', name: 'RGB remixes', tip: 'Hue, saturation and brightness controls built on RGB. Equal steps need not look equal.',
		spaces: ['hsl', 'hsv', 'hwb', 'hsi', 'hcg', 'hcl', 'hsp', 'hcy', 'hsm'] },
	{ id: 'perceptual', name: 'Perceptual', tip: 'Coordinates for comparing colors, building palettes and predicting appearance.',
		spaces: ['oklch', 'lab', 'cam16', 'oklab', 'hct', 'okhsl', 'okhsv', 'okhwb', 'oklrab', 'oklrch', 'srlab2', 'prolab', 'sucs', 'igpgtg', 'jzazbz', 'jzczhz', 'ipt', 'izazbz', 'hdr-ipt', 'lchab', 'luv', 'hsluv', 'lchuv', 'lab-d65', 'lch-d65', 'hpluv', 'din99o-lab', 'din99o-lch', 'din99d', 'labh', 'ucs', 'uvw', 'anlab', 'hdr-cie-lab', 'ciecam02', 'cam16-ucs', 'zcam', 'cam02-ucs', 'cam16-lcd', 'cam16-scd', 'cam02-lcd', 'cam02-scd', 'hellwig2022', 'rlab', 'llab', 'nayatani95', 'hunt', 'atd95'] },
	{ id: 'colorimetry', name: 'Colorimetry & research', tip: 'The measurement foundations, the eye, and specialized research coordinates.',
		spaces: ['xyz', 'xyy', 'lms', 'xyz-d50', 'uv', 'cct-duv', 'kelvin', 'maxwell', 'wavelength', 'xyz-abs-d65', 'macboyn', 'dkl', 'gray', 'dsh', 'rg', 'yrg', 'xyb', 'osaucs', 'tsl', 'yes', 'ohta', 'lalphabeta'] },
	{ id: 'video', name: 'Video & broadcast', tip: 'Separate brightness from color for broadcast, compression and HDR delivery.',
		spaces: ['ycbcr-bt709', 'ictcp', 'ycbcr-bt2020', 'ycbcr-bt601-525', 'ycbcr-bt601-625', 'ycbcr', 'yuv', 'yiq', 'ypbpr', 'ycgco', 'jpeg', 'ydbdr', 'yccbccrc', 'xvycc', 'smpte-c', 'photoycc', 'rec2100-pq', 'rec2100-hlg', 'rec2100-linear', 'icacb'] },
	{ id: 'camera', name: 'Film & camera', tip: 'Camera log encodings and working spaces for capturing and grading light.',
		spaces: ['acescg', 'logc3', 'acescc', 'slog3', 'sgamut3cine', 'aces2065-1', 'acescct', 'logc4', 'cineon', 'davinci', 'slog2', 'vlog', 'log3g10', 'clog', 'clog2', 'clog3', 'flog', 'flog2', 'flog2c', 'nlog', 'applelog', 'applelog2', 'bmdfilm', 'dlog', 'tlog', 'kinelog3', 'dcdm', 'slog', 'acesproxy', 'erimm', 'llog', 'protune', 'gplog2', 'ilog', 'milog', 'olog', 'samsunglog', 'redlog', 'redlogfilm', 'log3g12', 'panalog', 'viperlog', 'filmicpro'] },
	{ id: 'surface', name: 'Color order & surface', tip: 'Ink, paint and the measured organization of surface colors.',
		spaces: ['cmyk', 'munsell', 'ryb', 'cmy', 'ral-design', 'coloroid', 'ostwald'] },
]
