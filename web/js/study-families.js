// Seven-family cut shared with the alt study. HDR remains a facet.
import { sections } from './render.js'

const LIN_RENAME = { 'Cylindrical':'RGB remixes', 'Print & physical':'Color order & surface', 'Specialty & research':'Specialty' }
const LIN_MOVE = { ictcp:'Video & broadcast', 'rec2100-pq':'Video & broadcast', 'rec2100-hlg':'Video & broadcast',
	'rec2100-linear':'Video & broadcast', icacb:'Video & broadcast',
	jzazbz:'Perceptual – modern', jzczhz:'Perceptual – modern', izazbz:'Perceptual – modern',
	ipt:'Perceptual – modern', 'hdr-ipt':'Perceptual – modern', 'hdr-cie-lab':'Perceptual – CIE classic' }
const LIN_MERGE = { 'Perceptual – modern':'Perceptual', 'Perceptual – CIE classic':'Perceptual', 'Appearance models':'Perceptual',
	'Colorimetry & vision':'Colorimetry & research', 'Specialty':'Colorimetry & research', 'more':'Colorimetry & research' }
const MTIPS = { 'Perceptual':'Spaces built so equal steps look equal – the CIE uniform track, its industrial refinements, the OK generation, and full appearance models.',
	'Colorimetry & research':'The measurement layer and single-purpose research coordinates – standard observers, physiological spaces, imaging-research systems.' }
const LINEAGE = (() => {
	const pre = sections.filter(c => c.name !== 'HDR & wide gamut').map(c => ({ name: LIN_RENAME[c.name] || c.name, tip: c.tip, spaces: [...c.spaces] }))
	const byName = new Map(pre.map(c => [c.name, c]))
	for (const s of sections.find(c => c.name === 'HDR & wide gamut')?.spaces || [])
		(byName.get(LIN_MOVE[s]) || byName.get('Specialty') || pre.at(-1)).spaces.push(s)
	const out = [], seen = new Map()
	for (const c of pre) { const name = LIN_MERGE[c.name] || c.name
		if (seen.has(name)) seen.get(name).spaces.push(...c.spaces)
		else { const g = { name, tip: MTIPS[name] || c.tip, spaces: [...c.spaces] }; seen.set(name, g); out.push(g) } }
	return out
})()

const TIPS = {
	'Display & web':'Working and delivery RGB spaces, from the web default to wider display gamuts.',
	'RGB remixes':'Hue, saturation and brightness controls built on RGB. Equal steps need not look equal.',
	'Perceptual':'Coordinates for comparing colors, building palettes and predicting appearance.',
	'Colorimetry & research':'The measurement foundations, the eye, and specialized research coordinates.',
	'Video & broadcast':'Separate brightness from color for broadcast, compression and HDR delivery.',
	'Film & camera':'Camera log encodings and working spaces for capturing and grading light.',
	'Color order & surface':'Ink, paint and the measured organization of surface colors.'
}
export default LINEAGE.map(g => ({...g, tip:TIPS[g.name] || g.tip}))
