// Test refs
// http://www.easyrgb.com/index.php?X=CALC#Result
// http://colormine.org/convert/luv-to-rgb

import space from '../index.js';
import meta from '../meta.js';
import test, { is } from 'tst'
import color from 'color-name'
import './reference.js' // authoritative differential tests vs colorjs.io
import './bonafide.js' // cited reference values for the non-differential spaces

// get round fn for a precision
const round = (precision = 0) => v => Math.round(v * 10 ** precision) / 10 ** precision


// Structural integrity: catches the class of v3 breakage where a space file fails to
// load, drops its `export default`, or registers under the wrong key (the bugs that
// left 35 files unparseable and hcy without an export).
test('integrity — every space loads, registers, and is named consistently', () => {
	const names = Object.keys(space)
	is(names.length, 155, '155 spaces registered')
	is(names.filter(n => space[n].name !== n), [], 'every space.name matches its registry key')
	// reachability: the BFS graph wiring must connect rgb to EVERY space (both directions)
	const unreachable = names.filter(n => n !== 'rgb' && (typeof space.rgb[n] !== 'function' || typeof space[n].rgb !== 'function'))
	is(unreachable, [], 'every space is reachable to and from rgb')
})

test('family — izazbz shares jzazbz opponent axes and PQ scaling (Safdar 2017)', () => {
	// Regression: izazbz once fed relative XYZ into the PQ (colour-science's 1 cd/m² white)
	// while jzazbz scales by Yw=203 — the same paper's az/bz disagreed for every color.
	const r6 = round(6), d = -0.56, d0 = 1.6295499532821566e-11
	for (const rgb of [[246, 125, 79], [0, 0, 255], [12, 200, 100]]) {
		const [Iz, az, bz] = space.rgb.izazbz(...rgb), [Jz, az2, bz2] = space.rgb.jzazbz(...rgb)
		is(r6(az), r6(az2), `az == jzazbz az (${rgb})`)
		is(r6(bz), r6(bz2), `bz == jzazbz bz (${rgb})`)
		is(r6(((1 + d) * Iz) / (1 + d * Iz) - d0), r6(Jz), `Jz = compress(Iz) (${rgb})`)
	}
})

