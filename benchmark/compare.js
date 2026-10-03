/**
 * Benchmark comparison: color-space vs other popular color libraries
 *
 * Measures performance of common color space conversions across libraries.
 */

import space from '../index.js';

// Lazy load competitor libraries to avoid startup overhead
let lite, culori, colorjs, texel, chroma, tinycolor, color, colorConvert, d3;
const texelOut = [0, 0, 0]; // texel's idiom: convert(coords, from, to, out) — reused scratch

async function loadLibraries() {
	try {
		const [liteModule, culoriModule, colorjsModule, texelModule, d3Module, chromaModule, tinycolorModule, colorModule, colorConvertModule] = await Promise.all([
			import('../lite.js').catch(() => null),
			import('culori').catch(() => null),
			import('colorjs.io').catch(() => null),
			import('@texel/color').catch(() => null),
			import('d3-color').catch(() => null),
			import('chroma-js').catch(() => null),
			import('tinycolor2').catch(() => null),
			import('color').catch(() => null),
			import('color-convert').catch(() => null)
		]);

		lite = liteModule?.default;
		culori = culoriModule;
		colorjs = colorjsModule?.default; // Color class is default export
		texel = texelModule;
		d3 = d3Module;
		chroma = chromaModule?.default;
		tinycolor = tinycolorModule?.default;
		color = colorModule?.default;
		colorConvert = colorConvertModule?.default;

		console.log('Loaded libraries:');
		console.log('  ✓ color-space (this library)');
		if (lite) console.log('  ✓ color-space/lite');
		if (culori) console.log('  ✓ culori');
		if (colorjs) console.log('  ✓ colorjs.io');
		if (texel) console.log('  ✓ @texel/color');
		if (d3) console.log('  ✓ d3-color');
		if (chroma) console.log('  ✓ chroma-js');
		if (tinycolor) console.log('  ✓ tinycolor2');
		if (color) console.log('  ✓ color');
		if (colorConvert) console.log('  ✓ color-convert');
		console.log('');
	} catch (err) {
		console.error('Error loading libraries:', err.message);
	}
}

// Benchmark utilities — warm first, then report the median of seven samples.
// `sink` makes each call's observable result escape the timed loop; unsupported
// cases return null and are never timed.
let sink
function benchmark(name, fn, iterations = 100000, rounds = 7) {
	for (let i = 0; i < Math.min(iterations, 20000); i++) sink = fn(i)
	const samples = []
	for (let round = 0; round < rounds; round++) {
		const start = performance.now()
		for (let i = 0; i < iterations; i++) sink = fn(i)
		samples.push(performance.now() - start)
	}
	samples.sort((a, b) => a - b)
	const total = samples[samples.length >> 1]
	const perOp = total / iterations * 1000 // microseconds
	return { total, perOp, opsPerSec: 1000 / (total / iterations) }
}

function formatNumber(num) {
	if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
	if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
	return num.toFixed(2);
}

function formatTime(microseconds) {
	if (microseconds < 1) return (microseconds * 1000).toFixed(3) + 'ns';
	if (microseconds < 1000) return microseconds.toFixed(3) + 'µs';
	return (microseconds / 1000).toFixed(3) + 'ms';
}

function printResults(testName, results) {
	console.log(`\n${testName}:`);
	console.log('─'.repeat(80));
	console.log(`${'Library'.padEnd(20)} ${'Ops/sec'.padStart(12)} ${'Time/op'.padStart(12)} ${'vs fastest'.padStart(12)}`);
	console.log('─'.repeat(80));

	const fastest = Math.max(...results.map(r => r.opsPerSec));

	results.forEach(({ library, opsPerSec, perOp }) => {
		const ratio = (fastest / opsPerSec).toFixed(2) + 'x';
		const star = opsPerSec === fastest ? ' ⚡' : '';
		console.log(
			`${(library + star).padEnd(20)} ` +
			`${formatNumber(opsPerSec).padStart(12)} ` +
			`${formatTime(perOp).padStart(12)} ` +
			`${ratio.padStart(12)}`
		);
	});
}

