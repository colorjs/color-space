/**
 * Benchmark comparison: color-space vs other popular color libraries
 *
 * Measures performance of common color space conversions across libraries.
 */

import space from '../index.js';

// Lazy load competitor libraries to avoid startup overhead
let culori, colorjs, texel, chroma, tinycolor, color, colorConvert, d3;
const texelOut = [0, 0, 0]; // texel's idiom: convert(coords, from, to, out) — reused scratch

async function loadLibraries() {
	try {
		const [culoriModule, colorjsModule, texelModule, d3Module, chromaModule, tinycolorModule, colorModule, colorConvertModule] = await Promise.all([
			import('culori').catch(() => null),
			import('colorjs.io').catch(() => null),
			import('@texel/color').catch(() => null),
			import('d3-color').catch(() => null),
			import('chroma-js').catch(() => null),
			import('tinycolor2').catch(() => null),
			import('color').catch(() => null),
			import('color-convert').catch(() => null)
		]);

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
	for (let i = 0; i < Math.min(iterations, 20000); i++) sink = fn()
	const samples = []
	for (let round = 0; round < rounds; round++) {
		const start = performance.now()
		for (let i = 0; i < iterations; i++) sink = fn()
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

// Test cases
const tests = [
	{
		name: 'RGB → Lab',
		colorSpace: () => {
			return space.rgb.lab(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			return culori.lab({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			return c.lab;
		},
		texel: () => {
			// texel doesn't support Lab
			return null;
		},
		d3: () => {
			if (!d3) return;
			const result = d3.lab(d3.rgb(128, 64, 192));
		},
		chroma: () => {
			if (!chroma) return;
			return chroma(128, 64, 192, 'rgb').lab();
		},
		tinycolor: () => {
			// tinycolor doesn't support Lab
			return null;
		},
		color: () => {
			if (!color) return;
			return color({ r: 128, g: 64, b: 192 }).lab().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			return colorConvert.rgb.lab(128, 64, 192);
		}
	},
	{
		name: 'Lab → RGB',
		colorSpace: () => {
			return space.lab.rgb(50, -25, 40);
		},
		culori: () => {
			if (!culori) return;
			return culori.rgb({ mode: 'lab', l: 50, a: -25, b: 40 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('lab', [50, -25, 40]);
			return c.srgb;
		},
		texel: () => {
			// texel doesn't support Lab
			return null;
		},
		d3: () => {
			if (!d3) return;
			const result = d3.rgb(d3.lab(50, -25, 40));
		},
		chroma: () => {
			if (!chroma) return;
			return chroma.lab(50, -25, 40).rgb();
		},
		tinycolor: () => {
			// tinycolor doesn't support Lab
			return null;
		},
		color: () => {
			if (!color) return;
			return color.lab(50, -25, 40).rgb().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			return colorConvert.lab.rgb(50, -25, 40);
		}
	},
	{
		name: 'RGB → HSL',
		colorSpace: () => {
			return space.rgb.hsl(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			return culori.hsl({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			return c.hsl;
		},
		texel: () => {
			// texel doesn't have regular HSL, only OKHSL
			return null;
		},
		d3: () => {
			if (!d3) return;
			const result = d3.hsl(d3.rgb(128, 64, 192));
		},
		chroma: () => {
			if (!chroma) return;
			return chroma(128, 64, 192, 'rgb').hsl();
		},
		tinycolor: () => {
			if (!tinycolor) return;
			return tinycolor({ r: 128, g: 64, b: 192 }).toHsl();
		},
		color: () => {
			if (!color) return;
			return color({ r: 128, g: 64, b: 192 }).hsl().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			return colorConvert.rgb.hsl(128, 64, 192);
		}
	},
	{
		name: 'HSL → RGB',
		colorSpace: () => {
			return space.hsl.rgb(270, 67, 50);
		},
		culori: () => {
			if (!culori) return;
			return culori.rgb({ mode: 'hsl', h: 270, s: 0.67, l: 0.5 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('hsl', [270, 67, 50]);
			return c.srgb;
		},
		texel: () => {
			// texel doesn't have regular HSL, only OKHSL
			return null;
		},
		d3: () => {
			if (!d3) return;
			const result = d3.rgb(d3.hsl(270, 0.67, 0.5));
		},
		chroma: () => {
			if (!chroma) return;
			return chroma.hsl(270, 0.67, 0.5).rgb();
		},
		tinycolor: () => {
			if (!tinycolor) return;
			return tinycolor({ h: 270, s: 0.67, l: 0.5 }).toRgb();
		},
		color: () => {
			if (!color) return;
			return color.hsl(270, 67, 50).rgb().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			return colorConvert.hsl.rgb(270, 67, 50);
		}
	},
	{
		name: 'RGB → Oklab',
		colorSpace: () => {
			return space.rgb.oklab(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			return culori.oklab({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			return c.oklab;
		},
		texel: () => {
			if (!texel) return;
			return texel.convert([128/255, 64/255, 192/255], texel.sRGB, texel.OKLab, texelOut);
		},
		chroma: () => {
			if (!chroma) return;
			return chroma(128, 64, 192, 'rgb').oklab();
		},
		tinycolor: () => {
			// tinycolor doesn't support Oklab
			return null;
		},
		color: () => {
			// color doesn't support Oklab
			return null;
		},
		colorConvert: () => {
			// color-convert doesn't support Oklab
			return null;
		}
	},
	{
		name: 'Oklab → RGB',
		colorSpace: () => {
			return space.oklab.rgb(0.6, -0.1, 0.15);
		},
		culori: () => {
			if (!culori) return;
			return culori.rgb({ mode: 'oklab', l: 0.6, a: -0.1, b: 0.15 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('oklab', [0.6, -0.1, 0.15]);
			return c.srgb;
		},
		texel: () => {
			if (!texel) return;
			return texel.convert([0.6, -0.1, 0.15], texel.OKLab, texel.sRGB, texelOut);
		},
		chroma: () => {
			if (!chroma) return;
			return chroma.oklab(0.6, -0.1, 0.15).rgb();
		},
		tinycolor: () => {
			// tinycolor doesn't support Oklab
			return null;
		},
		color: () => {
			// color doesn't support Oklab
			return null;
		},
		colorConvert: () => {
			// color-convert doesn't support Oklab
			return null;
		}
	},
	{
		name: 'RGB → P3',
		colorSpace: () => {
			return space.rgb.p3(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			return culori.p3({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			return c.p3;
		},
		texel: () => {
			if (!texel) return;
			return texel.convert([128/255, 64/255, 192/255], texel.sRGB, texel.DisplayP3, texelOut);
		},
		chroma: () => {
			// chroma doesn't have P3
			return null;
		},
		tinycolor: () => {
			// tinycolor doesn't have P3
			return null;
		},
		color: () => {
			// color doesn't have P3
			return null;
		},
		colorConvert: () => {
			// color-convert doesn't have P3
			return null;
		}
	},
	{
		name: 'RGB → HSV',
		colorSpace: () => {
			return space.rgb.hsv(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			return culori.hsv({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			// colorjs doesn't support HSV
			return null;
		},
		texel: () => {
			// texel has OKHSV, not classic HSV
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			return chroma(128, 64, 192, 'rgb').hsv();
		},
		tinycolor: () => {
			if (!tinycolor) return;
			return tinycolor({ r: 128, g: 64, b: 192 }).toHsv();
		},
		color: () => {
			if (!color) return;
			return color({ r: 128, g: 64, b: 192 }).hsv().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			return colorConvert.rgb.hsv(128, 64, 192);
		}
	},
	{
		name: 'RGB → HEX',
		colorSpace: () => {
			// color-space doesn't have dedicated hex space, skip
			return null;
		},
		culori: () => {
			if (!culori) return;
			return culori.formatHex({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			return c.toString({ format: 'hex' });
		},
		texel: () => {
			if (!texel) return;
			return texel.RGBToHex([128/255, 64/255, 192/255]);
		},
		d3: () => {
			if (!d3) return;
			const result = d3.rgb(128, 64, 192).formatHex();
		},
		chroma: () => {
			if (!chroma) return;
			return chroma(128, 64, 192, 'rgb').hex();
		},
		tinycolor: () => {
			if (!tinycolor) return;
			return tinycolor({ r: 128, g: 64, b: 192 }).toHexString();
		},
		color: () => {
			if (!color) return;
			return color({ r: 128, g: 64, b: 192 }).hex();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			const rgb = [128, 64, 192];
			return '#' + colorConvert.rgb.hex(rgb[0], rgb[1], rgb[2]);
		}
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

	console.log('Running benchmarks (20,000 warmup calls + median of 7 × 100,000 iterations)...\n');
	console.log('Note: Results vary by hardware and JS engine optimization; unsupported operations are omitted.');
	console.log('Lower time/op and higher ops/sec is better.\n');

	for (const test of tests) {
		const results = [];

		// Benchmark only implemented operations — RGB→HEX deliberately returns
		// null because this package is a conversion kernel, not a formatter.
		if (test.colorSpace && test.colorSpace() !== null) {
			const csResult = benchmark('color-space', test.colorSpace)
			results.push({ library: 'color-space', ...csResult })
		}

		// Benchmark culori
		if (culori && test.culori) {
			const culoriResult = benchmark('culori', test.culori);
			results.push({ library: 'culori', ...culoriResult });
		}

		// Benchmark colorjs.io
		if (colorjs && test.colorjs && test.colorjs() !== null) {
			const colorjsResult = benchmark('colorjs.io', test.colorjs);
			results.push({ library: 'colorjs.io', ...colorjsResult });
		}

		// Benchmark @texel/color
		if (texel && test.texel && test.texel() !== null) {
			const texelResult = benchmark('@texel/color', test.texel);
			results.push({ library: '@texel/color', ...texelResult });
		}

		// Benchmark d3-color
		if (d3 && test.d3 && test.d3() !== null) {
			const d3Result = benchmark('d3-color', test.d3);
			results.push({ library: 'd3-color', ...d3Result });
		}

		// Benchmark chroma-js
		if (chroma && test.chroma && test.chroma() !== null) {
			const chromaResult = benchmark('chroma-js', test.chroma);
			results.push({ library: 'chroma-js', ...chromaResult });
		}

		// Benchmark tinycolor2
		if (tinycolor && test.tinycolor && test.tinycolor() !== null) {
			const tinycolorResult = benchmark('tinycolor2', test.tinycolor);
			results.push({ library: 'tinycolor2', ...tinycolorResult });
		}

		// Benchmark color
		if (color && test.color && test.color() !== null) {
			const colorResult = benchmark('color', test.color);
			results.push({ library: 'color', ...colorResult });
		}

		// Benchmark color-convert
		if (colorConvert && test.colorConvert && test.colorConvert() !== null) {
			const colorConvertResult = benchmark('color-convert', test.colorConvert);
			results.push({ library: 'color-convert', ...colorConvertResult });
		}

		printResults(test.name, results);
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
		if (wasm) { const buf = wasm.alloc(PX * 3); buf.set(src); bb('color-space (WASM)', b => wasm.default.rgb.oklab(b), buf) }
		if (culori) bb('culori', b => { const c = { mode: 'rgb', r: 0, g: 0, b: 0 }, out = new Float64Array(PX * 3)
			for (let i = 0, k = 0; i < PX; i++, k += 3) { c.r = b[k] / 255; c.g = b[k + 1] / 255; c.b = b[k + 2] / 255
				const o = culori.oklab(c); out[k] = o.l; out[k + 1] = o.a; out[k + 2] = o.b } })
		if (texel) bb('@texel/color', b => { const v = [0, 0, 0], out = new Float64Array(PX * 3)
			for (let i = 0, k = 0; i < PX; i++, k += 3) { v[0] = b[k] / 255; v[1] = b[k + 1] / 255; v[2] = b[k + 2] / 255
				texel.convert(v, texel.sRGB, texel.OKLab, v); out[k] = v[0]; out[k + 1] = v[1]; out[k + 2] = v[2] } })
		printResults('Batch RGB → Oklab (1M px, M px/s)', rows)
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
