// The tour – color spaces in the order they make sense: light, measurement, screens,
// pickers, perception, video, cameras, HDR, ink. Eleven stops through spaces already in
// the catalog; each stop names what it teaches, in two sentences.
// Facts lean on the dossier layer (meta.year/by/use, lore.js) – nothing here is new data.
export default [
	{ s: 'wavelength', t: 'Color starts as light', d: 'A single wavelength of visible light reads as one pure spectral hue. Everyday colors are mixtures of many wavelengths – the spaces below are ways to write those mixtures down.' },
	{ s: 'xyz', t: 'Measuring color', d: 'In 1931 the CIE turned color-matching experiments into three numbers any color can be written with. Nearly every space here is defined through it – the common ground of color conversion.' },
	{ s: 'xyy', t: 'The horseshoe', d: 'Split XYZ into brightness (Y) and position (x, y) and every visible color falls inside one horseshoe. RGB gamuts are triangles drawn in it – the clearest way to see what a screen can and cannot show.' },
	{ s: 'rgb', t: 'What screens speak', d: 'sRGB (1996) mixes three primaries under a gamma curve – the default of the web and of untagged images. Its numbers are encoded, not proportional to light: averaging them gives a darker color than mixing the light would.' },
	{ s: 'hsl', t: 'Controls for humans', d: 'Hue, saturation and lightness rearrange the same RGB cube into a wheel people can steer. Easy to pick with, but yellow at L=50 emits about 13 times the light of blue at L=50.' },
	{ s: 'lab', t: 'Spaces built on perception', d: 'CIELAB (1976) tried to make equal numeric steps look equal, so color differences could be measured. It is still the reference for print and ICC profiles – with known unevenness in blues.' },
	{ s: 'oklch', t: 'Modern perceptual color', d: 'OKLCH (2020) keeps hue, chroma and lightness controls on a more even perceptual footing. CSS writes it natively – the recommended space for palettes and gradients today.' },
	{ s: 'ycbcr-bt709', t: 'How video saves bandwidth', d: 'Video separates brightness (luma) from color difference (chroma) and stores less of the chroma, because the eye notices it less. Nearly every image and video file you open works this way.' },
	{ s: 'slog3', t: 'How cameras record', d: 'A log curve packs a sensor’s wide dynamic range into recordable code values – footage looks flat until it is converted for a display. Each camera maker ships its own curve and gamut.' },
	{ s: 'rec2100-pq', t: 'Brighter than white', d: 'HDR encodings budget code values for light far beyond a standard display’s white. PQ addresses absolute brightness up to 10,000 nits – the curve behind HDR10 and most HDR streaming.' },
	{ s: 'cmyk', t: 'Color on paper', d: 'Ink subtracts light instead of emitting it: cyan, magenta, yellow and black on white paper. Real print color depends on the press and paper profile – this is the simple device model.' },
]
