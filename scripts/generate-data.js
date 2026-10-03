#!/usr/bin/env node
/**
 * Generate data.json — the registry as one language-neutral artifact.
 *
 * Everything a non-JS implementation (or a site generator) needs to reproduce the
 * catalog without transcribing papers: per-space metadata + conventional ranges,
 * the conversion-graph topology (each space's hand-written neighbour edges),
 * gamut primaries, CIE whitepoints, and the cited conformance triples the test
 * suite pins the formulas to. Run: npm run data
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import space from '../index.js'
import gamut from '../gamuts.js'
import whitepoint from '../whitepoints.js'
import { CMF } from '../spaces/wavelength.js'
import { REF } from '../test/refs.js'

// Parse JSDoc from file — the space doc is the block carrying @channel tags
// (falling back to the first block), so helper docs above it can't shadow it.
function parseJSDoc(content) {
  const blocks = content.match(/\/\*\*[\s\S]*?\*\//g)
  if (!blocks) return null

  const jsdoc = blocks.find(b => b.includes('@channel')) || blocks[0]
  const meta = {}

  // Parse @channel lines: @channel {symbol} {min} {max} {name}
  const channelMatches = jsdoc.matchAll(/@channel\s+\{([^}]+)\}\s+(\S+)\s+(\S+)\s+(.+)/g)
  const channels = []
  for (const match of channelMatches) {
    channels.push({
      symbol: match[1],
      min: isNaN(match[2]) ? match[2] : parseFloat(match[2]),
      max: isNaN(match[3]) ? match[3] : parseFloat(match[3]),
      name: match[4].trim()
    })
  }
  if (channels.length) {
    meta.channels = channels
    // range is the per-channel [min, max] (numeric channels only)
    if (channels.every(c => typeof c.min === 'number' && typeof c.max === 'number'))
      meta.range = channels.map(c => [c.min, c.max])
  }

  // Parse @see reference links: @see {@link URL} or @see URL
  const refs = [...jsdoc.matchAll(/@see\s+(?:\{@link\s+)?(https?:\/\/[^\s}]+)\}?/g)].map(m => m[1])
  if (refs.length) meta.refs = refs

  // Parse @wiki — the canonical Wikipedia article, when one exists
  const wikiMatch = jsdoc.match(/@wiki\s+(?:\{@link\s+)?(https?:\/\/[^\s}]+)\}?/)
  if (wikiMatch) meta.wiki = wikiMatch[1]

  // Parse provenance: @year (introduced), @by (who), @use (domain + current status)
  const yearMatch = jsdoc.match(/@year\s+(\d{4})/)
  if (yearMatch) meta.year = +yearMatch[1]
  const byMatch = jsdoc.match(/@by\s+(.+)/)
  if (byMatch) meta.by = byMatch[1].trim()
  const useMatch = jsdoc.match(/@use\s+(.+)/)
  if (useMatch) meta.use = useMatch[1].trim()

  // Parse illuminant
  const illuminantMatch = jsdoc.match(/@illuminant\s+(\S+)/)
  if (illuminantMatch) meta.illuminant = illuminantMatch[1]

  // Parse observer
  const observerMatch = jsdoc.match(/@observer\s+(\S+)/)
  if (observerMatch) meta.observer = observerMatch[1]

  // Parse transform character: @method (how it's computed), @encoding (value domain)
  const methodMatch = jsdoc.match(/@method\s+(\S+)/)
  if (methodMatch) meta.method = methodMatch[1]
  const encodingMatch = jsdoc.match(/@encoding\s+(\S+)/)
  if (encodingMatch) meta.encoding = encodingMatch[1]

  // Parse @gamut — the RGB gamut name; resolve its primaries + white from gamuts.js
  const gamutMatch = jsdoc.match(/@gamut\s+(\S+)/)
  if (gamutMatch) {
    meta.gamut = gamutMatch[1]
    const g = gamut[gamutMatch[1]]
    if (g) { meta.primaries = g.primaries; if (g.white) meta.white = g.white }
  }

  // Parse @loss — machine-readable loss semantics for inherently non-invertible
  // nodes: projective (drops a dimension / projects to a locus), quantized
  // (integral code values), lookup (table interpolation + iterative inverse).
  // Absent = the conversion pair is exact/invertible in real arithmetic.
  const lossMatch = jsdoc.match(/@loss\s+(\S+)(?:\s+(.+))?/)
  if (lossMatch) { meta.loss = lossMatch[1]; if (lossMatch[2]) meta.lossNote = lossMatch[2].trim() }

  // Parse gamut/encoding class: @referred display|scene, @dynamic sdr|hdr
  const referredMatch = jsdoc.match(/@referred\s+(\S+)/)
  if (referredMatch) meta.referred = referredMatch[1]
  const dynamicMatch = jsdoc.match(/@dynamic\s+(\S+)/)
  if (dynamicMatch) meta.dynamic = dynamicMatch[1]

  // Parse description
  const descMatch = jsdoc.match(/\*\s+([^@]+?)(?=\n\s+\*\s+@|\*\/)/s)
  if (descMatch) {
    const desc = descMatch[1]
      .split('\n')
      .map(l => l.replace(/^\s*\*\s?/, '').trim())
      .filter(Boolean)
      .join(' ')
    if (desc) meta.description = desc
  }

  return Object.keys(meta).length ? meta : null
}


// Display name (spaces[id].title) — the one source the site (render.js disp) and the MCP server
// read. Led by each space's own description ("Name — …", ≤ 40 chars), so OKLCh families, Y′CbCr
// variants and vendor logs read as their real names everywhere; TITLE pins the spaces whose
// description opens otherwise or whose ascii id must not be blindly uppercased (Okhsl, YDbDr,
// proLab, lαβ, …); the uppercased id is the last resort.
const TITLE = {
	lab: 'CIELAB', lchab: 'CIELChab', luv: 'CIELUV', lchuv: 'CIELChuv', 'lab-d65': 'CIELAB D65', 'lch-d65': 'CIELCh D65',
	labh: 'Hunter Lab', hsluv: 'HSLuv', hpluv: 'HPLuv', anlab: 'Adams–Nickerson Lab',
	ucs: 'CIE 1960 UCS', uvw: 'CIE 1964 UVW', 'xyz-d50': 'CIE XYZ (D50)',
	oklab: 'OKLab', oklch: 'OKLCH', okhsl: 'Okhsl', okhsv: 'Okhsv', okhwb: 'Okhwb', oklrab: 'OKLrAB', oklrch: 'OKLrCH',
	prolab: 'proLab', sucs: 'sUCS', igpgtg: 'IgPgTg', hellwig2022: 'Hellwig 2022', srlab2: 'SRLAB2',
	'ral-design': 'RAL Design', munsell: 'Munsell', ohta: 'Ohta I₁I₂I₃', osaucs: 'OSA-UCS',
	'din99o-lab': 'DIN99o Lab', 'din99o-lch': 'DIN99o LCh', din99d: 'DIN99d',
	photoycc: 'PhotoYCC', ycbcr: 'YCbCr', ydbdr: 'YDbDr', ycgco: 'YCgCo', ypbpr: 'YPbPr',
	xvycc: 'xvYCC', yccbccrc: 'YcCbcCrc', jpeg: 'JPEG YCbCr', 'ycbcr-bt2020': 'BT.2020 Y′CbCr',
	'ycbcr-bt601-525': 'BT.601 525-line Y′CbCr', 'ycbcr-bt601-625': 'BT.601 625-line Y′CbCr',
	macboyn: 'MacLeod–Boynton', lalphabeta: 'lαβ' }
const titleOf = (id, description = '') => TITLE[id] || (m => m && m[1].length <= 40 ? m[1] : id.toUpperCase())(description.match(/^(.+?) — /))

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

const names = Object.keys(space)
const spaces = {}
for (const name of names) {
	const src = fs.readFileSync(path.join(root, 'spaces', name + '.js'), 'utf8')
	// direct (hand-written) edges only — the hub flags compositions with .chained
	// on the raw scalar, reachable via .scalar on the batch face
	const neighbors = names.filter((to) => {
		if (to === name) return false
		const f = space[name][to]
		return typeof f === 'function' && !(f.scalar || f).chained
	})
	const doc = parseJSDoc(src)
	spaces[name] = { title: titleOf(name, doc?.description), ...doc, neighbors }
}

const data = {
	name: 'color-space',
	version,
	count: names.length,
	spaces,
	gamuts: gamut,
	whitepoints: whitepoint,
	// CIE 1931 2° color-matching functions, 380–700 nm at 5 nm, standard ȳ(555)=1
	// normalization — the table wavelength.js/dsh.js/ostwald.js compute from;
	// rows are [nm, x̄, ȳ, z̄]
	cmf: { observer: 2, unit: 'nm', rows: CMF },
	// cited input→output conversions the suite asserts (test/refs.js) — the
	// conformance set a port can pin itself to
	conformance: REF,
}

fs.writeFileSync(path.join(root, 'data.json'), JSON.stringify(data, null, 1) + '\n')
console.log(`data.json: ${names.length} spaces, ${Object.keys(gamut).length} gamuts, ${REF.length} conformance points · v${version}`)