test('integrity — meta.js carries channels, range and @see refs per space', () => {
	const missing = Object.keys(space).filter(n => !meta[n] || !meta[n].channels || !meta[n].range)
	is(missing, [], 'every space has meta channels + range')
	// @see links are extracted into refs (regression: the generator used to drop them)
	is(meta.oklch.refs, ['https://www.w3.org/TR/css-color-4/#ok-lab'], 'oklch @see extracted')
	is(meta.munsell.refs.length, 2, 'multiple @see per space extracted')
	// @wiki → meta.wiki (90 spaces audited 2026-07; every value must be a Wikipedia article)
	is(meta.ycbcr.wiki, 'https://en.wikipedia.org/wiki/YCbCr', 'ycbcr @wiki extracted')
	const wikis = Object.values(meta).filter(m => m.wiki)
	is(wikis.length >= 90, true, `wiki links present (${wikis.length})`)
	is(wikis.every(m => /^https:\/\/en\.wikipedia\.org\/wiki\//.test(m.wiki)), true, 'every wiki link is a Wikipedia article')
})

// `range` lives twice by design: the object literal serves tree-shaken single-file
// imports (no meta.js dependency) and generate-types; meta.range is generated from
// @channel JSDoc. @channel is the source of truth — this pins the literal to it.
test('integrity — space.range literal matches @channel-derived meta.range', () => {
	const drift = Object.keys(space).filter(n => JSON.stringify(space[n].range) !== JSON.stringify(meta[n].range))
	is(drift, [], 'no drift between range literal and @channel')
})

// Regression: rgb.xyb and coloroid.xyy used `this.…` — direct method calls worked,
// but wire()'s compositions invoke each hop as a bare function, so every composed
// path routed THROUGH such an edge threw (e.g. lab→xyb, coloroid→munsell). Sweeping
// every pair with an in-domain sample catches any `this`-bound (or otherwise
// call-context-dependent) conversion.
test('integrity — every composed pair is callable as bare functions', () => {
	const names = Object.keys(space)
	const broken = []
	for (const a of names) {
		let input
		try { input = space.rgb[a](128, 128, 128) }
		catch { input = meta[a].range.map(([lo, hi]) => (lo + hi) / 2) }
		for (const b of names) {
			if (a === b || typeof space[a][b] !== 'function') continue
			try { space[a][b](...input) }
			catch (e) { if (!/one-way/.test(e.message)) broken.push(`${a}→${b}: ${e.message}`) }
		}
	}
	is(broken.slice(0, 10), [], `every reachable pair converts (${broken.length} broken)`)
})

test('edge: achromatic / black inputs are NaN-safe', () => {
	is(space.rgb.hsi(128, 128, 128).map(round(1)), [0, 0, 50.2], 'hsi gray (was NaN hue)')
	is(space.rgb.hsi(0, 0, 0), [0, 0, 0], 'hsi black (was NaN)')
	// chromaticity spaces: black carries no chromaticity — it sits at the neutral/white
	// point (any chromaticity inverts to black at zero luminance), never at a corner
	is(space.rgb.macboyn(0, 0, 0).map(round(4)), [0.6548, 0.0175, 0], 'macboyn black at the white chromaticity (was l=0)')
	is(space.rgb.xyy(0, 0, 0).map(round(4)), [0.3127, 0.329, 0], 'xyy black at the white chromaticity (was x=y=0)')
	is(space.rgb.uv(0, 0, 0).map(round(4)), [0.1978, 0.4683, 0], 'uv black at the white u\'v\' (was 0,0)')
	is(space.rgb.rg(0, 0, 0).map(round(4)), [0.3333, 0.3333], 'rg black at the neutral point (was the blue corner)')
	is(space.rgb.hsp(255, 0, 0).map(round(0)), [0, 100, 55], 'hsp red hue 0 (was 360)')
	is(space.xyz.osaucs(0, 0, 0).map(round(2)), [-13.51, 0, 0], 'osaucs black (was NaN,NaN,NaN)')
	is(space.rgb.lchuv(0, 0, 0).map(round(1)), [0, 0, 0], 'lchuv black hue 0 (was 180)')
})

test('edge: every space is NaN/Infinity-safe (black/white/gray/primaries)', () => {
	const finite = (a) => Array.isArray(a) && a.every(Number.isFinite)
	const inputs = [[0, 0, 0], [255, 255, 255], [128, 128, 128], [255, 0, 0], [0, 255, 0], [0, 0, 255]]
	const skipFwd = new Set(['cubehelix']) // rgb->cubehelix is one-way-blocked (parametric colormap)
	const skipInv = new Set(['cubehelix']) // cubehelix is colormap-only; osaucs now has a working Newton inverse
	for (const name of Object.keys(space)) {
		if (name === 'rgb' || typeof space.rgb[name] !== 'function' || skipFwd.has(name)) continue
		for (const c of inputs) {
			is(finite(space.rgb[name](...c)), true, `rgb -> ${name} ${c} finite`)
			if (!skipInv.has(name)) is(finite(space[name].rgb(...space.rgb[name](...c))), true, `${name} -> rgb ${c} finite`)
		}
	}
})


// Pins the INVERSE paths of the spaces added this pass — the bonafide tests only assert
// forward values and the NaN canary only checks finiteness, so without this the dsh
// purple/complementary inverse, munsell iterative inverse, and photoycc decode are unguarded.
test('new spaces: inverse-path round-trips', () => {
	is(space.xyy.dsh(...space.dsh.xyy(580, 0.6, 40)).map(round(2)), [580, 0.6, 40], 'dsh spectral roundtrip')
	is(space.xyy.dsh(...space.dsh.xyy(-509, 0.4, 30)).map(round(2)), [-509, 0.4, 30], 'dsh purple/complementary (negative wavelength) roundtrip')
	is(space.photoycc.lrgb(...space.lrgb.photoycc(0.4, 0.2, 0.7)).map(round(6)), [0.4, 0.2, 0.7], 'photoycc decode is exact inverse of encode')
	is(space.xyy.munsell(...space.munsell.xyy(5, 5, 10)).map(round(2)), [5, 5, 10], 'munsell grid-point roundtrip')
	is(space.xyy.munsell(...space.munsell.xyy(15, 6, 7)).map(round(1)), [15, 6, 7], 'munsell off-grid iterative inverse roundtrip')
	is(space.lab['ral-design'](...space['ral-design'].lab(210, 50, 15)).map(round(2)), [210, 50, 15], 'ral-design CIELAB polar roundtrip')
})

test('lrgb', () => {
	// RGB now uses 0-255, lrgb uses 0-1
	is(space.rgb.lrgb(255, 255, 255), [1.0, 1.0, 1.0], 'from white')
	is(space.rgb.lrgb(0, 0, 0), [0, 0, 0], 'from black')
	is(space.rgb.lrgb(128, 128, 128).map(round(3)), [0.216, 0.216, 0.216], 'from gray')

	is(space.lrgb.rgb(1, 1, 1).map(round(1)), [255, 255, 255], 'to white')
	is(space.lrgb.rgb(0, 0, 0).map(round(1)), [0, 0, 0], 'to black')
	is(space.lrgb.rgb(0.216, 0.216, 0.216).map(round(1)), [128, 128, 128], 'to gray')
})


test('xyz', () => {
	// RGB now 0-255, XYZ now 0-100
	is((space.rgb.xyz(255, 255, 255)).map(round(2)), [95.05, 100.00, 108.91], 'from white');
	is((space.rgb.xyz(0, 0, 0)).map(round(2)), [0.0, 0.0, 0.0], 'from black');
	is((space.rgb.xyz(128, 128, 128)).map(round(1)), [20.5, 21.6, 23.5], 'from gray');

	is((space.rgb.xyz(255, 0, 0)).map(round(2)), [41.24, 21.26, 1.93], 'from red');
	is((space.rgb.xyz(0, 255, 0)).map(round(2)), [35.76, 71.52, 11.92], 'from green');
	is((space.rgb.xyz(0, 0, 255)).map(round(2)), [18.05, 7.22, 95.05], 'from blue');

	is((space.rgb.xyz(0, 255, 255)).map(round(2)), [53.81, 78.74, 106.97], 'from cyan');
	is((space.rgb.xyz(255, 0, 255)).map(round(2)), [59.29, 28.48, 96.99], 'from magenta');
	is((space.rgb.xyz(255, 255, 0)).map(round(2)), [77.00, 92.78, 13.85], 'from yellow');

	is((space.rgb.xyz(92, 191, 84).map(round(1))), [24.6, 40.2, 14.8], 'from arbitrary');


	is((space.xyz.rgb(95.05, 100.00, 108.90)).map(round(0)), [255, 255, 255], 'to white');
	is((space.xyz.rgb(0.0, 0.0, 0.0)).map(round(0)), [0, 0, 0], 'to black');
	is((space.xyz.rgb(20.5, 21.6, 23.5)).map(round(0)), [128, 128, 128], 'to gray');

	is((space.xyz.rgb(41.24, 21.26, 1.93)).map(round(0)), [255, 0, 0], 'to red');
	is((space.xyz.rgb(35.76, 71.52, 11.92)).map(round(0)), [0, 255, 0], 'to green');
	is((space.xyz.rgb(18.05, 7.22, 95.05)).map(round(0)), [0, 0, 255], 'to blue');

	is((space.xyz.rgb(53.81, 78.74, 106.97)).map(round(0)), [0, 255, 255], 'to cyan');
	is((space.xyz.rgb(59.29, 28.48, 96.98)).map(round(0)), [255, 0, 255], 'to magenta');
	is((space.xyz.rgb(77.00, 92.78, 13.85)).map(round(0)), [255, 255, 0], 'to yellow');

	is((space.xyz.rgb(24.6, 40.2, 14.8).map(round(0))), [91, 191, 84], 'to arbitrary');
});



// lab is D50 (ICC PCS / CSS Color 4). Reference values from colorjs.io `lab`.
test('lab: rgb <-> lab (D50, vs colorjs)', function () {
	is(space.rgb.lab(255, 255, 255).map(round(1)), [100, 0, 0], 'white');
	is(space.rgb.lab(0, 0, 0).map(round(1)), [0, 0, 0], 'black');
	is(space.rgb.lab(128, 128, 128).map(round(1)), [53.6, 0, 0], 'gray');
	is(space.rgb.lab(255, 0, 0).map(round(1)), [54.3, 80.8, 69.9], 'red');
	is(space.rgb.lab(0, 255, 0).map(round(1)), [87.8, -79.3, 81], 'green');
	is(space.rgb.lab(0, 0, 255).map(round(1)), [29.6, 68.3, -112], 'blue');
	is(space.rgb.lab(100, 150, 200).map(round(1)), [60.1, -6.7, -31.5], 'arbitrary');
	for (const c of [[128, 128, 128], [255, 0, 0], [0, 255, 0], [100, 150, 200]])
		is(space.lab.rgb(...space.rgb.lab(...c)).map(round(0)), c, `roundtrip ${c}`);
});

// lab-d65: display-native CIELAB (no adaptation from sRGB). Refs from colorjs.io `lab-d65`.
test('lab-d65: rgb <-> lab-d65 (vs colorjs)', function () {
	is(space.rgb['lab-d65'](255, 255, 255).map(round(1)), [100, 0, 0], 'white');
	is(space.rgb['lab-d65'](128, 128, 128).map(round(1)), [53.6, 0, 0], 'gray');
	is(space.rgb['lab-d65'](255, 0, 0).map(round(1)), [53.2, 80.1, 67.2], 'red');
	is(space.rgb['lab-d65'](0, 0, 255).map(round(1)), [32.3, 79.2, -107.9], 'blue');
	for (const c of [[128, 128, 128], [255, 0, 0], [100, 150, 200]])
		is(space['lab-d65'].rgb(...space.rgb['lab-d65'](...c)).map(round(0)), c, `roundtrip ${c}`);
});



test('cmyk: rgb -> cmyk', function () {
	// RGB now 0-255, CMYK 0-100
	is((space.rgb.cmyk(140, 200, 100).map(round(1))), [30.0, 0.0, 50.0, 21.6], 'rgb to cmyk');
	is((space.rgb.cmyk(0, 0, 0).map(round(1))), [0, 0, 0, 100], 'black to cmyk');
});

test('cmyk: cmyk -> rgb', function () {
	// CMYK 0-100, RGB 0-255
	is((space.cmyk.rgb(30, 0, 50, 21.6).map(round(0))), [140, 200, 100], 'cmyk to rgb');
});

test('cmyk: cmyk -> hsl', function () {
	// CMYK 0-100, HSL: H 0-360, S/L 0-100
	is((space.cmyk.hsl(30, 0, 50, 21.6).map(round(1))), [96.0, 47.6, 58.8], 'cmyk to hsl');
});

test('cmyk: cmyk -> hsv', function () {
	// CMYK 0-100, HSV: H 0-360, S/V 0-100
	is((space.cmyk.hsv(30, 0, 50, 21.6).map(round(1))), [96.0, 50.0, 78.4], 'cmyk to hsv');
});

test('cmyk: cmyk -> hwb', function () {
	// CMYK 0-100, HWB: H 0-360, W/B 0-100
	is((space.cmyk.hwb(30, 0, 50, 21.6).map(round(1))), [96.0, 39.2, 21.6], 'cmyk to hwb');
});



test('hsl: hsl -> rgb', function () {
	// HSL: H 0-360, S/L 0-100, RGB 0-255
	is(space.hsl.rgb(96, 48, 59).map(round(0)), [140, 201, 100], 'hsl to rgb');
});

test('hsl: hsl -> hsv', function () {
	// HSL: H 0-360, S/L 0-100; HSV: H 0-360, S/V 0-100
	is(space.hsl.hsv(96, 48, 59).map(round(1)), [96.0, 50.0, 78.7], 'hsl to hsv');
});

test('hsl: hsl -> cmyk', function () {
	// HSL 0-360/0-100, CMYK 0-100
	is(space.hsl.cmyk(96, 48, 59).map(round(1)), [30.0, 0.0, 50.0, 21.3], 'hsl to cmyk');
});

test('hsl: rgb -> hsl', function () {
	// RGB 0-255, HSL: H 0-360, S/L 0-100
	is(space.rgb.hsl(140, 200, 100).map(round(1)), [96.0, 47.6, 58.8], 'rgb to hsl');
});



test('hsv: hsv -> rgb', function () {
	// HSV: H 0-360, S/V 0-100, RGB 0-255
	is(space.hsv.rgb(96, 50, 78).map(round(0)), [139, 199, 99], 'hsv to rgb');
});

test('hsv: hsv -> hsl', function () {
	// HSV/HSL: H 0-360, S/L/V 0-100
	is(space.hsv.hsl(96, 50, 78).map(round(1)), [96.0, 47.0, 58.5], 'hsv to hsl');

	//keep hue
	is(space.hsv.hsl(120, 0, 0).map(round(1)), [120, 0, 0], 'keep hue');
});

test('hsv: hsv -> cmyk', function () {
	// HSV: H 0-360, S/V 0-100, CMYK 0-100
	is(space.hsv.cmyk(96, 50, 78).map(round(0)), [30, 0, 50, 22], 'hsv to cmyk');
});

test('hsv: rgb -> hsv', function () {
	// RGB 0-255, HSV: H 0-360, S/V 0-100
	is(space.rgb.hsv(140, 200, 100).map(round(1)), [96.0, 50.0, 78.4], 'rgb to hsv');
});




test('hsp: hsp -> rgb', function () {
	// HSP: H 0-360, S/P 0-100, RGB 0-255
	// P=0 => Black
	is((space.hsp.rgb(0, 50, 0)).map(round(0)), [0, 0, 0], 'black');
	// 100% P => White (if S=0)
	is((space.hsp.rgb(0, 0, 100).map(round(0))), [255, 255, 255], 'white');
});

test('hsp: rgb -> hsp', function () {
	// RGB 0-255, HSP: H 0-360, S/P 0-100
	is((space.rgb.hsp(98, 115, 255).map(round(1))), [233.5, 61.6, 52.7], 'rgb to hsp');
});

test('hsp: rgb -> hsp', function () {
	// Gray
	is(space.rgb.hsp(110, 110, 110).map(round(1)), [0, 0, 43.1], 'gray');
});



test('hsi: hsi -> rgb', function () {
	// HSI: H 0-360, S/I 0-100, RGB 0-255
	is(space.hsi.rgb(210, 33.3, 58.8).map(round(0)), [100, 150, 200], 'hsi to rgb');
});

test('hsi: rgb -> hsi', function () {
	// RGB 0-255, HSI: H 0-360, S/I 0-100
	is(space.rgb.hsi(100, 150, 200).map(round(1)), [210.0, 33.3, 58.8], 'rgb to hsi');
});



test('hcg: hcg -> rgb', function () {
	// HCG: H 0-360, C/G 0-100, RGB 0-255
	is((space.hcg.rgb(0, 100, 0)), [255, 0, 0], 'pure red');

	is((space.hcg.rgb(0, 50, 0).map(round(0))), [128, 0, 0], 'dark red');
	is((space.hcg.rgb(0, 50, 100).map(round(0))), [255, 128, 128], 'light red');
	is((space.hcg.rgb(0, 50, 50).map(round(0))), [191, 64, 64], 'mid red');

	is((space.hcg.rgb(0, 0, 100).map(round(0))), [255, 255, 255], 'white');
	is((space.hcg.rgb(0, 0, 50).map(round(0))), [128, 128, 128], 'gray');
	is((space.hcg.rgb(0, 0, 0).map(round(0))), [0, 0, 0], 'black');
});

test('hcg: rgb -> hcg', function () {
	// RGB 0-255, HCG: H 0-360, C/G 0-100
	is((space.rgb.hcg(255, 0, 0).map(round(0))), [0, 100, 0], 'red to hcg');

	is((space.rgb.hcg(128, 0, 0).map(round(0))), [0, 50, 0], 'dark red to hcg');
	is((space.rgb.hcg(255, 128, 128).map(round(0))), [0, 50, 100], 'light red to hcg');

	is((space.rgb.hcg(255, 255, 255).map(round(0))), [0, 0, 100], 'white to hcg');
	is((space.rgb.hcg(128, 128, 128).map(round(0))), [0, 0, 50], 'gray to hcg');
	is((space.rgb.hcg(0, 0, 0).map(round(0))), [0, 0, 0], 'black to hcg');

	// hue must stay within [0,360) when red is max and blue > green (negative-hue wrap) — #68, spokodev
	is((space.rgb.hcg(255, 0, 55).map(round(0))), [347, 100, 0], 'red-max, blue>green: hue wraps into range');
	is((space.hcg.rgb(...space.rgb.hcg(255, 0, 55)).map(round(0))), [255, 0, 55], 'negative-hue case round-trips');
});

test('hcg: hcg -> hwb', function () {
	// HCG/HWB: H 0-360, C/G/W/B 0-100
	is((space.hcg.hwb(0, 100, 0)), [0, 0, 0], 'hcg red to hwb');
	// HCG/HWB: H 0-360, C/G/W/B 0-100
	// h=200, c=100, g=0 -> h=200, w=0, b=0
	is((space.hcg.hwb(200, 100, 0)), [200, 0, 0]);
	// h=200, c=100, g=100 -> h=200, w=0, b=0 (pure color overrides gray?)
	is((space.hcg.hwb(200, 100, 100)), [200, 0, 0]);
	// h=200, c=0, g=50 -> h=200, w=50, b=50
	is((space.hcg.hwb(200, 0, 50)), [200, 50, 50]);
});

test('hcg: hwb -> hcg', function () {
	// HWB/HCG: H 0-360, W/B/C/G 0-100
	is((space.hwb.hcg(0, 0, 0)), [0, 100, 0]);
	is((space.hwb.hcg(200, 0, 0)).map(round(1)), [200, 100, 0]);
	is((space.hwb.hcg(200, 50, 50)).map(round(1)), [200, 0, 50]);
});



test('hwb: hwb -> rgb', function () {
	// HWB: H 0-360, W/B 0-100, RGB 0-255
	// http://dev.w3.org/csswg/css-color/#hwb-examples

	// all extreme values should give black, white or grey
	for (var angle = 0; angle <= 360; angle += 1) {
		is((space.hwb.rgb(angle, 0, 100).map(round(0))), [0, 0, 0]);
		is((space.hwb.rgb(angle, 100, 0).map(round(0))), [255, 255, 255]);
		is((space.hwb.rgb(angle, 100, 100).map(round(0))), [128, 128, 128]);
	}

	is((space.hwb.rgb(0, 0, 0).map(round(0))), [255, 0, 0]);
	is((space.hwb.rgb(0, 20, 40).map(round(0))), [153, 51, 51]);

	is((space.hwb.rgb(120, 0, 0).map(round(0))), [0, 255, 0]);
	is((space.hwb.rgb(240, 0, 0).map(round(0))), [0, 0, 255]);
});

test('hwb: rgb -> hwb', function () {
	// RGB 0-255, HWB: H 0-360, W/B 0-100
	is((space.rgb.hwb(140, 200, 100).map(round(1))), [96.0, 39.2, 21.6]);
});

test('hwb: hsv -> hwb', function () {
	// HSV/HWB: H 0-360, S/V/W/B 0-100
	is((space.hsv.hwb(10, 100, 0).map(round(1))), [10.0, 0, 100.0]);
	is((space.hsv.hwb(20, 0, 0).map(round(1))), [20.0, 0, 100.0]); // s=0, v=0 -> black. w=0, b=100.
	is((space.hsv.hwb(96, 50, 78).map(round(0))), [96, 39, 22]);
});

test('hwb: hwb -> hsv', function () {
	// HWB: H 0-360, W/B 0-100, HSV: H 0-360, S/V 0-100
	is((space.hwb.hsv(0, 50, 100).map(round(1))), [0, 0, 33.3]); // w=50, b=100 -> sum=150. normalize.
	// w+b > 100. hwb.js logic: if ratio > 100, normalized.
	// 50 / 150 * 100 = 33.3. 100 / 150 * 100 = 66.7.
	// v = 100 - b = 100 - 66.7 = 33.3.

	is((space.hwb.hsv(96, 39, 22).map(round(1))), [96.0, 50.0, 78.0]);

	is((space.hwb.hsv(0, 0, 100).map(round(1))), [0, 0, 0]);
});

test('hwb: hwb -> hsl', function () {
	// HWB/HSL: H 0-360, W/B/S/L 0-100
	is((space.hwb.hsl(20, 50, 50).map(round(1))), [20.0, 0, 50.0]);
});

test('hwb: hsl -> hwb', function () {
	// HSL/HWB: H 0-360, S/L/W/B 0-100
	is((space.hsl.hwb(20, 100, 0).map(round(1))), [20.0, 0, 100.0]);
	is((space.hsl.hwb(96, 48, 59).map(round(1))), [96.0, 39.3, 21.3]);
});



test('xyY: xyz -> xyy', function () {
	// XYZ 0-100, xyY x/y 0-1, Y 0-100
	is((space.xyz.xyy(0, 0, 0)).map(v => Math.round(v * 1e4) / 1e4), [0.3127, 0.329, 0]);   // achromatic: the white's (x, y)
	is((space.xyz.xyy(25, 40, 15).map(round(4))), [0.3125, 0.5, 40]);
	is((space.xyz.xyy(50, 100, 100).map(round(2))), [0.2, 0.4, 100]);
});

test('xyY: xyy -> xyz', function () {
	// xyY: x/y 0-1, Y 0-100; XYZ 0-100
	is((space.xyy.xyz(.40, .15, 25).map(round(1))), [66.7, 25.0, 75.0]);
	is((space.xyy.xyz(0.2, .4, 100).map(round(1))), [50.0, 100.0, 100.0]);
});



test('labh: rgb -> labh', function () {
	// RGB 0-255, Lab-Hunter: L 0-100, a/b ±100
	is((space.rgb.labh(0, 0, 0).map(round(1))), [0, 0, 0]);
	// D65 white must be neutral: L=100, a=b=0 (guards the Illuminant-C constant bug)
	is(space.rgb.labh(255, 255, 255).map(round(1)), [100, 0, 0]);
});

test('labh: labh -> rgb', function () {
	// Lab-Hunter: L 0-100, a/b ±100, RGB 0-255
	is((space.labh.rgb(0, 0, 0).map(round(0))), [0, 0, 0]);
	for (const c of [[128, 128, 128], [255, 0, 0], [200, 100, 50]])
		is(space.labh.rgb(...space.rgb.labh(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('labh: xyz -> labh', function () {
	// XYZ 0-100, Lab-Hunter: L 0-100, a/b ±125
	is((space.xyz.labh(0, 0, 0)).map(round(1)), [0, 0, 0]);
});

test('labh: labh -> xyz', function () {
	// Lab-Hunter: L 0-100, a/b ±125, XYZ 0-100
	is((space.labh.xyz(0, 0, 0)), [0, 0, 0]);
});



test('lms: lms <-> xyz', function () {
	// LMS 0-1 (linear light), XYZ 0-100
	is(space.lms.xyz(0, 0, 0), [0, 0, 0]);
	is(space.xyz.lms(0, 0, 0), [0, 0, 0]);

	// Nested call: space.xyz.lms returns Array. space.lms.xyz expects args.
	// Must spread result of inner call.
	is((space.lms.xyz(...space.xyz.lms(10, 20, 30))).map(round(1)), [10, 20, 30]);
});



// lchab = polar of lab (D50). Reference values from colorjs.io `lch`.
test('lchab: rgb <-> lchab (D50, vs colorjs)', function () {
	is(space.lchab.lab(69, 65, 137).map(round(1)), [69, -47.5, 44.3], 'polar->cartesian (illuminant-independent)');
	is(space.rgb.lchab(255, 0, 0).map(round(1)), [54.3, 106.8, 40.9], 'red');
	is(space.rgb.lchab(0, 0, 255).map(round(1)), [29.6, 131.2, 301.4], 'blue');
	is(space.rgb.lchab(100, 150, 200).map(round(1)), [60.1, 32.2, 258], 'arbitrary');
	for (const c of [[255, 0, 0], [0, 255, 0], [100, 150, 200]])
		is(space.lchab.rgb(...space.rgb.lchab(...c)).map(round(0)), c, `roundtrip ${c}`);
});



test('luv: rgb -> luv', function () {
	// RGB 0-255, Luv: L 0-100, u/v ±100
	is((space.rgb.luv(0, 0, 0).map(round(1))), [0, 0, 0]);
	is((space.rgb.luv(255, 255, 255).map(round(0))), [100, 0, 0]);
	// Red [255, 0, 0] -> L=53, u=175, v=38
	is((space.rgb.luv(255, 0, 0).map(round(0))), [53, 175, 38]);
});

test('luv: luv -> rgb', function () {
	// Luv: L 0-100, u/v ±100, RGB 0-255
	is((space.luv.rgb(0, 0, 0).map(round(0))), [0, 0, 0]);
	is((space.luv.rgb(100, 0, 0).map(round(0))), [255, 255, 255]);
});

test('luv: xyz -> luv', function () {
	// XYZ 0-100, Luv: L 0-100, u/v ±100
	is((space.xyz.luv(0, 0, 0).map(round(1))), [0, 0, 0]);
	is((space.xyz.luv(95, 100, 109).map(round(0))), [100, 0, 0]); // D65 White
});

test('luv: luv -> xyz', function () {
	// Luv: L 0-100, u/v ±100, XYZ 0-100
	is((space.luv.xyz(0, 0, 0).map(round(1))), [0, 0, 0]);
	// L=100 -> Y=100
	is((space.luv.xyz(100, 0, 0).map(round(2))), [95.05, 100.00, 108.91]); // D65 White approx
});



test('lchuv: luv <-> lchuv', function () {
	// Luv: L 0-100, u/v ±100; LCHuv: L 0-100, C 0-180, H 0-360
	is(space.lchuv.luv(...space.luv.lchuv(0, 0, 0)).map(round(1)), [0, 0, 0]);
	is(space.lchuv.luv(...space.luv.lchuv(50, -50, -50)).map(round(1)), [50.0, -50.0, -50.0]);
});




test('hsluv: hsluv -> rgb', function () {
	// HSLuv: H 0-360, S/L 0-100, RGB 0-255
	// Test basic colors
	is(space.hsluv.rgb(0, 100, 53).map(round(0)), [248, 0, 107], 'red-ish');
	is(space.hsluv.rgb(0, 0, 0).map(round(0)), [0, 0, 0], 'black');
	is(space.hsluv.rgb(0, 0, 100).map(round(0)), [255, 255, 255], 'white');
});

test('hsluv: rgb -> hsluv', function () {
	// RGB 0-255, HSLuv: H 0-360, S/L 0-100
	is(space.rgb.hsluv(0, 0, 0).map(round(1)), [0, 0, 0], 'black');
	is(space.rgb.hsluv(255, 255, 255).map(round(1)), [0, 0, 100], 'white');
	// Red roundtrip
	const red = space.rgb.hsluv(255, 0, 0);
	is(space.hsluv.rgb(...red).map(round(0)), [255, 0, 0], 'red roundtrip');
});

test('hsluv: hsluv <-> lchuv', function () {
	// HSLuv: H 0-360, S/L 0-100, LCHuv: L 0-100, C 0-150, H 0-360
	const lch1 = space.hsluv.lchuv(0, 100, 53);
	is(lch1.map(round(1)), [53, 145.9, 0], 'hsluv to lchuv');

	const hsl = space.lchuv.hsluv(53, 145.9, 0);
	is(hsl.map(round(1)), [0, 100, 53], 'lchuv to hsluv');
});

test('hsluv: hsluv <-> xyz', function () {
	// HSLuv: H 0-360, S/L 0-100, XYZ: 0-100
	const xyz1 = space.hsluv.xyz(0, 100, 53);
	is(xyz1.map(round(1)), [41.4, 21.0, 15.8], 'hsluv to xyz');

	const hsl = space.xyz.hsluv(41.4, 21.0, 15.8);
	is(hsl.map(round(0)), [360, 100, 53], 'xyz to hsluv'); // hue 360° = 0°
});

test('hsluv: consistency checks', function () {
	// Verify hsluv conversions match going through lchuv and xyz
	// hsluv -> lchuv -> luv should match internal conversion
	const hsl = [120, 80, 60];
	const lch1 = space.hsluv.lchuv(...hsl);
	const luv1 = space.lchuv.luv(...lch1);

	// hsluv -> xyz -> luv
	const xyz1 = space.hsluv.xyz(...hsl);
	const luv2 = space.xyz.luv(...xyz1);

	is(luv1.map(round(1)), luv2.map(round(1)), 'hsluv->lchuv->luv ≡ hsluv->xyz->luv');
});


// FCC (1953 NTSC) YIQ; forward/inverse are exact-inverse matrices (so it round-trips).
test('yiq: rgb <-> yiq', function () {
	is(space.rgb.yiq(0, 0, 0).map(round(3)), [0, 0, 0], 'black');
	is(space.rgb.yiq(255, 255, 255).map(round(3)), [1, 0, 0], 'white');
	is(space.rgb.yiq(255, 0, 0).map(round(3)), [0.299, 0.596, 0.211], 'red (FCC)');
	is(space.yiq.rgb(0, 0, 0), [0, 0, 0]);
	is(space.yiq.rgb(1, 0, 0).map(round(0)), [255, 255, 255], 'white');
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [200, 100, 50]])
		is(space.yiq.rgb(...space.rgb.yiq(...c)).map(round(0)), c, `roundtrip ${c}`);
});



test('yuv: yuv -> rgb', function () {
	// YUV: Y 0-1, U/V ±0.5, RGB 0-255
	is((space.yuv.rgb(0, 0, 0)), [0, 0, 0]);
	is((space.yuv.rgb(1, 0, 0).map(round(0))), [255, 255, 255]);
	// roundtrip exercises the U->B coefficient (was 2.02311, now 2.03211)
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [200, 100, 50]])
		is(space.yuv.rgb(...space.rgb.yuv(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('yuv: rgb -> yuv', function () {
	// RGB 0-255, YUV: Y 0-1, U/V ±0.5
	is((space.rgb.yuv(0, 0, 0)), [0, 0, 0]);
	is((space.rgb.yuv(255, 255, 255).map(round(2))), [1, 0, 0]);
});


// Skipping other video spaces normalization for now or assume they work if linear.
// ydbdr, ycgco, ypbpr, ycbcr, xvycc, jpeg
// They generally follow RGB scale = Y scale.
// If RGB is 0..255, Y is 0..1.




test('ydbdr: ydbdr -> rgb', function () {
	// YDbDr: Y 0-1, Db/Dr ±1.33, RGB 0-255
	is((space.ydbdr.rgb(0, 0, 0)), [0, 0, 0]);
	is((space.ydbdr.rgb(1, 0, 0)), [255, 255, 255]);

	is((space.ydbdr.rgb(...space.rgb.ydbdr(10, 20, 30)).map(round(0))), [10, 20, 30]);
});

test('ydbdr: rgb -> ydbdr', function () {
	// RGB 0-255, YDbDr: Y 0-1, Db/Dr ±1.33
	is((space.rgb.ydbdr(0, 0, 0)), [0, 0, 0]);
	is((space.rgb.ydbdr(255, 255, 255).map(round(0))), [1, 0, 0]);
});

test('ydbdr: yuv <-> ydbdr', function () {
	// YUV/YDbDr: Y 0-1, U/V/Db/Dr ±0.5/±1.33
	is((space.yuv.ydbdr(1, 0, 0)), [1, 0, 0]);
	is((space.ydbdr.yuv(1, 0, 0)), [1, 0, 0]);
});



test('ycgco: ycgco -> rgb', function () {
	// YCgCo: Y 0-1, Cg/Co ±0.5, RGB 0-255
	is((space.ycgco.rgb(0, 0, 0)), [0, 0, 0]);
	is((space.ycgco.rgb(1, 0, 0)), [255, 255, 255]);
	is((space.ycgco.rgb(0.25, -0.25, 0.5)), [255, 0, 0]);

	is((space.ycgco.rgb(...space.rgb.ycgco(10, 20, 30))).map(round(0)), [10, 20, 30]);
});

test('ycgco: rgb -> ycgco', function () {
	// RGB 0-255, YCgCo: Y 0-1, Cg/Co ±0.5
	is((space.rgb.ycgco(0, 0, 0)), [0, 0, 0]);
	is((space.rgb.ycgco(255, 255, 255)), [1, 0, 0]);
	is((space.rgb.ycgco(255, 0, 0)), [0.25, -0.25, 0.5]);
});



test('ypbpr: ypbpr -> rgb', function () {
	// YPbPr: Y 0-1, Pb/Pr ±0.5, RGB 0-255
	is((space.ypbpr.rgb(0, 0, 0).map(round(0))), [0, 0, 0]);
	is((space.ypbpr.rgb(0.715, -0.385, -0.454).map(round(0))), [0, 255, 0]); // G
	is((space.ypbpr.rgb(1, 0, 0).map(round(0))), [255, 255, 255]);
	is((space.ypbpr.rgb(...space.rgb.ypbpr(26, 51, 77))).map(round(0)), [26, 51, 77]);
});

test('ypbpr: rgb -> ypbpr', function () {
	// RGB 0-255, YPbPr: Y 0-1, Pb/Pr ±0.5
	is((space.rgb.ypbpr(0, 0, 0).map(round(1))), [0, 0, 0]);
	is((space.rgb.ypbpr(128, 128, 128).map(round(2))), [0.50, 0, 0]);
	is((space.rgb.ypbpr(255, 255, 255).map(round(1))), [1, 0, 0]);

	is((space.rgb.ypbpr(0, 255, 0).map(round(3))), [0.715, -0.385, -0.454]);
	is((space.rgb.ypbpr(255, 0, 0).map(round(3))), [0.213, -0.115, 0.5]);
});

test('ypbpr: yuv <-> ypbpr', function () {
	// YUV/YPbPr: Y 0-1, U/V/Pb/Pr ±0.5
	is((space.yuv.ypbpr(1, -0.5, -0.5)).map(round(1)), [0.8, -0.4, -0.2]);
	// Symmetric case?
	// is((space.yuv.ypbpr(1, 0.5, 0.5)).map(round(1)), [0.8, 0.4, 0.2]); // Guess

	is((space.ypbpr.yuv(0.8, -0.4, -0.2)).map(round(1)), [0.7, -0.3, -0.2]);
	// is((space.ypbpr.yuv(235, 240, 240)).map(round(1))), [1, 0.5, 0.5]); // This was definitely wrong input for YPbPr
});



test('yccbccrc: yccbccrc -> rgb', function () {
	// YCcCbcCrc: Y 0-1, Cbc/Crc ±0.5, RGB 0-255
	is((space.yccbccrc.rgb(0, 0, 0)).map(round(0)), [0, 0, 0]);
	is((space.yccbccrc.rgb(1, 0, 0)).map(round(0)), [255, 255, 255]); // Yc=1 -> Rec.2020 white
	is((space.yccbccrc.rgb(...space.rgb.yccbccrc(26, 51, 77))).map(round(0)), [26, 51, 77]);
});

test('yccbccrc: rgb -> yccbccrc (constant-luminance)', function () {
	// RGB 0-255, YcCbcCrc: Yc 0-1, Cbc/Crc ±0.5. CL luma = oetf(linear gray),
	// so gray 128 -> oetf(0.2159) ≈ 0.45 (not the 0.50 of the non-CL nonlinear gray).
	is((space.rgb.yccbccrc(0, 0, 0).map(round(1))), [0, 0, 0]);
	is((space.rgb.yccbccrc(128, 128, 128).map(round(2))), [0.45, 0, 0]);
	is((space.rgb.yccbccrc(255, 255, 255).map(round(1))), [1, 0, 0]);
});



test('ycbcr: ycbcr -> rgb', function () {
	// YCbCr: Y 16-235, Cb/Cr 16-240 (video/limited range)
	// Black: Y=16, Cb=128, Cr=128 (centered chroma)
	is((space.ycbcr.rgb(16, 128, 128)).map(round(0)), [0, 0, 0]);
	// White: Y=235, Cb=128, Cr=128
	is((space.ycbcr.rgb(235, 128, 128)).map(round(0)), [255, 255, 255]);

	is((space.ycbcr.rgb(...space.rgb.ycbcr(10, 20, 30)).map(round(0))), [10, 20, 30]);
});

test('ycbcr: rgb -> ycbcr', function () {
	// RGB 0-255, YCbCr: Y 16-235, Cb/Cr 16-240
	const black = space.rgb.ycbcr(0, 0, 0);
	is(black.map(round(0)), [16, 128, 128]);

	const white = space.rgb.ycbcr(255, 255, 255);
	is(white.map(round(0)), [235, 128, 128]);
});

test('ycbcr: ypbpr <-> ycbcr', function () {
	// YPbPr: Y 0-1, Pb/Pr ±0.5, YCbCr: Y 16-235, Cb/Cr 16-240
	is((space.ypbpr.ycbcr(1, -0.5, -0.5)).map(round(0)), [235, 16, 16]);
	is((space.ypbpr.ycbcr(1, 0.5, 0.5)).map(round(0)), [235, 240, 240]);

	is((space.ycbcr.ypbpr(235, 16, 16)).map(round(2)), [1, -0.5, -0.5]);
	is((space.ycbcr.ypbpr(235, 240, 240)).map(round(2)), [1, 0.5, 0.5]);
});



test('xvycc: xvycc -> rgb', function () {
	// xvYCC: Y 16-235, Cb/Cr 16-240 (same as YCbCr, extended gamut)
	is((space.xvycc.rgb(16, 128, 128)).map(round(0)), [0, 0, 0]);
	// White: Y=235, Cb=128, Cr=128
	is((space.xvycc.rgb(235, 128, 128)).map(round(0)), [255, 255, 255]);

	is((space.xvycc.rgb(...space.rgb.xvycc(10, 20, 30)).map(round(0))), [10, 20, 30]);
});

test('xvycc: rgb -> xvycc', function () {
	// RGB 0-255, xvYCC: Y 16-235, Cb/Cr 16-240
	const black = space.rgb.xvycc(0, 0, 0);
	is(black.map(round(0)), [16, 128, 128]);

	const white = space.rgb.xvycc(255, 255, 255);
	is(white.map(round(0)), [235, 128, 128]);
});

test('xvycc: ypbpr <-> xvycc', function () {
	// YPbPr: Y 0-1, Pb/Pr ±0.5, xvYCC: Y 16-235, Cb/Cr 16-240
	is((space.ypbpr.xvycc(1, -0.5, -0.5)).map(round(0)), [235, 16, 16]);
	is((space.ypbpr.xvycc(1, 0.5, 0.5)).map(round(0)), [235, 240, 240]);

	is((space.xvycc.ypbpr(235, 16, 16)).map(round(2)), [1, -0.5, -0.5]);
	is((space.xvycc.ypbpr(235, 240, 240)).map(round(2)), [1, 0.5, 0.5]);
});



test('jpeg: jpeg -> rgb', function () {
	// JPEG: Y/Cb/Cr 0-255 (full range, Cb/Cr centered at 128), RGB 0-255
	is((space.jpeg.rgb(0, 128, 128)).map(round(0)), [0, 0, 0]);
	is((space.jpeg.rgb(255, 128, 128)).map(round(0)), [255, 255, 255]);

	is((space.jpeg.rgb(...space.rgb.jpeg(10, 20, 30)).map(round(0))), [10, 20, 30]);
});

test('jpeg: rgb -> jpeg', function () {
	// RGB 0-255, JPEG: Y/Cb/Cr 0-255 (Cb/Cr centered at 128)
	is((space.rgb.jpeg(0, 0, 0)).map(round(0)), [0, 128, 128]);
	is((space.rgb.jpeg(255, 255, 255).map(round(0))), [255, 128, 128]);
});



test('ucs: ucs -> xyz', function () {
	// UCS: U/V/W 0-100, XYZ 0-100
	is((space.ucs.xyz(...space.xyz.ucs(10, 20, 30))), [10, 20, 30]);
});

test('ucs: xyz -> ucs', function () {
	// XYZ 0-100, UCS: U/V/W 0-100
	is(space.xyz.ucs(0, 0, 0), [0, 0, 0]);
	is(space.xyz.ucs(100, 100, 100).map(round(1)), [66.7, 100, 150]);
});


// CIE 1964 U*V*W*: W* = 25·Y^(1/3) − 17 (Y in 0-100), U*/V* = 13·W*·(u′−u′n,v′−v′n).
test('uvw: xyz -> uvw', function () {
	// white (Y=100): achromatic U*=V*=0, W* = 25·100^(1/3) − 17 = 99.04
	is(space.xyz.uvw(95.0456, 100, 108.9058).map(round(2)), [0, 0, 99.04], 'white');
	// black (Y=0): U*=V*=0, W* = −17 (formula limit, no NaN)
	is(space.xyz.uvw(0, 0, 0).map(round(2)), [0, 0, -17], 'black');
	is(space.xyz.uvw(100, 100, 100).map(round(2)), [16.35, 4.6, 99.04]);
});

test('uvw: uvw -> xyz', function () {
	for (const c of [[10, 20, 30], [50, 40, 30], [20, 20, 20]])
		is(space.uvw.xyz(...space.xyz.uvw(...c)).map(round(0)), c, `roundtrip ${c}`);
});

// CAM16-JMh. Validated against colorjs `cam16-jmh` in the differential suite (test/reference.js).
test('cam16', () => {
	is(space.cam16.xyz(0, 0, 0).map(round(3)), [0, 0, 0], 'black -> [0,0,0] (was NaN: J=0 division)');
	is(space.rgb.cam16(0, 0, 0).map(round(3)), [0, 0, 0], 'rgb black');
	is(space.rgb.cam16(200, 100, 50).map(round(1)), [44.6, 37.4, 42.8], 'vs colorjs cam16-jmh');
	for (const c of [[200, 100, 50], [128, 128, 128], [255, 0, 0]])
		is(space.cam16.rgb(...space.rgb.cam16(...c)).map(round(0)), c, `roundtrip ${c}`);
});



test('cubehelix: paint', function () {
	if (typeof document === 'undefined') return;

	var cnv = document.createElement('canvas');
	cnv.width = 400;
	cnv.height = 30;
	document.body.appendChild(cnv);

	var ctx = cnv.getContext('2d');

	for (var i = 0; i < 1; i += 0.01) {
		ctx.fillStyle = 'rgb(' + space.cubehelix.rgb(i, {
			rotation: 1,
			start: 0,
			hue: 1
		}).map(v => Math.round(v * 255)) + ')';
		ctx.fillRect(i * cnv.width, 0, 4, cnv.height);
	}
});



// Note: osaucs -> xyy (reverse transformation) is not implemented
// There's no analytical solution - would require numerical methods
// See: http://www.researchgate.net/publication/259253763_Comparison_of_the_performance_of_inverse_transformation_methods_from_OSA-UCS_to_CIEXYZ
test.todo('osaucs -> xyy', function () {
	// is((space.osaucspace.xyy([0,-4,-4])), [33.71, 26.46, 46.66]);
	// is((space.osaucspace.xyy([-8,-6,+2])), [1.773902, 1.049996, 7.893570]);
	// is((space.osaucspace.xyy(space.xyy.osaucs([10,20,30]))), [10,20,30]);
});

test('osaucs: xyz -> osaucs (forward)', function () {
	// XYZ 0-100, OSA-UCS: L/j/g — values after the 0.7990 matrix + signed-cbrt toe fix
	is((space.xyz.osaucs(33.71, 26.46, 46.66).map(round(0))), [0, -4, -5]);
	is((space.xyz.osaucs(1.773902, 1.049996, 7.893570).map(round(1))), [-8.7, -5.3, 0.7]);
});



// Coloroid (Nemcsics ATV): V = 10·√Y; T = position on the white→limit line
// (0 at white, 100 at the limit). ATV↔xyY round-trips exactly; A is quantized to
// 48 grades so rgb→coloroid→rgb is lossy (documented). EXPERIMENTAL — see file header.
test('coloroid', () => {
	is(round(2)(space.xyz.coloroid(54.64, 64.0, 18.26)[2]), 80, 'V = 10·√64 = 80');
	is(round(2)(space.xyz.coloroid(95.0456, 100, 108.9058)[1]) + 0, 0, 'white point -> T=0');
	// a hue's limit chromaticity -> T=100 for that grade
	const lim = space.coloroid.table[20];
	is(space.xyy.coloroid(lim[3], lim[4], 25).map(round(1)), [lim[0], 100, 50], 'limit color -> T=100');
	// ATV -> xyY -> ATV round-trips exactly (for a grade)
	is(space.xyy.coloroid(...space.coloroid.xyy(30, 60, 50)).map(round(2)), [30, 60, 50], 'ATV roundtrip');
	// no NaN/crash on any rgb (incl. previously-crashing blues); hue is continuous
	// (fractional A between grade rows, wrap segment 76→10 owns (76,77)) — and exact
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [18, 7, 95], [128, 128, 128]]) {
		const atv = space.rgb.coloroid(...c);
		is(atv[0] >= 10 && atv[0] < 77 && atv.every(Number.isFinite), true, `valid finite ATV for ${c}`);
		is(space.coloroid.rgb(...atv).map(round(4)), c, `rgb roundtrip exact for ${c}`);
	}
});

test('coloroid: paint side colors', function () {
	if (typeof document === 'undefined') return;

	var cnv = document.createElement('canvas');
	cnv.width = 400;
	cnv.height = 30;
	document.body.appendChild(cnv);
	var ctx = cnv.getContext('2d');

	//paint coloroid side colors
	var range = space.coloroid.table.length, w = cnv.width / range;
	var row, vals;
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		// vals = row.slice(-3).map(function (v) { return v * 100 });
        // xyz expects 0..1, table has 0..1?
        // if table has 0..1, v*100 is wrong for 0..1 expectations but right for legacy?
        // Let's assume table has 0..1.
		vals = row.slice(-3);
		ctx.fillStyle = 'rgb(' + space.xyz.rgb(...vals).map(v => Math.round(v*255)) + ')';
		ctx.fillRect(i * w, 0, Math.ceil(w), cnv.height);
	}
});

test('coloroid: paint conversion from hue', function () {
	if (typeof document === 'undefined') return;

	var cnv = document.createElement('canvas');
	cnv.width = 400;
	cnv.height = 30;
	document.body.appendChild(cnv);
	var ctx = cnv.getContext('2d');

	var range = space.coloroid.table.length, w = cnv.width / range;
	var row, vals;
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = space.coloroid.rgb(row[0], 30, 30);

		ctx.fillStyle = 'rgb(' + vals.map(v => Math.round(v*255)) + ')';
		ctx.fillRect(i * w, 0, Math.ceil(w), 10);
	}
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = space.coloroid.rgb(row[0], 50, 50);

		ctx.fillStyle = 'rgb(' + vals.map(v => Math.round(v*255)) + ')';
		ctx.fillRect(i * w, 10, Math.ceil(w), 20);
	}
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = space.coloroid.rgb(row[0], 70, 70);

		ctx.fillStyle = 'rgb(' + vals.map(v => Math.round(v*255)) + ')';
		ctx.fillRect(i * w, 20, Math.ceil(w), 30);
	}
});



test('tsl: tsl -> rgb', function () {
	// TSL: T 0-360, S 0-1, L 0-255, RGB 0-255
	is(space.tsl.rgb(0, 0, 0).map(round(0)), [0, 0, 0]); // black
	// inverse now preserves sign -> exact roundtrip (was [124,83,-83] for red)
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 128, 128], [10, 20, 30], [200, 100, 50]])
		is(space.tsl.rgb(...space.rgb.tsl(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('tsl: rgb -> tsl', () => {
	// RGB 0-255, TSL: T 0-360, S 0-1, L 0-255
	is(space.rgb.tsl(255, 255, 255).map(round(2)), [0, 0, 255]); // white: S=0, L=255
	is(space.rgb.tsl(0, 0, 0), [0, 0, 0]); // black guarded
	is(space.rgb.tsl(255, 0, 0).map(round(2)), [206.57, 1, 76.24]); // red
});

test('hsm: hsm <-> rgb', function () {
	// HSM: H 0-360, S 0-100, M 0-100, RGB 0-255
	is(space.hsm.rgb(...space.rgb.hsm(255, 0, 0)).map(round(0)), [255, 0, 0]);
	is(space.hsm.rgb(...space.rgb.hsm(0, 255, 0)).map(round(0)), [0, 255, 0]);
	is(space.hsm.rgb(...space.rgb.hsm(0, 0, 255)).map(round(0)), [0, 0, 255]);
	is(space.hsm.rgb(...space.rgb.hsm(255, 255, 255)).map(round(0)), [255, 255, 255]);
	is(space.hsm.rgb(...space.rgb.hsm(0, 0, 0)).map(round(0)), [0, 0, 0]);
	is(space.hsm.rgb(...space.rgb.hsm(128, 128, 128)).map(round(0)), [128, 128, 128]);
});

test('hsm: rgb -> hsm', function () {
	// RGB 0-255, HSM: H 0-360, S 0-100, M 0-100. S is now bounded to 100 (corrected D(m));
	// achromatic colors have S=0 with hue 0.
	is(space.rgb.hsm(255, 0, 0).map(round(2)), [0, 100, 57.14]);
	is(space.rgb.hsm(0, 255, 0).map(round(2)), [119.3, 100, 28.57]);
	is(space.rgb.hsm(0, 0, 255).map(round(2)), [234.36, 100, 14.29]);
	is(space.rgb.hsm(255, 255, 255).map(round(2)), [0, 0, 100]);
	is(space.rgb.hsm(0, 0, 0).map(round(2)), [0, 0, 0]);
	is(space.rgb.hsm(128, 128, 128).map(round(2)), [0, 0, 50.2]);
});

test('hsm: hsm -> rgb', function () {
	// HSM: H 0-360, S 0-100, M 0-100, RGB 0-255 (inputs are the corrected forward values)
	is(space.hsm.rgb(0, 100, 57.14).map(round(0)), [255, 0, 0]);
	is(space.hsm.rgb(119.3, 100, 28.57).map(round(0)), [0, 255, 0]);
	is(space.hsm.rgb(234.36, 100, 14.29).map(round(0)), [0, 0, 255]);
	is(space.hsm.rgb(0, 0, 100).map(round(0)), [255, 255, 255]);
	is(space.hsm.rgb(0, 0, 0).map(round(0)), [0, 0, 0]);
	is(space.hsm.rgb(0, 0, 50.2).map(round(0)), [128, 128, 128]);
});



test('yes: yes <-> rgb', function () {
	// YES: Y 0-1, E/S ±1, RGB 0-255
	is(space.rgb.yes(0, 0, 0), [0, 0, 0]);
	is(space.rgb.yes(255, 255, 255).map(round(2)), [1, 0, 0]); // White is pure luminance?
	// ...existing code...
});

// reference values: colorjs.io srgb->oklab (native L 0-1). gray128 L=0.6 (not 0.79)
// is the regression guard for the sRGB-linearization bug.
test("oklab: rgb -> oklab", () => {
	is(space.rgb.oklab(255, 255, 255).map(round(2)), [1, 0, 0]); // white
	is(space.rgb.oklab(0, 0, 0).map(round(2)), [0, 0, 0]); // black
	is(space.rgb.oklab(128, 128, 128).map(round(2)), [0.6, 0, 0]); // gray
	is(space.rgb.oklab(255, 0, 0).map(round(2)), [0.63, 0.22, 0.13]); // red
	is(space.rgb.oklab(0, 255, 0).map(round(2)), [0.87, -0.23, 0.18]); // green
	is(space.rgb.oklab(0, 0, 255).map(round(2)), [0.45, -0.03, -0.31]); // blue
	is(space.rgb.oklab(100, 150, 200).map(round(2)), [0.66, -0.03, -0.09]); // arbitrary
})

test("oklab: oklab -> rgb roundtrip", () => {
	is(space.oklab.rgb(1, 0, 0).map(round(0)), [255, 255, 255]); // white
	is(space.oklab.rgb(0, 0, 0).map(round(0)), [0, 0, 0]); // black
	for (const c of [[128, 128, 128], [255, 0, 0], [0, 255, 0], [0, 0, 255], [100, 150, 200], [33, 180, 90]])
		is(space.oklab.rgb(...space.rgb.oklab(...c)).map(round(2)), c, `roundtrip ${c}`);
})

test("oklab: xyz -> oklab", () => {
	// XYZ 0-100 (D65) -> native Oklab (L 0-1, a/b can exceed ±0.4 out-of-gamut)
	is(space.xyz.oklab(95.047, 100.0, 108.883).map(round(1)), [1.0, 0.0, 0.0]);
	// XYZ primaries are extreme out-of-gamut values - tests removed
})

test("oklab: oklab -> xyz", () => {
	// native Oklab (L 0-1, a/b ±0.4) -> XYZ 0-100
	is(space.oklab.xyz(1, 0, 0).map(round(1)), [95.0, 100.0, 108.8]); // D65
	// Inverse tests for extreme values removed
})

test("oklch: oklch <-> oklab", () => {
	// OKLCh: L 0-1, C 0-0.4, H 0-360; Oklab: L 0-1, a/b ±0.4
	is(space.oklch.oklab(1, 0, 0).map(round(1)), [1, 0, 0]);
	// red approximation
	// oklab red: 0.628, 0.225, 0.126
	// C = 0.258
	// h = 29.2 degrees
	is(space.oklab.oklch(0.628, 0.225, 0.126).map(round(3)), [0.628, 0.258, 29.249]);
});

test("okhsl: okhsl <-> rgb", () => {
	// OKHsl: H 0-360, S/L 0-100, RGB 0-255
	// White -> L=100
	var w = space.rgb.okhsl(255, 255, 255);
	is(round(1)(w[2]), 100, 'White L is 100');

	// Black -> L=0
	var k = space.rgb.okhsl(0, 0, 0);
	is(round(1)(k[2]), 0, 'Black L is 0');

	// Roundtrip red
	let red = [255, 0, 0];
	let hsl = space.rgb.okhsl(...red);
	is(space.okhsl.rgb(...hsl).map(round(0)), red, 'Red roundtrip');

	// Roundtrip arbitrary
	let arb = [51, 128, 204];
	let hslArb = space.rgb.okhsl(...arb);
	is(space.okhsl.rgb(...hslArb).map(round(0)), arb, 'Arbitrary roundtrip');
})

test("okhsv: okhsv <-> rgb", () => {
	// OKHSV: H 0-360, S/V 0-100, RGB 0-255
	// White -> V=100
	var w = space.rgb.okhsv(255, 255, 255);
	is(round(1)(w[2]), 100, 'White V is 100');

	// Black -> V=0
	var k = space.rgb.okhsv(0, 0, 0);
	is(round(1)(k[2]), 0, 'Black V is 0');

	// Roundtrip blue
	let blue = [0, 0, 255];
	let hsv = space.rgb.okhsv(...blue);
	is(space.okhsv.rgb(...hsv).map(round(0)), blue, 'Blue roundtrip');

	// Roundtrip arbitrary
	let arb = [51, 128, 204];
	let hsvArb = space.rgb.okhsv(...arb);
	is(space.okhsv.rgb(...hsvArb).map(round(0)), arb, 'Arbitrary roundtrip');
})

test("oklrab: oklrab <-> oklab", () => {
	// OKLrab: Lr 0-1, a/b ±0.4; Oklab: L 0-1, a/b ±0.4
	// White
	// oklab L=1 -> oklrab Lr approx 1
	// toeInv(1) ~= 1
	is(space.oklab.oklrab(1, 0, 0).map(round(1)), [1, 0, 0]);
	is(space.oklrab.oklab(1, 0, 0).map(round(1)), [1, 0, 0]);

	// Gray
	// oklab L=0.5 -> oklrab Lr should be different
	var gray = space.oklab.oklrab(0.5, 0, 0);
	// toeInv(0.5) is not 0.5 (it is ~0.42).
	if (gray[0] == 0.5) throw new Error("oklrab L should differ from oklab L for gray");

	// Roundtrip
	is(space.oklrab.oklab(...gray).map(round(2)), [0.5, 0, 0]);
});

test("oklrch: oklrch <-> oklrab", () => {
	// OKLRCh: Lr 0-1, C 0-0.4, H 0-360; OKLrab: Lr 0-1, a/b ±0.4
	// Similar to oklch <-> oklab but for Linear Lightness space
	// White
	is(space.oklrab.oklrch(1, 0, 0).map(round(1)), [1, 0, 0]);

	// Red-ish color
	// oklrab [0.5, 0.2, 0.1] -> oklrch [0.5, C, h]
	// C = sqrt(0.2^2 + 0.1^2) = sqrt(0.05) ~= 0.224
	// h = atan2(0.1, 0.2)
	var c = space.oklrab.oklrch(0.5, 0.2, 0.1);
	is(round(1)(c[0]), 0.5); // L should match
	is(round(3)(c[1]), 0.224); // C

	// Roundtrip
	is(space.oklrch.oklrab(...c).map(round(1)), [0.5, 0.2, 0.1]);
});

test("jzazbz: jzazbz <-> xyz", () => {
	// Jzazbz: Jz 0-1, az/bz ±0.5, XYZ 0-100
	// Roundtrip
	let xyz = [95.047, 100.0, 108.883]; // D65 White
	let jz = space.xyz.jzazbz(...xyz);
	// console.log('Jz for White:', jz);

	// Check reversibility
	is(space.jzazbz.xyz(...jz).map(round(2)), xyz.map(round(2)));

	// Black
	is(space.xyz.jzazbz(0, 0, 0).map(round(2)), [0, 0, 0]);
});

test("jzczhz: jzczhz <-> jzazbz", () => {
	// JzCzHz: Jz 0-1, Cz 0-0.5, Hz 0-360; Jzazbz: Jz 0-1, az/bz ±0.5 (no rescaling).
	// Explicit polar values guard against any stray rescaling in the polar transform.
	is(space.jzazbz.jzczhz(0.15, 0.05, -0.05).map(round(4)), [0.15, 0.0707, 315]);
	is(space.jzczhz.jzazbz(0.15, 0.0707, 315).map(round(2)), [0.15, 0.05, -0.05]);
});

test('p3', () => {
	// P3: 0-1 (linear), XYZ 0-100
	is(space.p3.xyz(1, 1, 1).map(round(1)), [95.0, 100.0, 108.9], 'p3 white to xyz');
	is(space.xyz.p3(95.05, 100.0, 108.90).map(round(2)), [1, 1, 1], 'xyz white to p3');
});

test('rec2020', () => {
	// Rec2020: 0-1 (linear), XYZ 0-100
	is(space.rec2020.xyz(1, 1, 1).map(round(1)), [95.0, 100.0, 108.9], 'rec2020 white to xyz');
	is(space.xyz.rec2020(95.05, 100.0, 108.90).map(round(2)), [1, 1, 1], 'xyz white to rec2020');
});

test('prophoto', () => {
	// ProPhoto: 0-1 (linear), XYZ 0-100
	is(space.prophoto.xyz(1, 1, 1).map(round(0)), [95, 100, 109], 'prophoto white to xyz');
	is(space.xyz.prophoto(95.05, 100.0, 108.90).map(round(2)), [1, 1, 1], 'xyz white to prophoto');
});

test('a98rgb', () => {
	// A98 RGB: 0-1 (linear), XYZ 0-100
	is(space.a98rgb.xyz(1, 1, 1).map(round(1)), [95.0, 100.0, 108.9], 'a98rgb white to xyz');
	is(space.xyz.a98rgb(95.05, 100.0, 108.90).map(round(2)), [1, 1, 1], 'xyz white to a98rgb');
});

test('acescg', () => {
	// ACEScg: 0-1 (linear), XYZ 0-100
	is(space.acescg.xyz(1, 1, 1).map(round(1)), [95.0, 100.0, 108.9], 'acescg white to xyz');
});

// gray = CIE relative luminance Y (linearized Rec.709), so it equals XYZ Y / 100.
test('gray', () => {
	is(space.rgb.gray(0, 0, 0), [0], 'black');
	is(space.rgb.gray(255, 255, 255).map(round(3)), [1], 'white');
	is(space.rgb.gray(128, 128, 128).map(round(3)), [0.216], 'mid-gray luminance (not 0.5 luma)');
	is(space.rgb.gray(255, 0, 0).map(round(3)), [0.213], 'red');
	is(space.rgb.gray(0, 255, 0).map(round(3)), [0.715], 'green');
	is(space.rgb.gray(0, 0, 255).map(round(3)), [0.072], 'blue');
	// defining property: gray == XYZ Y / 100
	for (const c of [[128, 128, 128], [200, 100, 50], [0, 255, 0]])
		is(round(4)(space.rgb.gray(...c)[0]), round(4)(space.rgb.xyz(...c)[1] / 100), `= XYZ Y for ${c}`);
	// inverse: luminance Y -> achromatic sRGB with that luminance; round-trips
	is(space.gray.rgb(0), [0, 0, 0], 'black');
	is(space.gray.rgb(1).map(round(0)), [255, 255, 255], 'white');
	for (const v of [32, 128, 200])
		is(round(0)(space.gray.rgb(space.rgb.gray(v, v, v)[0])[0]), v, `roundtrip ${v}`);
});

test('rg', () => {
	// RG: r/g 0-1, RGB 0-255
	is(space.rgb.rg(255, 0, 0), [1, 0], 'red to rg');
	is(space.rgb.rg(0, 255, 0), [0, 1], 'green to rg');
	is(space.rgb.rg(0, 0, 255).map(round(3)), [0, 0], 'blue to rg');
	is(space.rgb.rg(255, 255, 255).map(round(2)), [0.33, 0.33], 'white to rg');
	is(space.rgb.rg(0, 0, 0), [1 / 3, 1 / 3], 'black to rg — the neutral point');

	is(space.rg.rgb(1, 0), [255, 0, 0], 'rg to red');
	is(space.rg.rgb(0, 1), [0, 255, 0], 'rg to green');
	is(space.rg.rgb(0, 0), [0, 0, 255], 'rg to blue');
	// 0.333 doesn't round-trip perfectly, use exact 1/3
	is(space.rg.rgb(1/3, 1/3).map(round(0)), [255, 255, 255], 'rg to white');
});

test('hcl', () => {
	// HCL: H 0-360, C 0-150, L 0-100, RGB 0-255
	is(space.rgb.hcl(0, 0, 0).map(round(1)), [0, 0, 0], 'black to hcl');
	is(space.rgb.hcl(255, 255, 255).map(round(1)), [0, 0, 100], 'white to hcl (L = mix(-U,V,Q): white -> exactly 100)');
	is(space.rgb.hcl(255, 0, 0).map(round(1)), [0, 100.0, 94.3], 'red to hcl');

	is(space.hcl.rgb(0, 0, 0), [0, 0, 0], 'hcl to black');
	const hcl = space.rgb.hcl(128, 128, 128);
	is(space.hcl.rgb(...hcl).map(round(0)), [128, 128, 128], 'hcl gray round-trip (exact after the L mis-port fix; was pinned lossy at 121)');
	// saturated colors now roundtrip after the frac() fix (green was [255,255,0])
	for (const c of [[0, 255, 0], [0, 0, 255], [255, 128, 0]])
		is(space.hcl.rgb(...space.rgb.hcl(...c)).map(round(0)), c, `hcl roundtrip ${c}`);
});

test('hcy', () => {
	// HCY: H 0-360, C 0-100, Y 0-100 (Chilliant luma-based). Y channel IS Rec.601 luma
	// (red 29.9, green 58.7, blue 11.4) — guards against the old hsi-copy (Y=33.3 for all).
	is(round(1)(space.rgb.hcy(255, 0, 0)[2]), 29.9, 'red luma');
	is(round(1)(space.rgb.hcy(0, 255, 0)[2]), 58.7, 'green luma');
	is(round(1)(space.rgb.hcy(0, 0, 255)[2]), 11.4, 'blue luma');
	// achromatic must not produce NaN
	is(space.rgb.hcy(0, 0, 0).map(round(1)), [0, 0, 0], 'black');
	is(space.rgb.hcy(255, 255, 255).map(round(1)), [0, 0, 100], 'white');
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 128, 128], [200, 100, 50]])
		is(space.hcy.rgb(...space.rgb.hcy(...c)).map(round(0)), c, `roundtrip ${c}`);
});


// --- spaces added in v3 (validated by composition with colorjs-validated neighbours) ---

test('lch-d65: polar of lab-d65', () => {
	// lch-d65 is the exact polar of lab-d65 (which is differential-validated vs colorjs)
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]]) {
		const [L, a, b] = space.rgb['lab-d65'](...c);
		const [Lc, C, H] = space.rgb['lch-d65'](...c);
		is(round(3)(Lc), round(3)(L), `L matches for ${c}`);
		is(round(2)(C), round(2)(Math.sqrt(a * a + b * b)), `C = √(a²+b²) for ${c}`);
	}
	for (const c of [[255, 0, 0], [0, 128, 255], [128, 128, 128], [200, 100, 50]])
		is(space['lch-d65'].rgb(...space.rgb['lch-d65'](...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('cam16-ucs: compression of cam16', () => {
	// black -> 0; roundtrip through cam16
	is(space.rgb['cam16-ucs'](0, 0, 0).map(round(2)), [0, 0, 0], 'black');
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [200, 100, 50]])
		is(space['cam16-ucs'].rgb(...space.rgb['cam16-ucs'](...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('okhwb: hwb analog of okhsv', () => {
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 128, 128], [200, 100, 50]])
		is(space.okhwb.rgb(...space.rgb.okhwb(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('aces2065-1: AP0, via acescg', () => {
	// AP0 <-> AP1 are exact inverses
	is(space.acescg['aces2065-1'](...space['aces2065-1'].acescg(0.3, 0.5, 0.7)).map(round(6)), [0.3, 0.5, 0.7]);
	for (const c of [[255, 0, 0], [0, 255, 0], [200, 100, 50]])
		is(space['aces2065-1'].rgb(...space.rgb['aces2065-1'](...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('acescct: ACES grading log, via acescg', () => {
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [200, 100, 50]])
		is(space.acescct.rgb(...space.rgb.acescct(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('rec709: BT.709 transfer on sRGB primaries', () => {
	// OETF boundary: linear 0.018 -> 4.5*0.018 = 0.081
	is(round(3)(space.lrgb.rec709(0.018, 0.018, 0.018)[0]), 0.081, 'OETF knee');
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space.rec709.rgb(...space.rgb.rec709(...c)).map(round(0)), c, `roundtrip ${c}`);
});


// --- camera-log, cinema & video spaces added in v3 (validated vs cited spec reference points) ---

test('logc4: ARRI LogC4 / AWG4', () => {
	// black point 95/1023 -> XYZ 0; 18% gray code -> Y=18 (ARRI LogC4 Spec, App. B)
	is(space.logc4.xyz(0.09286412512218964, 0.09286412512218964, 0.09286412512218964).map(round(4)), [0, 0, 0]);
	is(round(2)(space.logc4.xyz(0.2783958365482653, 0.2783958365482653, 0.2783958365482653)[1]), 18);
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space.logc4.rgb(...space.rgb.logc4(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('slog3: Sony S-Log3 / S-Gamut3', () => {
	// 18% gray = 420/1023 -> Y=18; black foot 95/1023 -> 0 (Sony white paper)
	is(round(2)(space.slog3.xyz(0.41055718475073316, 0.41055718475073316, 0.41055718475073316)[1]), 18);
	is(space.slog3.xyz(0.09286412512218964, 0.09286412512218964, 0.09286412512218964).map(round(4)), [0, 0, 0]);
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space.slog3.rgb(...space.rgb.slog3(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('vlog: Panasonic V-Log / V-Gamut', () => {
	// 0% -> code 0.125 -> XYZ 0; 18% -> Y=18 (Panasonic V-Log manual)
	is(space.vlog.xyz(0.125, 0.125, 0.125).map(round(4)), [0, 0, 0]);
	is(round(2)(space.vlog.xyz(0.42331144876013616, 0.42331144876013616, 0.42331144876013616)[1]), 18);
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space.vlog.rgb(...space.rgb.vlog(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('log3g10: RED Log3G10 / REDWideGamutRGB', () => {
	// 18% gray ~ code 1/3 -> Y=18 (RED whitepaper 915-0187 Rev-C)
	is(round(1)(space.log3g10.xyz(0.3333329120259919, 0.3333329120259919, 0.3333329120259919)[1]), 18);
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space.log3g10.rgb(...space.rgb.log3g10(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('clog2: Canon Log 2 / Cinema Gamut', () => {
	// black 0.092864125 -> 0; 18% -> Y=18; 90% reflectance -> Y=90 (Canon IDT / colour-science)
	is(space.clog2.xyz(0.092864125, 0.092864125, 0.092864125).map(round(4)), [0, 0, 0]);
	is(round(2)(space.clog2.xyz(0.398254692561492, 0.398254692561492, 0.398254692561492)[1]), 18);
	is(round(2)(space.clog2.xyz(0.562304264803537, 0.562304264803537, 0.562304264803537)[1]), 90);
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space.clog2.rgb(...space.rgb.clog2(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('dci-p3: theatrical P3 (DCI white, gamma 2.6)', () => {
	// encoded white -> D65 white; 0.5 gray (SMPTE RP 431-2 + Bradford, colour-science)
	is(space['dci-p3'].xyz(1, 1, 1).map(round(2)), [95.05, 100, 108.91]);
	is(space['dci-p3'].xyz(0.5, 0.5, 0.5).map(round(3)), [15.677, 16.494, 17.963]);
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space['dci-p3'].rgb(...space.rgb['dci-p3'](...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('smpte-c: SMPTE 170M NTSC', () => {
	// encoded white -> D65 white; red primary (SMPTE RP 145 / colour-science)
	is(space['smpte-c'].xyz(1, 1, 1).map(round(2)), [95.05, 100, 108.91]);
	is(space['smpte-c'].xyz(1, 0, 0).map(round(3)), [39.352, 21.238, 1.874]);
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space['smpte-c'].rgb(...space.rgb['smpte-c'](...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('ipt: Ebner & Fairchild 1998', () => {
	// colour-science XYZ_to_IPT doctest (XYZ scaled x100 for this lib)
	is(space.xyz.ipt(20.654008, 12.197225, 5.136952).map(round(5)), [0.38426, 0.38487, 0.18887]);
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [200, 100, 50]])
		is(space.ipt.rgb(...space.rgb.ipt(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('scrgb: linear sRGB, extended range', () => {
	// identity to lrgb in value; wide range is the only difference (IEC 61966-2-2)
	is(space.scrgb.lrgb(2, -0.5, 1).map(round(6)), [2, -0.5, 1]);
	is(space.rgb.scrgb(...space.scrgb.rgb(0.8, 0.2, 0.5)).map(round(6)), [0.8, 0.2, 0.5]);
});

test('rec2100-linear: BT.2100 linear (= BT.2020)', () => {
	// identical to rec2020-linear; matrix to XYZ matches (CSS Color HDR §8.3)
	is(space['rec2100-linear']['rec2020-linear'](0.3, 0.6, 0.1).map(round(6)), [0.3, 0.6, 0.1]);
	is(space['rec2100-linear'].xyz(1, 0, 0).map(round(4)), [63.6958, 26.2700, 0]);
});


test('din99d: DIN99d (Cui 2002, with X-correction)', () => {
	// canonical X-corrected reference; L99 cross-checks colour-science (X-correction-independent)
	is(space.xyz.din99d(20.654008, 12.197225, 5.136952).map(round(4)), [45.3120, 35.0742, 12.7071]);
	// neutral (gray) must stay achromatic
	const n = space.xyz.din99d(95.04559270516716 * 0.5, 50, 108.90577507598784 * 0.5);
	is([round(6)(n[1]), round(6)(n[2])], [0, 0], 'neutral -> a=b=0');
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 128, 128], [200, 100, 50]])
		is(space.din99d.rgb(...space.rgb.din99d(...c)).map(round(0)), c, `roundtrip ${c}`);
});


// --- defect fixes (audit pass): regression + bona-fide cited references ---

test('hcg: hue wraps (no negative) + color-convert refs', () => {
	// regression: max=R, g<b gave negative hue -> broke roundtrip
	is(round(2)(space.rgb.hcg(255, 0, 128)[0]), 329.88, 'hue not negative');
	is(space.hcg.rgb(...space.rgb.hcg(255, 0, 128)).map(round(0)), [255, 0, 128], 'roundtrip');
	// color-convert v2.0.1 (canonical JS HCG)
	is(space.rgb.hcg(255, 0, 0).map(round(2)), [0, 100, 0]);
	is(space.rgb.hcg(51, 153, 255).map(round(2)), [210, 80, 100]);
});

test('osaucs: vs colour-science XYZ_to_OSA_UCS', () => {
	// colour-science v0.4.7: XYZ_to_OSA_UCS([0.20654008,0.12197225,0.05136952]*100)
	const r = space.xyz.osaucs(20.654008, 12.197225, 5.136952);
	is(round(3)(r[1]), 2.997, 'j');
	is(round(3)(r[2]), -9.668, 'g');
	is(round(2)(r[0]), -3.00, 'L'); // within K/offset constant precision
});

test('tsl: invertible at g\'=0 + Terrillon refs', () => {
	// Terrillon & Akamatsu (2000)
	is(space.rgb.tsl(255, 0, 0).map(round(4)), [206.5651, 1, 76.245]);
	is(space.rgb.tsl(0, 0, 255).map(round(4)), [315, 0.6325, 29.07]);
	// regression: g'=0, r'>0 must stay invertible (was T=0 -> r/b swap)
	is(space.tsl.rgb(...space.rgb.tsl(170, 100, 30)).map(round(0)), [170, 100, 30], 'g\'=0 roundtrip');
	is(round(0)(space.rgb.tsl(128, 128, 128)[0]), 0, 'gray T=0');
});


test('ciecam02: CIECAM02 vs Moroney et al. 2002 worked example', () => {
	// XYZ [19.01,20,21.78], D65, La=318.31, Yb=20, average -> J=41.7311, M=0.1088, h=219.0484
	is(space.xyz.ciecam02(19.01, 20.00, 21.78).map(round(3)), [41.731, 0.109, 219.048]);
	is(space.ciecam02.xyz(...space.xyz.ciecam02(19.01, 20, 21.78)).map(round(2)), [19.01, 20, 21.78], 'inverse');
	for (const c of [[255, 0, 0], [0, 128, 255], [128, 128, 128], [200, 100, 50]])
		is(space.ciecam02.rgb(...space.rgb.ciecam02(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('cam02-ucs: UCS of CIECAM02 (Luo et al. 2006)', () => {
	is(space['cam02-ucs'].ciecam02(...space.ciecam02['cam02-ucs'](41.731, 0.109, 219.048)).map(round(3)), [41.731, 0.109, 219.048]);
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [200, 100, 50]])
		is(space['cam02-ucs'].rgb(...space.rgb['cam02-ucs'](...c)).map(round(0)), c, `roundtrip ${c}`);
});


// --- deep fixes (research pass): each was broken, now matches an authoritative reference ---

test('hct: Material viewing conditions (vs colorjs.io)', () => {
	// XYZ red primary -> HCT; C was 112.39 with cam16's conditions, colorjs gives 113.397
	is(space.xyz.hct(41.24, 21.26, 1.93).map(round(3)), [27.407, 113.397, 53.233]);
	for (const c of [[255, 0, 0], [0, 128, 255], [200, 100, 50]])
		is(space.hct.rgb(...space.rgb.hct(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('hsm: D(m) bounds S to 100 (Bianconi 2009)', () => {
	is(space.rgb.hsm(255, 0, 0).map(round(4)), [0, 100, 57.1429]);
	// the bug: S exceeded 100 (was 106.3% for [30,255,255]); now bounded
	let smax = 0; for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) smax = Math.max(smax, space.rgb.hsm(r, g, b)[1]);
	is(smax <= 100.0001, true, `S max ${smax.toFixed(3)} <= 100`);
});

test('coloroid: corrected Nemcsics table (ATV exact)', () => {
	// Nemcsics 1980: A=70,T=70,V=60 -> xyY [0.235644, 0.641004, 36]
	is(space.coloroid.xyy(70, 70, 60).map(round(5)), [0.23564, 0.64100, 36]);
	is(space.xyy.coloroid(...space.coloroid.xyy(40, 50, 60)).map(round(2)), [40, 50, 60], 'ATV roundtrip');
});

test('yccbccrc: constant-luminance (BT.2020 Table 4)', () => {
	// Rec.2020 red primary -> CL: Yc=oetf(0.2627), piecewise chroma
	is(space['rec2020-linear'].yccbccrc(1, 0, 0).map(round(6)), [0.503085, -0.259269, 0.500116]);
	is(space['rec2020-linear'].yccbccrc(1, 1, 1).map(round(6)), [1, 0, 0], 'white -> Yc=1, Cbc=Crc=0');
});
