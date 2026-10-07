import test, { is } from 'tst'
import { quantRGB } from '../web/js/quant.js'
import NAMES from '../web/js/names.js'
import * as palettes from '../web/js/palettes.js'

test('quantization: smooth and native-coordinate modes preserve their input', () => {
	const rgb = [4.49, 127.25, 254.8]
	for (const mode of [undefined, null, 0, 10, 20, 'smooth', 'unknown'])
		is(quantRGB(rgb, mode), rgb, `${mode}: no output-palette quantization`)
	is(rgb, [4.49, 127.25, 254.8], 'input remains unchanged')
})

test('quantization: RGB565 and web-safe byte boundaries', () => {
	for (const [rgb, mode, expected] of [
		[[0,0,0], '565', [0,0,0]], [[255,255,255], '565', [255,255,255]],
		[[4.49,2.49,4.49], '565', [0,0,0]], [[4.5,2.5,4.5], '565', [8,4,8]],
		[[128,128,128], '565', [132,130,132]],
		[[25.49,127.49,229.49], 'web', [0,102,204]],
		[[25.5,127.5,229.5], 'web', [51,153,255]],
		[[-20,300,128], '565', [0,255,132]], [[-20,300,128], 'web', [0,255,153]],
	]) is(quantRGB(rgb,mode), expected, `${mode}: ${rgb}`)
})

test('quantization: JND output stays byte-bounded and neutral', () => {
	for (const gray of [0, .49, 127, 127.49, 255]) {
		const got = quantRGB([gray,gray,gray], 'jnd')
		is(got.every(v => Number.isInteger(v) && v >= 0 && v <= 255), true, `${gray}: finite byte output`)
		is(Math.max(...got) - Math.min(...got) <= 1, true, `${gray}: no invented chroma`)
		is(got, quantRGB([Math.round(gray),Math.round(gray),Math.round(gray)], 'jnd'), 'sub-byte input shares the GPU byte coordinate')
	}
	for (const rgb of [[255,0,0],[0,255,0],[0,0,255],[-20,300,128]])
		is(quantRGB(rgb,'jnd').every(v => Number.isInteger(v) && v >= 0 && v <= 255), true, `${rgb}: clamped gamut boundary`)
})

test('quantization: palette cache is independent of call order and mode', () => {
	// This fractional color used to choose orange and poison the byte-keyed cache;
	// the GPU's [245,105,22] coordinate selects PICO-8 red [255,0,77].
	const a = [245.49,105.49,22.49], b = [245,105,22], expected = [255,0,77]
	is(quantRGB(a,'pico8'), expected, 'fractional A uses canonical byte distance')
	is(quantRGB(a,'pico8'), expected, 'A → A')
	is(quantRGB(b,'pico8'), expected, 'A → same-byte B')
	is(quantRGB([0,0,0],'pico8'), [0,0,0], 'A → different color B')
	is(quantRGB(a,'pico8'), expected, 'different B → A')
	is(quantRGB([255,0,0],'names'), [255,0,0], 'CSS palette has exact red')
	is(quantRGB([255,0,0],'pico8'), [255,0,77], 'different palette cannot reuse CSS red')
	is(quantRGB([255,0,0],'names'), [255,0,0], 'returning to CSS palette restores its red')
	for (const mode of ['names','xkcd','tailwind','pico8','ansi']) {
		const entries = mode === 'names' ? Object.entries(NAMES) : palettes[mode]
		const [,rgb] = entries[Math.floor(entries.length/2)]
		is(quantRGB(rgb,mode), rgb, `${mode}: exact palette site is a fixed point`)
		const result = quantRGB([246,125,79],mode)
		is(entries.some(([,v])=>v.every((x,i)=>x===result[i])), true, `${mode}: result belongs to the palette`)
	}
})
