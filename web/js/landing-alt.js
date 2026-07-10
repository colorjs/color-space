import { space, meta, spaceCount, clamp, hex, toSpace, classify } from './core.js'
import { sections, cname } from './render.js'
import LORE from './lore.js'

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const formatInteger = new Intl.NumberFormat(document.documentElement.lang || 'en')
const allSpaces = sections.flatMap(section => section.spaces)
const featured = ['rgb', 'oklch', 'lab', 'p3', 'cam16', 'slog3'].filter(name => allSpaces.includes(name))

const countEls = document.querySelectorAll('.space-count')
countEls.forEach(el => { el.textContent = formatInteger.format(spaceCount) })
const routeCount = spaceCount * (spaceCount - 1)
document.getElementById('route-count').textContent = `${formatInteger.format(routeCount)} ordered pairs`

document.title = `color-space field guide — ${spaceCount} color spaces, one verified API`

const heroCount = document.getElementById('hero-count')
heroCount.dataset.target = String(spaceCount)
if (reducedMotion) heroCount.textContent = String(spaceCount)
else {
	const started = performance.now()
	const duration = 760
	heroCount.classList.add('is-counting')
	const tick = now => {
		const t = clamp((now - started) / duration, 0, 1)
		const eased = 1 - Math.pow(1 - t, 4)
		heroCount.textContent = String(Math.round(spaceCount * eased))
		if (t < 1) requestAnimationFrame(tick)
		else heroCount.textContent = String(spaceCount)
	}
	requestAnimationFrame(tick)
}

const field = document.getElementById('color-field')
const fieldMarker = document.getElementById('field-marker')
const colorEntry = document.getElementById('color-entry')
const nativeColor = document.getElementById('native-color')
const helper = document.getElementById('color-helper')
const colorStatus = document.getElementById('color-status')
const conversionList = document.getElementById('conversion-list')
const translationContext = document.getElementById('translation-context')
const translationCount = document.getElementById('translation-count')
const spaceName = document.getElementById('space-name')
const spaceClass = document.getElementById('space-class')
const spaceDescription = document.getElementById('space-description')
const spaceFacts = document.getElementById('space-facts')
const taxonomyList = document.getElementById('taxonomy-list')

const FIELD = { minL: .32, maxL: .92, chroma: .16 }
const DEFAULT_HELP = 'The field holds chroma at 0.16; arrow keys move hue and lightness.'
let state = { source:'oklch', vals:[.72,.16,41], rgb:space.oklch.rgb(.72,.16,41).map(value => clamp(value,0,255)), L:.72, C:.16, H:41 }
let selectedSpace = 'oklch'
let shownSpaces = featured.slice()
let activeCategory = sections.findIndex(section => section.spaces.includes(selectedSpace))
let inputTouched = false
let pointerId = null
let renderFrame = 0

const cleanHue = value => ((value % 360) + 360) % 360
const hexToRgb = value => [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16))
const toHex = rgb => hex(rgb.map(value => clamp(value, 0, 255)))
const percentSpaces = new Set(['hsl','hsv','hwb','hsi','hcg','hcy','hsp','hsm','cmy','cmyk','hsluv','hpluv','okhsl','okhsv','okhwb'])
const unitFor = (name,channel) => channel.max === 360 ? '°' : percentSpaces.has(name) && channel.min === 0 && channel.max === 100 ? '%' : ''
const decimalsFor = channel => channel.max <= 1 ? 3 : channel.max === 360 || channel.max === 255 ? 0 : 1
const formatChannel = (name,value,channel) => {
	const rounded = Number(value).toFixed(decimalsFor(channel))
	return `${channel.symbol} ${rounded}${unitFor(name,channel)}`
}
const formatCoordinate = (name,values) => {
	if (!values) return 'outside this transform’s domain'
	const channels = meta[name]?.channels || []
	return values.map((value,index) => formatChannel(name,value,channels[index])).join(' · ')
}
const categoryFor = name => sections.find(section => section.spaces.includes(name))
const shortDescription = value => {
	if (!value) return 'This entry has channel ranges and source references, but no concise description is recorded yet.'
	const sentences = value.split(/(?<=[.!?])\s+(?=[A-ZΔ])/).filter(Boolean)
	return sentences.slice(0, 2).join(' ')
}