// ── inputs: a fixed table of 256 colors, read by every library in its own units ──
// Literal arguments let V8 inline a pure conversion and fold it to a constant, so a
// library would be timed on code that no longer runs (2026-10, Node 22: d3-color
// rgb→lab 47 M op/s on literals vs 2.6 M on varied input, color-space rgb.lab 17 vs
// 3.5, culori — which allocates per call — 3.2 vs 3.2). Every case reads entry
// `i & 255` from a precomputed table in its library's units, so no case pays for a
// per-call unit conversion and the index cost is the same for all of them.
const N = 256, at = (i) => (i & (N - 1)) * 3
const RGB = new Float64Array(N * 3).map((_, i) => (i * 2654435761) % 256) // never gray
const conv = (to) => { const t = new Float64Array(N * 3)
	for (let k = 0; k < N * 3; k += 3) t.set(space.rgb[to](RGB[k], RGB[k + 1], RGB[k + 2]), k)
	return t }
const LAB = conv('lab'), HSL = conv('hsl'), OKLAB = conv('oklab')
const RGB01 = RGB.map((v) => v / 255)
const HSL01 = HSL.map((v, k) => k % 3 ? v / 100 : v) // h 0-360, s/l 0-1

// Test cases — `i` selects the input; a case returning null is unsupported, never timed
const tests = [
	{
		name: 'RGB → Lab',
		colorSpace: (i) => { const k = at(i); return space.rgb.lab(RGB[k], RGB[k + 1], RGB[k + 2]) },
		lite: (i) => { const k = at(i); return lite.rgb.lab(RGB[k], RGB[k + 1], RGB[k + 2]) },
		culori: (i) => { const k = at(i); return culori.lab({ mode: 'rgb', r: RGB01[k], g: RGB01[k + 1], b: RGB01[k + 2] }) },
		colorjs: (i) => { const k = at(i); return new colorjs('srgb', [RGB01[k], RGB01[k + 1], RGB01[k + 2]]).lab },
		texel: () => null, // texel doesn't support Lab
		d3: (i) => { const k = at(i); return d3.lab(d3.rgb(RGB[k], RGB[k + 1], RGB[k + 2])) },
		chroma: (i) => { const k = at(i); return chroma(RGB[k], RGB[k + 1], RGB[k + 2], 'rgb').lab() },
		tinycolor: () => null, // tinycolor doesn't support Lab
		color: (i) => { const k = at(i); return color({ r: RGB[k], g: RGB[k + 1], b: RGB[k + 2] }).lab().array() },
		colorConvert: (i) => { const k = at(i); return colorConvert.rgb.lab(RGB[k], RGB[k + 1], RGB[k + 2]) },
	},
	{
		name: 'Lab → RGB',
		colorSpace: (i) => { const k = at(i); return space.lab.rgb(LAB[k], LAB[k + 1], LAB[k + 2]) },
		lite: (i) => { const k = at(i); return lite.lab.rgb(LAB[k], LAB[k + 1], LAB[k + 2]) },
		culori: (i) => { const k = at(i); return culori.rgb({ mode: 'lab', l: LAB[k], a: LAB[k + 1], b: LAB[k + 2] }) },
		colorjs: (i) => { const k = at(i); return new colorjs('lab', [LAB[k], LAB[k + 1], LAB[k + 2]]).srgb },
		texel: () => null, // texel doesn't support Lab
		d3: (i) => { const k = at(i); return d3.rgb(d3.lab(LAB[k], LAB[k + 1], LAB[k + 2])) },
		chroma: (i) => { const k = at(i); return chroma.lab(LAB[k], LAB[k + 1], LAB[k + 2]).rgb() },
		tinycolor: () => null, // tinycolor doesn't support Lab
		color: (i) => { const k = at(i); return color.lab(LAB[k], LAB[k + 1], LAB[k + 2]).rgb().array() },
		colorConvert: (i) => { const k = at(i); return colorConvert.lab.rgb(LAB[k], LAB[k + 1], LAB[k + 2]) },
	},
	{
		name: 'RGB → HSL',
		colorSpace: (i) => { const k = at(i); return space.rgb.hsl(RGB[k], RGB[k + 1], RGB[k + 2]) },
		lite: () => null, // device cylinders live in the full catalog
		culori: (i) => { const k = at(i); return culori.hsl({ mode: 'rgb', r: RGB01[k], g: RGB01[k + 1], b: RGB01[k + 2] }) },
		colorjs: (i) => { const k = at(i); return new colorjs('srgb', [RGB01[k], RGB01[k + 1], RGB01[k + 2]]).hsl },
		texel: () => null, // texel has OKHSL, not classic HSL
		d3: (i) => { const k = at(i); return d3.hsl(d3.rgb(RGB[k], RGB[k + 1], RGB[k + 2])) },
		chroma: (i) => { const k = at(i); return chroma(RGB[k], RGB[k + 1], RGB[k + 2], 'rgb').hsl() },
		tinycolor: (i) => { const k = at(i); return tinycolor({ r: RGB[k], g: RGB[k + 1], b: RGB[k + 2] }).toHsl() },
		color: (i) => { const k = at(i); return color({ r: RGB[k], g: RGB[k + 1], b: RGB[k + 2] }).hsl().array() },
		colorConvert: (i) => { const k = at(i); return colorConvert.rgb.hsl(RGB[k], RGB[k + 1], RGB[k + 2]) },
	},
	{
		name: 'HSL → RGB',
		colorSpace: (i) => { const k = at(i); return space.hsl.rgb(HSL[k], HSL[k + 1], HSL[k + 2]) },
		lite: () => null, // device cylinders live in the full catalog
		culori: (i) => { const k = at(i); return culori.rgb({ mode: 'hsl', h: HSL01[k], s: HSL01[k + 1], l: HSL01[k + 2] }) },
		colorjs: (i) => { const k = at(i); return new colorjs('hsl', [HSL[k], HSL[k + 1], HSL[k + 2]]).srgb },
		texel: () => null, // texel has OKHSL, not classic HSL
		d3: (i) => { const k = at(i); return d3.rgb(d3.hsl(HSL01[k], HSL01[k + 1], HSL01[k + 2])) },
		chroma: (i) => { const k = at(i); return chroma.hsl(HSL01[k], HSL01[k + 1], HSL01[k + 2]).rgb() },
		tinycolor: (i) => { const k = at(i); return tinycolor({ h: HSL01[k], s: HSL01[k + 1], l: HSL01[k + 2] }).toRgb() },
		color: (i) => { const k = at(i); return color.hsl(HSL[k], HSL[k + 1], HSL[k + 2]).rgb().array() },
		colorConvert: (i) => { const k = at(i); return colorConvert.hsl.rgb(HSL[k], HSL[k + 1], HSL[k + 2]) },
	},
	{
		name: 'RGB → Oklab',
		colorSpace: (i) => { const k = at(i); return space.rgb.oklab(RGB[k], RGB[k + 1], RGB[k + 2]) },
		lite: (i) => { const k = at(i); return lite.rgb.oklab(RGB[k], RGB[k + 1], RGB[k + 2]) },
		culori: (i) => { const k = at(i); return culori.oklab({ mode: 'rgb', r: RGB01[k], g: RGB01[k + 1], b: RGB01[k + 2] }) },
		colorjs: (i) => { const k = at(i); return new colorjs('srgb', [RGB01[k], RGB01[k + 1], RGB01[k + 2]]).oklab },
		texel: (i) => { const k = at(i); return texel.convert([RGB01[k], RGB01[k + 1], RGB01[k + 2]], texel.sRGB, texel.OKLab, texelOut) },
		chroma: (i) => { const k = at(i); return chroma(RGB[k], RGB[k + 1], RGB[k + 2], 'rgb').oklab() },
		tinycolor: () => null, // tinycolor doesn't support Oklab
		color: () => null, // color doesn't support Oklab
		colorConvert: () => null, // color-convert doesn't support Oklab
	},
	{
		name: 'Oklab → RGB',
		colorSpace: (i) => { const k = at(i); return space.oklab.rgb(OKLAB[k], OKLAB[k + 1], OKLAB[k + 2]) },
		lite: (i) => { const k = at(i); return lite.oklab.rgb(OKLAB[k], OKLAB[k + 1], OKLAB[k + 2]) },
		culori: (i) => { const k = at(i); return culori.rgb({ mode: 'oklab', l: OKLAB[k], a: OKLAB[k + 1], b: OKLAB[k + 2] }) },
		colorjs: (i) => { const k = at(i); return new colorjs('oklab', [OKLAB[k], OKLAB[k + 1], OKLAB[k + 2]]).srgb },
		texel: (i) => { const k = at(i); return texel.convert([OKLAB[k], OKLAB[k + 1], OKLAB[k + 2]], texel.OKLab, texel.sRGB, texelOut) },
		chroma: (i) => { const k = at(i); return chroma.oklab(OKLAB[k], OKLAB[k + 1], OKLAB[k + 2]).rgb() },
		tinycolor: () => null, // tinycolor doesn't support Oklab
		color: () => null, // color doesn't support Oklab
		colorConvert: () => null, // color-convert doesn't support Oklab
	},
	{
		name: 'RGB → P3',
		colorSpace: (i) => { const k = at(i); return space.rgb.p3(RGB[k], RGB[k + 1], RGB[k + 2]) },
		lite: () => null, // p3 lives in the full catalog
		culori: (i) => { const k = at(i); return culori.p3({ mode: 'rgb', r: RGB01[k], g: RGB01[k + 1], b: RGB01[k + 2] }) },
		colorjs: (i) => { const k = at(i); return new colorjs('srgb', [RGB01[k], RGB01[k + 1], RGB01[k + 2]]).p3 },
		texel: (i) => { const k = at(i); return texel.convert([RGB01[k], RGB01[k + 1], RGB01[k + 2]], texel.sRGB, texel.DisplayP3, texelOut) },
		chroma: () => null, // chroma doesn't have P3
		tinycolor: () => null, // tinycolor doesn't have P3
		color: () => null, // color doesn't have P3
		colorConvert: () => null, // color-convert doesn't have P3
	},
	{
		name: 'RGB → HSV',
		colorSpace: (i) => { const k = at(i); return space.rgb.hsv(RGB[k], RGB[k + 1], RGB[k + 2]) },
		lite: () => null, // device cylinders live in the full catalog
		culori: (i) => { const k = at(i); return culori.hsv({ mode: 'rgb', r: RGB01[k], g: RGB01[k + 1], b: RGB01[k + 2] }) },
		colorjs: () => null, // colorjs doesn't support HSV
		texel: () => null, // texel has OKHSV, not classic HSV
		chroma: (i) => { const k = at(i); return chroma(RGB[k], RGB[k + 1], RGB[k + 2], 'rgb').hsv() },
		tinycolor: (i) => { const k = at(i); return tinycolor({ r: RGB[k], g: RGB[k + 1], b: RGB[k + 2] }).toHsv() },
		color: (i) => { const k = at(i); return color({ r: RGB[k], g: RGB[k + 1], b: RGB[k + 2] }).hsv().array() },
		colorConvert: (i) => { const k = at(i); return colorConvert.rgb.hsv(RGB[k], RGB[k + 1], RGB[k + 2]) },
	},
	{
		name: 'RGB → HEX',
		colorSpace: () => null, // a conversion kernel, not a formatter
		lite: () => null,
		culori: (i) => { const k = at(i); return culori.formatHex({ mode: 'rgb', r: RGB01[k], g: RGB01[k + 1], b: RGB01[k + 2] }) },
		colorjs: (i) => { const k = at(i); return new colorjs('srgb', [RGB01[k], RGB01[k + 1], RGB01[k + 2]]).toString({ format: 'hex' }) },
		texel: (i) => { const k = at(i); return texel.RGBToHex([RGB01[k], RGB01[k + 1], RGB01[k + 2]]) },
		d3: (i) => { const k = at(i); return d3.rgb(RGB[k], RGB[k + 1], RGB[k + 2]).formatHex() },
		chroma: (i) => { const k = at(i); return chroma(RGB[k], RGB[k + 1], RGB[k + 2], 'rgb').hex() },
		tinycolor: (i) => { const k = at(i); return tinycolor({ r: RGB[k], g: RGB[k + 1], b: RGB[k + 2] }).toHexString() },
		color: (i) => { const k = at(i); return color({ r: RGB[k], g: RGB[k + 1], b: RGB[k + 2] }).hex() },
		colorConvert: (i) => { const k = at(i); return '#' + colorConvert.rgb.hex(RGB[k], RGB[k + 1], RGB[k + 2]) },
	}
];

