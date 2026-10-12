// The era cut – the catalog shelved by birth year: CIE 1931 opens measurement, 1976 opens uniform
// spaces, then by decade. from: the shelf's first year and its stable handle (era.<from>.tip);
// name: a span's label – a decade has none, its label is a phrase ('1990s', 'anos 1990') read
// through t() at call time. tip: the era in one sentence – what it gave color, by the spaces it shelves.
export default [
	{ from: 1860, name: '1860–1930', tip: 'Before the standard observer: Maxwell’s and Helmholtz’s color triangles, three-color printing, the Munsell and Ostwald atlases.' },
	{ from: 1931, name: '1931–1959', tip: 'CIE 1931 turns color into measurement – XYZ – followed by the first Lab spaces and NTSC color television.' },
	{ from: 1960, name: '1960–1975', tip: 'Uniform color scales from the CIE and the OSA, Itten’s painter’s wheel, and the color signals of PAL and SECAM.' },
	{ from: 1976, name: '1976–1989', tip: 'CIELAB and CIELUV make color distance perceptual, HSL and HSV put hue on screen, digital video gets YCbCr.' },
	{ from: 1990, tip: 'Rec. 709 and sRGB set the screen standard, Adobe RGB and ProPhoto widen it for photography, Cineon scans film.' },
	{ from: 2000, tip: 'CIECAM02 unifies color appearance, DCI-P3 defines digital cinema, camera makers ship their first log curves.' },
	{ from: 2010, tip: 'HDR and wide gamut – Rec. 2020, PQ, HLG – plus ACES for cinema, CAM16, and a log curve from every camera maker.' },
	{ from: 2020, tip: 'OKLab and OKLCH reach CSS, Material Design adopts HCT, log recording comes to phones.' },
]