function drawField() {
	const ctx = field.getContext('2d', { alpha: false })
	const { width, height } = field
	const image = ctx.createImageData(width, height)
	for (let y = 0; y < height; y++) {
		const L = FIELD.maxL - (FIELD.maxL - FIELD.minL) * y / (height - 1)
		for (let x = 0; x < width; x++) {
			const H = 360 * x / (width - 1)
			let rgb
			try { rgb = space.oklch.rgb(L, FIELD.chroma, H) }
			catch { rgb = [0, 0, 0] }
			const offset = (y * width + x) * 4
			image.data[offset] = clamp(Math.round(rgb[0]), 0, 255)
			image.data[offset + 1] = clamp(Math.round(rgb[1]), 0, 255)
			image.data[offset + 2] = clamp(Math.round(rgb[2]), 0, 255)
			image.data[offset + 3] = 255
		}
	}
	ctx.putImageData(image, 0, 0)
}

function updateMarker() {
	const left = cleanHue(state.H) / 360 * 100
	const top = (FIELD.maxL - clamp(state.L, FIELD.minL, FIELD.maxL)) / (FIELD.maxL - FIELD.minL) * 100
	fieldMarker.style.insetInlineStart = `${left}%`
	fieldMarker.style.insetBlockStart = `${top}%`
	field.setAttribute('aria-valuenow', String(Math.round(cleanHue(state.H))))
	field.setAttribute('aria-valuetext', `Hue ${Math.round(cleanHue(state.H))} degrees, lightness ${Math.round(state.L * 100)} percent`)
}

function syncColorSurfaces() {
	const value = toHex(state.rgb)
	document.body.style.setProperty('--sample-color', value)
	nativeColor.value = value
	updateMarker()
}

function valuesFor(name) {
	try {
		if (name === state.source) return state.vals.slice()
		if (state.source === 'rgb') return toSpace(name, state.vals)
		if (name === 'rgb') return space[state.source].rgb(...state.vals)
		return space[state.source][name](...state.vals)
	} catch { return null }
}

function renderConversions() {
	conversionList.replaceChildren()
	for (const name of shownSpaces) {
		const button = document.createElement('button')
		button.type = 'button'
		button.className = 'conversion-row'
		button.dataset.space = name
		button.setAttribute('aria-pressed', String(name === selectedSpace))
		button.setAttribute('aria-label', `Read ${name} color space`)

		const label = document.createElement('span')
		label.className = 'conversion-name'
		label.textContent = name
		const value = document.createElement('span')
		value.className = 'conversion-value'
		value.textContent = formatCoordinate(name, valuesFor(name))
		button.append(label, value)
		button.addEventListener('click', () => selectSpace(name))
		conversionList.append(button)
	}
	translationCount.textContent = String(shownSpaces.length)
}

function addFact(label, value, link) {
	if (!value) return
	const row = document.createElement('div')
	row.className = 'fact-row'
	const term = document.createElement('dt')
	term.textContent = label
	const detail = document.createElement('dd')
	if (link) {
		const anchor = document.createElement('a')
		anchor.href = link
		anchor.textContent = value
		anchor.rel = 'noreferrer'
		detail.append(anchor)
	} else detail.textContent = value
	row.append(term, detail)
	spaceFacts.append(row)
}

function renderDossier() {
	const record = meta[selectedSpace] || {}
	const lore = LORE[selectedSpace] || {}
	const category = categoryFor(selectedSpace)
	spaceName.textContent = selectedSpace
	spaceClass.textContent = category?.name || 'uncategorized'
	spaceDescription.textContent = shortDescription(record.description)
	spaceFacts.replaceChildren()

	const origin = [record.year, record.by].filter(Boolean).join(' · ')
	const signal = [record.referred, record.dynamic?.toUpperCase(), record.encoding].filter(Boolean).join(' · ')
	const channels = (record.channels || []).map(channel => `${cname(channel)} ${channel.min}–${channel.max}${unitFor(selectedSpace,channel)}`).join(' · ')
	addFact('Born', origin)
	addFact('Signal', signal)
	addFact('Channels', channels)
	addFact('Made for', lore.for || record.use)
	addFact('Known limitation', lore.sin)
	addFact('Name decoded', lore.nm)
	addFact('Primary reference', record.refs?.[0] ? 'Defining source ↗' : '', record.refs?.[0])
}

