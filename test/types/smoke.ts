import space, { register, type SpaceName, type ColorSpace } from 'color-space'
import lite, { type LiteSpaceName } from 'color-space/lite'
import oklch from 'color-space/oklch.js'
import cam16 from 'color-space/cam16'
import wasm, { alloc, convertBatch } from 'color-space/wasm'
import wasmSpaces from 'color-space/wasm/spaces'
import chunk from 'color-space/gl/oklch'
import { glsl as leanGlsl, wgsl as leanWgsl } from 'color-space/gl'
import allGlsl, { chunks, graph, luts, spaces as glSpaces } from 'color-space/gl/all'
import fullWgsl, { translate } from 'color-space/gl/wgsl'
import { table, verify, cube } from 'color-space/lut'
import { clut, colorants, kind, profile } from 'color-space/icc'
import gamut, { gamut as namedGamut } from 'color-space/gamuts.js'
import whitepoint, { whitepoint as namedWhitepoint } from 'color-space/whitepoints.js'
import { cartToPolar, inv3, mat3, polarToCart, spow } from 'color-space/util.js'
import { linearToSrgb, srgbToLinear } from 'color-space/transfers.js'
import { labF, labFInv, ε, ε3, κ } from 'color-space/cie.js'
import { createHub, registerSpace, validate, wire } from 'color-space/hub.js'
import { handle, type McpMessage } from 'color-space/mcp.js'

const name: SpaceName = 'oklch'
const liteName: LiteSpaceName = 'rgb'
const scalar: number[] = space.rgb.oklch(255, 128, 0)
const batch: Float64Array = space.rgb.oklch(new Uint8Array([255, 128, 0]))
const direct: number[] = oklch.rgb(0.72, 0.16, 41)
const cam: number[] = cam16.xyz(50, 20, 30)
// @ts-expect-error direct imports expose only methods they actually ship
cam16.rgb(50, 20, 30)
// @ts-expect-error built-in ids are exact
space.rbg
// @ts-expect-error fixed source arity catches a missing channel
space.rgb.oklch(255, 0)

const custom = {
	name: 'unit-rgb',
	range: [[0, 1], [0, 1], [0, 1]],
	rgb: (r: number, g: number, b: number) => [r * 255, g * 255, b * 255],
} as const satisfies ColorSpace<'unit-rgb'>
const extended = register(custom, { rgb: (r, g, b) => [r / 255, g / 255, b / 255] })
const customOut: number[] = extended['unit-rgb'].oklch(1, 0.5, 0)

const wb: Float64Array = alloc(1)
const ws: number[] = wasm.rgb.oklch(255, 0, 0)
const wbatch: Float64Array = wasm.rgb.oklch([255, 0, 0])
const copied: Float64Array = convertBatch('rgb', 'oklch', [255, 0, 0])
// @ts-expect-error wasm scalar calls always require three channels
wasm.rgb.oklch(255, 0)

const lean: string = leanGlsl(chunk, 'rgb')
const leanW: string = leanWgsl(chunk)
const full: string = allGlsl('rgb', 'oklch')
const fullW: string = fullWgsl('rgb', 'oklch')
const translated: string = translate(lean)
const chunkName: string = chunk.name

const tab = table(space.rgb, space.oklch, { size: 17 })
const stats = verify(tab, 10)
const cubeText: string = cube(space.rgb, space.oklch, { verify: false })
const profileBytes: Uint8Array = profile(space.oklch, { xyz: space.xyz, grid: 17 })
const profileKind: 'mntr' | 'spac' | 'scnr' | null = kind(space.oklch, { xyz: space.xyz })
const lut = clut(space.oklch, { xyz: space.xyz, grid: 9 })
const cols = colorants(space.p3)

const msg: McpMessage = { jsonrpc: '2.0', id: 1, method: 'ping' }
if (false) handle(msg)
const hub = createHub([oklch])
if (false) {
	validate(hub, custom)
	registerSpace(hub, custom, { rgb: custom.rgb })
	wire(hub)
}

console.log(
	name, liteName, scalar, batch, direct, cam, customOut,
	lite.rgb.oklch(255, 0, 0), wb, ws, wbatch, copied, wasmSpaces,
	lean, leanW, full, fullW, translated, chunkName, chunks, graph, luts, glSpaces,
	tab, stats, cubeText, profileBytes, profileKind, lut, cols,
	gamut, namedGamut, whitepoint, namedWhitepoint,
	mat3([1, 0, 0, 0, 1, 0, 0, 0, 1], 1, 2, 3), inv3([1, 0, 0, 0, 1, 0, 0, 0, 1]),
	spow(-2, 3), cartToPolar(1, 2, 3), polarToCart(1, 2, 30),
	srgbToLinear(0.5), linearToSrgb(0.5), labF(0.5), labFInv(0.5), ε, ε3, κ,
)
