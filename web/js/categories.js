// Catalog families – the shelves the page cuts by default (the owner's seven, 2026-10-06; the README lists them too).
// Order within a family = popularity/relevance, our starred ones first: the first three are its featured spaces. Spaces not listed fall
// into "more". tip: the family in one sentence – the rail shows it under the family on screen.
// id: the family's stable handle – its translation keys (cat.<id>.name, cat.<id>.tip) survive a renamed name.
export default [
	{ id: 'display', name: 'Display & web', tip: 'Working and delivery RGB spaces, from the web default to wider display gamuts.',
		spaces: ['rgb', 'p3', 'rec2020', 'lrgb', 'rec709', 'prophoto', 'a98rgb', 'dci-p3', 'p3-linear', 'rec2020-linear', 'rec2020-display', 'rec709-display', 'rgb-display', 'a98rgb-linear', 'prophoto-linear', 'scrgb', 'rimm', 'cie-rgb', 'ntsc', 'pal', 'apple-rgb', 'smpte-240m', 'ecirgb', 'widegamut', 'colormatch', 'brucergb', 'betargb', 'bestrgb', 'donrgb4', 'ektaspace', 'russellrgb', 'prismatic'] },
	{ id: 'remixes', name: 'Cylindrical', tip: 'Hue, saturation and brightness controls built on RGB. Equal steps need not look equal.',
		spaces: ['hsl', 'hsv', 'hwb', 'hsi', 'ihls', 'hcg', 'hcl', 'hsp', 'hcy', 'cubehelix', 'hsm'] },
	{ id: 'perceptual', name: 'Perceptual', tip: 'Coordinates for comparing colors, building palettes and predicting appearance.',
		spaces: ['oklch', 'lab', 'cam16', 'oklab', 'hsluv', 'hpluv', 'hct', 'okhsl', 'okhsv', 'okhwb', 'oklrab', 'oklrch', 'srlab2', 'prolab', 'sucs', 'igpgtg', 'helmgen', 'helmgenlch', 'helmlab-metric', 'jzazbz', 'jzczhz', 'ipt', 'ipt-ragoo', 'izazbz', 'hdr-ipt', 'iapbp', 'lchab', 'luv', 'lchuv', 'lab-d65', 'lch-d65', 'msh', 'din99', 'din99o-lab', 'din99o-lch', 'din99c', 'din99d', 'osaucs-ee', 'labh', 'hunter-rdab', 'ucs', 'uvw', 'anlab', 'hdr-cie-lab', 'ciecam02', 'ciecam16', 'ciecam97s', 'cam16-ucs', 'zcam', 'cam02-ucs', 'cam16-lcd', 'cam16-scd', 'cam02-lcd', 'cam02-scd', 'hellwig2022', 'hellwig2022-hk', 'aces2-jmh', 'scam', 'kim2009', 'rlab', 'llab', 'nayatani95', 'hunt', 'atd95', 'orgb'] },
	{ id: 'colorimetry', name: 'Colorimetry & research', tip: 'The measurement foundations, the eye, and specialized research coordinates.',
		spaces: ['xyz', 'xyy', 'lms', 'xyz-d50', 'uv', 'cct-duv', 'kelvin', 'maxwell', 'wavelength', 'xyz-abs-d65', 'logluv', 'macboyn', 'dkl', 'gray', 'dsh', 'rg', 'yrg', 'xyb', 'osaucs', 'tsl', 'yes', 'ohta', 'lalphabeta', 'ycxcz', 'poirson-wandell'] },
	{ id: 'video', name: 'Video', tip: 'Separate brightness from color for broadcast, compression and HDR delivery.',
		spaces: ['ycbcr-bt709', 'ictcp', 'ictcp-hlg', 'iptpqc2', 'ycbcr-bt2020', 'ycbcr-bt601-525', 'ycbcr-bt601-625', 'ycbcr', 'yuv', 'yiq', 'ypbpr', 'ycgco', 'jpeg', 'ydbdr', 'yccbccrc', 'xvycc', 'smpte-c', 'photoycc', 'rec2100-pq', 'rec2100-hlg', 'rec2100-linear', 'icacb', 'ydzdx'] },
	{ id: 'camera', name: 'Camera', tip: 'Camera log encodings and working spaces for capturing and grading light.',
		spaces: ['acescg', 'logc3', 'awg3', 'acescc', 'slog3', 'sgamut3', 'sgamut3cine', 'sgamut3-venice', 'sgamut3cine-venice', 'aces2065-1', 'acescct', 'logc4', 'awg4', 'cineon', 'adx10', 'adx16', 'davinci', 'dwg', 'slog2', 'vlog', 'vgamut', 'log3g10', 'rwg', 'clog', 'clog2', 'clog3', 'dci-p3-plus', 'flog', 'flog2', 'flog2c', 'nlog', 'applelog', 'applelog2', 'bmdfilm', 'bmdwg', 'dlog', 'dgamut', 'tlog', 'egamut', 'kinelog3', 'dcdm', 'slog', 'acesproxy', 'erimm', 'llog', 'protune', 'gplog2', 'ilog', 'milog', 'olog', 'olog2', 'samsunglog', 'redlog', 'redlogfilm', 'log3g12', 'panalog', 'viperlog', 'filmicpro'] },
	{ id: 'surface', name: 'Print', tip: 'Ink, paint and the measured organization of surface colors.',
		spaces: ['cmyk', 'munsell', 'ryb', 'cmy', 'ral-design', 'coloroid', 'ostwald'] },
]