function selectSpace(name) {
	selectedSpace = name
	renderConversions()
	renderDossier()
}

function renderTaxonomy() {
	taxonomyList.replaceChildren()
	sections.forEach((section, index) => {
		const row = document.createElement('div')
		row.className = 'taxonomy-row'
		const button = document.createElement('button')
		button.type = 'button'
		button.className = 'taxonomy-button'
		button.setAttribute('aria-pressed', String(index === activeCategory))
		button.setAttribute('aria-label', `Show ${section.name} spaces in the live specimen`)

		const name = document.createElement('span')
		name.className = 'taxonomy-name'
		name.textContent = section.name
		const count = document.createElement('span')
		count.className = 'taxonomy-count tnum'
		count.textContent = String(section.spaces.length).padStart(2, '0')
		button.append(name, count)

		const examples = document.createElement('p')
		examples.className = 'taxonomy-examples'
		examples.textContent = section.spaces.slice(0, 7).join(' · ')
		button.addEventListener('click', () => chooseCategory(index))
		row.append(button, examples)
		taxonomyList.append(row)
	})
}

function chooseCategory(index) {
	activeCategory = index
	const section = sections[index]
	shownSpaces = section.spaces.slice(0, 6)
	selectedSpace = shownSpaces[0]
	translationContext.textContent = section.name.toLowerCase()
	renderTaxonomy()
	renderConversions()
	renderDossier()
	document.getElementById('translation-title').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
	requestAnimationFrame(() => conversionList.querySelector('button')?.focus({ preventScroll: true }))
}

function setMaster(source, vals, { entryValue, announce = false } = {}) {
	let rawRgb
	try { rawRgb = source === 'rgb' ? vals.slice() : space[source].rgb(...vals) }
	catch { return false }
	if (!rawRgb?.every(Number.isFinite)) return false
	state.source = source
	state.vals = vals.map(Number)
	state.rgb = rawRgb.map(value => clamp(value,0,255))
	try {
		const oklch = source === 'oklch' ? vals : source === 'rgb' ? space.rgb.oklch(...vals) : space[source].oklch(...vals)
		state.L = clamp(oklch[0],0,1)
		state.C = Math.max(0,oklch[1])
		state.H = cleanHue(Number.isFinite(oklch[2]) ? oklch[2] : state.H)
	} catch {}
	if (entryValue !== undefined) colorEntry.value = entryValue
	syncColorSurfaces()
	renderConversions()
	if (announce) colorStatus.textContent = `${toHex(state.rgb)} translated across ${shownSpaces.length} spaces.`
	return true
}

function setColorFromRgb(rgb, options = {}) {
	return setMaster('rgb',rgb.map(value => clamp(Number(value) || 0,0,255)),options)
}

function setColorFromField(L, H, announce = false) {
	const values = [clamp(L,FIELD.minL,FIELD.maxL),FIELD.chroma,cleanHue(H)]
	const entryValue = `oklch(${values[0].toFixed(3)} ${values[1].toFixed(2)} ${Math.round(values[2])})`
	setMaster('oklch',values,{entryValue,announce})
}

function pickField(clientX, clientY, announce = false) {
	const rect = field.getBoundingClientRect()
	const x = clamp((clientX - rect.left) / rect.width, 0, 1)
	const y = clamp((clientY - rect.top) / rect.height, 0, 1)
	setColorFromField(FIELD.maxL - y * (FIELD.maxL - FIELD.minL), x * 360, announce)
}

