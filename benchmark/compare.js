/**
 * Benchmark comparison: color-space vs other popular color libraries
 *
 * Measures performance of common color space conversions across libraries.
 */

import space from '../index.js';

// Lazy load competitor libraries to avoid startup overhead
let culori, colorjs, texel, chroma, tinycolor, color, colorConvert;

async function loadLibraries() {
	try {
		const [culoriModule, colorjsModule, texelModule, chromaModule, tinycolorModule, colorModule, colorConvertModule] = await Promise.all([
			import('culori').catch(() => null),
			import('colorjs.io').catch(() => null),
			import('@texel/color').catch(() => null),
			import('chroma-js').catch(() => null),
			import('tinycolor2').catch(() => null),
			import('color').catch(() => null),
			import('color-convert').catch(() => null)
		]);

		culori = culoriModule;
		colorjs = colorjsModule?.default; // Color class is default export
		texel = texelModule;
		chroma = chromaModule?.default;
		tinycolor = tinycolorModule?.default;
		color = colorModule?.default;
		colorConvert = colorConvertModule?.default;

		console.log('Loaded libraries:');
		console.log('  ✓ color-space (this library)');
		if (culori) console.log('  ✓ culori');
		if (colorjs) console.log('  ✓ colorjs.io');
		if (texel) console.log('  ✓ @texel/color');
		if (chroma) console.log('  ✓ chroma-js');
		if (tinycolor) console.log('  ✓ tinycolor2');
		if (color) console.log('  ✓ color');
		if (colorConvert) console.log('  ✓ color-convert');
		console.log('');
	} catch (err) {
		console.error('Error loading libraries:', err.message);
	}
}

