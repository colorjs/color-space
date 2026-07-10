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
	spaces[name] = { ...parseJSDoc(src), neighbors }
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
