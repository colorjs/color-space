#!/usr/bin/env node
/**
 * Generate meta.js from JSDoc comments in color space files
 * Parses @channel, @illuminant, @observer, @referred, @dynamic tags
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

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

// Extract space name from file
function getSpaceName(filename) {
  return filename.replace(/\.js$/, '')
}

// Generate meta.js
function generateMeta() {
  const files = fs.readdirSync(rootDir)
    .filter(f => f.endsWith('.js') && !f.startsWith('.'))
    .filter(f => !['index.js', 'package.json', 'util.js', 'transfers.js', 'whitepoints.js', 'cie.js', 'wasm.js', 'meta.js'].includes(f))

  const meta = {}

  for (const file of files) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8')
    const parsed = parseJSDoc(content)

    if (parsed) {
      const spaceName = getSpaceName(file)
      meta[spaceName] = parsed
    }
  }

  return meta
}

// Output
const meta = generateMeta()
const output = `// Generated from JSDoc comments
// Run: node scripts/generate-meta.js > meta.js

export default ${JSON.stringify(meta, null, 2)}`

console.log(output)