// Benchmark utilities
function benchmark(name, fn, iterations = 100000) {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	const end = performance.now();
	const total = end - start;
	const perOp = (total / iterations) * 1000; // microseconds
	return { total, perOp, opsPerSec: 1000 / (total / iterations) };
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
			const result = space.rgb.lab(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			const result = culori.lab({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			const result = c.lab;
		},
		texel: () => {
			// texel doesn't support Lab
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			const result = chroma(128, 64, 192, 'rgb').lab();
		},
		tinycolor: () => {
			// tinycolor doesn't support Lab
			return null;
		},
		color: () => {
			if (!color) return;
			const result = color({ r: 128, g: 64, b: 192 }).lab().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			const result = colorConvert.rgb.lab(128, 64, 192);
		}
	},
	{
		name: 'Lab → RGB',
		colorSpace: () => {
			const result = space.lab.rgb(50, -25, 40);
		},
		culori: () => {
			if (!culori) return;
			const result = culori.rgb({ mode: 'lab', l: 50, a: -25, b: 40 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('lab', [50, -25, 40]);
			const result = c.srgb;
		},
		texel: () => {
			// texel doesn't support Lab
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			const result = chroma.lab(50, -25, 40).rgb();
		},
		tinycolor: () => {
			// tinycolor doesn't support Lab
			return null;
		},
		color: () => {
			if (!color) return;
			const result = color.lab(50, -25, 40).rgb().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			const result = colorConvert.lab.rgb(50, -25, 40);
		}
	},
	{
		name: 'RGB → HSL',
		colorSpace: () => {
			const result = space.rgb.hsl(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			const result = culori.hsl({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			const result = c.hsl;
		},
		texel: () => {
			// texel doesn't have regular HSL, only OKHSL
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			const result = chroma(128, 64, 192, 'rgb').hsl();
		},
		tinycolor: () => {
			if (!tinycolor) return;
			const result = tinycolor({ r: 128, g: 64, b: 192 }).toHsl();
		},
		color: () => {
			if (!color) return;
			const result = color({ r: 128, g: 64, b: 192 }).hsl().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			const result = colorConvert.rgb.hsl(128, 64, 192);
		}
	},
	{
		name: 'HSL → RGB',
		colorSpace: () => {
			const result = space.hsl.rgb(270, 67, 50);
		},
		culori: () => {
			if (!culori) return;
			const result = culori.rgb({ mode: 'hsl', h: 270, s: 0.67, l: 0.5 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('hsl', [270, 67, 50]);
			const result = c.srgb;
		},
		texel: () => {
			// texel doesn't have regular HSL, only OKHSL
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			const result = chroma.hsl(270, 0.67, 0.5).rgb();
		},
		tinycolor: () => {
			if (!tinycolor) return;
			const result = tinycolor({ h: 270, s: 0.67, l: 0.5 }).toRgb();
		},
		color: () => {
			if (!color) return;
			const result = color.hsl(270, 67, 50).rgb().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			const result = colorConvert.hsl.rgb(270, 67, 50);
		}
	},
	{
		name: 'RGB → Oklab',
		colorSpace: () => {
			const result = space.rgb.oklab(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			const result = culori.oklab({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			const result = c.oklab;
		},
		texel: () => {
			// texel has complex API, skipping for simplicity
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			const result = chroma(128, 64, 192, 'rgb').oklab();
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
			const result = space.oklab.rgb(0.6, -0.1, 0.15);
		},
		culori: () => {
			if (!culori) return;
			const result = culori.rgb({ mode: 'oklab', l: 0.6, a: -0.1, b: 0.15 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('oklab', [0.6, -0.1, 0.15]);
			const result = c.srgb;
		},
		texel: () => {
			// texel has complex API, skipping for simplicity
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			const result = chroma.oklab(0.6, -0.1, 0.15).rgb();
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
			const result = space.rgb.p3(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			const result = culori.p3({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			const result = c.p3;
		},
		texel: () => {
			// texel doesn't have P3
			return null;
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
			const result = space.rgb.hsv(128, 64, 192);
		},
		culori: () => {
			if (!culori) return;
			const result = culori.hsv({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			// colorjs doesn't support HSV
			return null;
		},
		texel: () => {
			// texel has complex API, skipping for simplicity
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			const result = chroma(128, 64, 192, 'rgb').hsv();
		},
		tinycolor: () => {
			if (!tinycolor) return;
			const result = tinycolor({ r: 128, g: 64, b: 192 }).toHsv();
		},
		color: () => {
			if (!color) return;
			const result = color({ r: 128, g: 64, b: 192 }).hsv().array();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			const result = colorConvert.rgb.hsv(128, 64, 192);
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
			const result = culori.formatHex({ mode: 'rgb', r: 128/255, g: 64/255, b: 192/255 });
		},
		colorjs: () => {
			if (!colorjs) return;
			const c = new colorjs('srgb', [128/255, 64/255, 192/255]);
			const result = c.toString({ format: 'hex' });
		},
		texel: () => {
			// texel doesn't have hex conversion
			return null;
		},
		chroma: () => {
			if (!chroma) return;
			const result = chroma(128, 64, 192, 'rgb').hex();
		},
		tinycolor: () => {
			if (!tinycolor) return;
			const result = tinycolor({ r: 128, g: 64, b: 192 }).toHexString();
		},
		color: () => {
			if (!color) return;
			const result = color({ r: 128, g: 64, b: 192 }).hex();
		},
		colorConvert: () => {
			if (!colorConvert) return;
			const rgb = [128, 64, 192];
			const result = '#' + colorConvert.rgb.hex(rgb[0], rgb[1], rgb[2]);
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

	console.log('Running benchmarks (100,000 iterations each)...\n');
	console.log('Note: Results vary by hardware and JS engine optimization.');
	console.log('Lower time/op and higher ops/sec is better.\n');

	for (const test of tests) {
		const results = [];

		// Benchmark color-space
		const csResult = benchmark('color-space', test.colorSpace);
		results.push({ library: 'color-space', ...csResult });

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

	console.log('\n' + '='.repeat(80));
	console.log('Benchmark complete!');
	console.log('='.repeat(80));
	console.log('\nNotes:');
	console.log('- color-space uses conventional ranges (RGB: 0-255, HSL H:0-360 S/L:0-100)');
	console.log('- Other libraries may use normalized ranges (0-1) or different conventions');
	console.log('- Performance differences are typically < 2x for most operations');
	console.log('- Choose based on API preference, features needed, and bundle size');
	console.log('- Not all libraries support all color spaces (see null results)');
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