field.addEventListener('pointerdown', event => {
	pointerId = event.pointerId
	field.setPointerCapture(pointerId)
	pickField(event.clientX, event.clientY)
})
field.addEventListener('pointermove', event => {
	if (event.pointerId !== pointerId) return
	cancelAnimationFrame(renderFrame)
	renderFrame = requestAnimationFrame(() => pickField(event.clientX, event.clientY))
})
const finishPointer = event => {
	if (event.pointerId !== pointerId) return
	pickField(event.clientX, event.clientY, true)
	try { field.releasePointerCapture(pointerId) } catch {}
	pointerId = null
}
field.addEventListener('pointerup', finishPointer)
field.addEventListener('pointercancel', finishPointer)
field.addEventListener('keydown', event => {
	const large = event.shiftKey
	let L = state.L
	let H = state.H
	if (event.key === 'ArrowLeft') H -= large ? 10 : 1
	else if (event.key === 'ArrowRight') H += large ? 10 : 1
	else if (event.key === 'ArrowUp') L += large ? .05 : .01
	else if (event.key === 'ArrowDown') L -= large ? .05 : .01
	else return
	event.preventDefault()
	setColorFromField(L, H, true)
})

function parseColor(value) {
	const input = value.trim().toLowerCase()
	if (!input) return null
	if (/^#[0-9a-f]{3}$/i.test(input)) return { source:'rgb', vals:hexToRgb('#' + [...input.slice(1)].map(char => char + char).join('')) }
	if (/^#[0-9a-f]{6}$/i.test(input)) return { source:'rgb', vals:hexToRgb(input) }

	const match = input.match(/^([a-z][a-z0-9-]*)\((.*)\)$/)
	if (!match) return null
	let name = match[1]
	const raw = match[2].split('/')[0].trim().split(/[\s,]+/).filter(Boolean)
	if (name === 'rgba') name = 'rgb'
	if (name === 'hsla') name = 'hsl'
	if (name === 'lch') name = 'lchab'

	if (name === 'color') {
		const profile = raw.shift()
		name = { 'srgb':'rgb', 'display-p3':'p3', 'a98-rgb':'a98rgb', 'prophoto-rgb':'prophoto', 'xyz-d65':'xyz', 'srgb-linear':'lrgb' }[profile]
		if (!name) return null
	}
	if (name !== 'rgb' && !space[name]?.rgb) return null

	const cls = classify(name)
	if (raw.length < cls.ch.length) return null
	const values = raw.slice(0,cls.ch.length).map((part,index) => {
		let number = parseFloat(part)
		if (!Number.isFinite(number)) return NaN
		if (part.includes('%')) {
			if (name === 'rgb') number *= 2.55
			else if ((name === 'oklch' || name === 'oklab') && index === 0) number /= 100
			else if (name === 'oklch' && index === 1) number *= .004
		}
		return number
	})
	if (values.some(value2 => !Number.isFinite(value2))) return null
	try {
		const rgb = name === 'rgb' ? values : space[name].rgb(...values)
		return rgb.every(Number.isFinite) ? { source:name, vals:values } : null
	} catch { return null }
}

function showInputError() {
	colorEntry.setAttribute('aria-invalid', 'true')
	colorEntry.dataset.state = 'error'
	helper.classList.add('is-error')
	helper.textContent = 'Color not read. Try #F67D4F, rgb(246 125 79), or oklch(0.72 0.16 41).'
}
function clearInputError() {
	colorEntry.removeAttribute('aria-invalid')
	delete colorEntry.dataset.state
	helper.classList.remove('is-error')
	helper.textContent = DEFAULT_HELP
}
function applyColorEntry(announce = false) {
	const parsed = parseColor(colorEntry.value)
	if (!parsed) { if (inputTouched) showInputError(); return false }
	clearInputError()
	setMaster(parsed.source,parsed.vals,{announce})
	colorEntry.dataset.state = 'success'
	setTimeout(() => { if (colorEntry.dataset.state === 'success') delete colorEntry.dataset.state }, 700)
	return true
}
colorEntry.addEventListener('blur', () => { inputTouched = true; applyColorEntry(true) })
colorEntry.addEventListener('input', () => { if (inputTouched) applyColorEntry(false) })
colorEntry.addEventListener('keydown', event => {
	if (event.key === 'Enter') { event.preventDefault(); inputTouched = true; if (applyColorEntry(true)) colorEntry.blur() }
	if (event.key === 'Escape') { event.preventDefault(); clearInputError(); colorEntry.value = toHex(state.rgb); colorEntry.blur() }
})
nativeColor.addEventListener('input', () => {
	inputTouched = true
	clearInputError()
	setColorFromRgb(hexToRgb(nativeColor.value), { entryValue: nativeColor.value.toUpperCase(), announce: true })
})

const tabs = [...document.querySelectorAll('[role="tab"]')]
const panels = [...document.querySelectorAll('[role="tabpanel"]')]
let activeRuntime = 'js'
function activateRuntime(runtime, focus = false) {
	activeRuntime = runtime
	tabs.forEach(tab => {
		const active = tab.dataset.runtime === runtime
		tab.setAttribute('aria-selected', String(active))
		tab.tabIndex = active ? 0 : -1
		if (active && focus) tab.focus({ preventScroll: true })
	})
	panels.forEach(panel => { panel.hidden = panel.dataset.panel !== runtime })
	resetCopyButton()
}
tabs.forEach((tab, index) => {
	tab.addEventListener('click', () => activateRuntime(tab.dataset.runtime))
	tab.addEventListener('keydown', event => {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
		event.preventDefault()
		let next = index
		if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
		if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
		if (event.key === 'Home') next = 0
		if (event.key === 'End') next = tabs.length - 1
		activateRuntime(tabs[next].dataset.runtime, true)
	})
})

async function copyText(value) {
	if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value)
	const area = document.createElement('textarea')
	area.value = value
	area.setAttribute('readonly', '')
	area.style.position = 'fixed'
	area.style.opacity = '0'
	document.body.append(area)
	area.select()
	const copied = document.execCommand('copy')
	area.remove()
	if (!copied) throw new Error('Clipboard unavailable')
}

const copyCode = document.getElementById('copy-code')
let copyTimer
function resetCopyButton() {
	clearTimeout(copyTimer)
	copyCode.dataset.state = 'default'
	copyCode.querySelector('.copy-label').textContent = 'Copy code'
}
copyCode.addEventListener('click', async () => {
	copyCode.dataset.state = 'loading'
	copyCode.querySelector('.copy-label').textContent = 'Copying…'
	try {
		const value = document.querySelector(`[data-panel="${activeRuntime}"] code`).textContent
		await copyText(value)
		copyCode.dataset.state = 'copied'
		copyCode.querySelector('.copy-label').textContent = 'Copied'
	} catch {
		copyCode.dataset.state = 'error'
		copyCode.querySelector('.copy-label').textContent = 'Copy failed'
	}
	copyTimer = setTimeout(resetCopyButton, 2500)
})
copyCode.addEventListener('mouseleave', () => { if (copyCode.dataset.state === 'copied') resetCopyButton() })

const installButton = document.getElementById('install-command')
let installTimer
function resetInstallButton() {
	clearTimeout(installTimer)
	installButton.dataset.state = 'default'
	installButton.querySelector('.install-feedback').textContent = 'Copy'
}
installButton.addEventListener('click', async () => {
	installButton.dataset.state = 'loading'
	installButton.querySelector('.install-feedback').textContent = 'Copying…'
	try {
		await copyText('npm install color-space')
		installButton.dataset.state = 'copied'
		installButton.querySelector('.install-feedback').textContent = 'Copied'
	} catch {
		installButton.dataset.state = 'error'
		installButton.querySelector('.install-feedback').textContent = 'Copy failed'
	}
	installTimer = setTimeout(resetInstallButton, 2500)
})
installButton.addEventListener('mouseleave', () => { if (installButton.dataset.state === 'copied') resetInstallButton() })

drawField()
syncColorSurfaces()
renderTaxonomy()
renderConversions()
renderDossier()
helper.textContent = DEFAULT_HELP