// Startup cost: import time + RSS, each library in a fresh Node process
async function benchmarkStartup() {
	const { execFileSync } = await import('node:child_process');
	const candidates = [
		['color-space', '../index.js'],
		['color-space/lite', '../lite.js'],
		['culori', 'culori'],
		['colorjs.io', 'colorjs.io'],
		['chroma-js', 'chroma-js'],
		['color-convert', 'color-convert'],
	];
	console.log('\nStartup (fresh process: import time · process RSS after import):');
	console.log('─'.repeat(80));
	for (const [label, specifier] of candidates) {
		try {
			const out = execFileSync(process.execPath, ['--input-type=module', '-e', `
				const t = performance.now()
				await import('${specifier}')
				console.log(JSON.stringify({ ms: performance.now() - t, rss: process.memoryUsage().rss }))
			`], { cwd: new URL('.', import.meta.url).pathname, encoding: 'utf8' });
			const { ms, rss } = JSON.parse(out.trim().split('\n').pop());
			console.log(`${label.padEnd(20)} ${(ms.toFixed(1) + 'ms').padStart(10)} ${((rss / 1e6).toFixed(0) + 'MB').padStart(8)}`);
		} catch { /* library not installed */ }
	}
}

// Run benchmarks
async function runBenchmarks() {
	await benchmarkStartup();
	await loadLibraries();

	console.log('Running benchmarks (20,000 warmup calls + median of 7 × 100,000 iterations over a 256-color input table)...\n');
	console.log('Note: Results vary by hardware and JS engine optimization; unsupported operations are omitted.');
	console.log('Lower time/op and higher ops/sec is better.\n');

	// [label, case key, loaded library] — a case returning null is unsupported and
	// never timed (RGB→HEX: this package is a conversion kernel, not a formatter)
	const LIBS = [
		['color-space', 'colorSpace', space], ['color-space/lite', 'lite', lite],
		['culori', 'culori', culori], ['colorjs.io', 'colorjs', colorjs], ['@texel/color', 'texel', texel],
		['d3-color', 'd3', d3], ['chroma-js', 'chroma', chroma], ['tinycolor2', 'tinycolor', tinycolor],
		['color', 'color', color], ['color-convert', 'colorConvert', colorConvert],
	]
	const byTest = {}
	for (const test of tests) {
		const results = [];
		for (const [library, key, lib] of LIBS) {
			const fn = test[key]
			if (lib && fn && fn(0) !== null) results.push({ library, ...benchmark(library, fn) })
		}
		byTest[test.name] = results
		printResults(test.name, results);
	}

	// ── the README "Speed" column: geometric mean of M op/s over the 7 shared
	// conversions (rgb ⇄ lab · hsl · oklab, rgb → p3), each library over the subset it
	// implements; color-space over that same subset alongside, for like-for-like
	{
		const SHARED = ['RGB → Lab', 'Lab → RGB', 'RGB → HSL', 'HSL → RGB', 'RGB → Oklab', 'Oklab → RGB', 'RGB → P3']
		const ops = (t, library) => byTest[t]?.find((r) => r.library === library)?.opsPerSec
		const gm = (v) => Math.exp(v.reduce((a, x) => a + Math.log(x), 0) / v.length) / 1e6
		console.log('\nSpeed — geometric mean, M op/s over the shared conversions each library implements:')
		console.log('─'.repeat(80))
		console.log(`${'Library'.padEnd(20)} ${'M op/s'.padStart(8)} ${'of 7'.padStart(6)} ${'color-space on the same'.padStart(26)}`)
		for (const [library] of LIBS) {
			const ts = SHARED.filter((t) => ops(t, library))
			if (!ts.length) continue
			const same = gm(ts.map((t) => ops(t, 'color-space')))
			console.log(`${library.padEnd(20)} ${gm(ts.map((t) => ops(t, library))).toFixed(2).padStart(8)} ${String(ts.length).padStart(6)} ${same.toFixed(2).padStart(26)}`)
		}
	}

	// ── batch: one call over 1M interleaved pixels — the image/video workload.
	// Each library runs its own best idiom: color-space's batch API and WASM kernel,
	// the others a tight per-pixel loop over their scalar face (none ship a batch API).
	{
		const PX = 1e6
		const src = new Float64Array(PX * 3)
		for (let i = 0; i < src.length; i++) src[i] = (i * 2654435761 % 256)
		const wasm = await import('../wasm.js').catch(() => null)
		const rows = []
		const bb = (library, fn, arg = src) => { fn(arg)   // warm + JIT
			const R = 3, t0 = performance.now()
			for (let i = 0; i < R; i++) fn(arg)
			const ms = (performance.now() - t0) / R
			rows.push({ library, opsPerSec: PX / ms * 1000, perOp: ms * 1000 / PX }) }
		bb('color-space (JS)', b => space.rgb.oklab(b))
		// WASM converts its alloc()'d buffer in place, so each call first refills it with
		// the source pixels — otherwise every call after the first would convert Oklab
		// output read as near-black rgb (the linear sRGB segment: no pow), not the image.
		// alloc() takes a PIXEL count: alloc(PX * 3) would hand back 3M px, and the kernel
		// would convert the 1M real pixels plus 2M stale near-black ones on every call
		if (wasm) { const buf = wasm.alloc(PX); bb('color-space (WASM)', b => { b.set(src); wasm.default.rgb.oklab(b) }, buf) }
		if (culori) bb('culori', b => { const c = { mode: 'rgb', r: 0, g: 0, b: 0 }, out = new Float64Array(PX * 3)
			for (let i = 0, k = 0; i < PX; i++, k += 3) { c.r = b[k] / 255; c.g = b[k + 1] / 255; c.b = b[k + 2] / 255
				const o = culori.oklab(c); out[k] = o.l; out[k + 1] = o.a; out[k + 2] = o.b } })
		if (texel) bb('@texel/color', b => { const v = [0, 0, 0], out = new Float64Array(PX * 3)
			for (let i = 0, k = 0; i < PX; i++, k += 3) { v[0] = b[k] / 255; v[1] = b[k + 1] / 255; v[2] = b[k + 2] / 255
				texel.convert(v, texel.sRGB, texel.OKLab, v); out[k] = v[0]; out[k + 1] = v[1]; out[k + 2] = v[2] } })
		printResults('Batch RGB → Oklab (1M px, M px/s)', rows)

		// WASM vs the JS batch API across every WASM-covered target — the README's
		// color-space/wasm range. Same source, same refill-then-convert idiom as above.
		if (wasm) {
			const buf = wasm.alloc(PX), ratios = []
			const ms = (fn) => { fn(); const t0 = performance.now(); for (let i = 0; i < 3; i++) fn(); return (performance.now() - t0) / 3 }
			for (const to of wasm.spaces) {
				if (to === 'rgb' || typeof wasm.default.rgb[to] !== 'function') continue
				ratios.push([to, ms(() => space.rgb[to](src)) / ms(() => { buf.set(src); wasm.default.rgb[to](buf) })])
			}
			ratios.sort((a, b) => a[1] - b[1])
			console.log(`\nWASM speedup over the JS batch API (JS time ÷ WASM time), rgb → each of ${ratios.length} WASM targets, 1M px:`)
			console.log('─'.repeat(80))
			console.log(ratios.map(([to, x]) => `${to} ${x.toFixed(2)}×`).join(' · '))
		}
	}

	console.log('\n' + '='.repeat(80));
	console.log('Benchmark complete!');
	console.log('='.repeat(80));
	console.log('\nNotes:');
	console.log('- color-space uses conventional ranges (RGB: 0-255, HSL H:0-360 S/L:0-100)');
	console.log('- Other libraries may use normalized ranges (0-1) or different conventions');
	console.log('- Compare each row independently; libraries support different subsets')
	console.log('- Choose based on API, correctness, coverage, bundle size, and measured workload')
	console.log('- Unsupported operations are omitted, never timed as no-ops')
}

// Handle errors gracefully
process.on('unhandledRejection', (err) => {
	console.error('Error:', err.message);
	process.exit(1);
});

runBenchmarks().catch(err => {
	console.error('Fatal error:', err);
	process.exit(1);
});
