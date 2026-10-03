// Atlas heroes – what the variants share (atlas.js documents the contract): the catalog's facts, read off the data,
// never typed; the families' icons, the ladder's own; the current color as it changes, at most once a frame; a canvas
// at the screen's density. A family name jumps to its shelf as a button with data-jump="<family>" (atlas.js).
import { SPACES, meta } from '../js/variants-model.js'
import { FAMILIES } from '../js/variants-data.js'
import { OI } from '../js/variants-icons.js'

const years = SPACES.map(s => +meta[s].year).filter(Boolean)
export const FACTS = { count: SPACES.length, families: FAMILIES.length, from: Math.min(...years), to: Math.max(...years) }

/** The families' icons – glyphs the shared line family already draws, one per family: the ladder's and a hero's. */
export const FAMI = { 'Display & web': OI.display, 'RGB remixes': OI.polar, 'Perceptual': OI.opponent, 'Colorimetry & research': OI.chromaticity,
	'Video & broadcast': OI.delivery, 'Film & camera': OI.scene, 'Color order & surface': OI.palettes }

/** fn on every current-color change – the person's or the ambient orbit's – at most once a frame; returns the stop. */
export function onColor(fn) { let raf = 0
	const h = () => { raf ||= requestAnimationFrame(() => { raf = 0; fn() }) }
	document.addEventListener('wb:color', h)
	return () => { cancelAnimationFrame(raf); document.removeEventListener('wb:color', h) } }

/** fn when el's box changes size (a frame later; once at the start); returns the stop. */
export function onResize(el, fn) { let raf = 0
	const ro = new ResizeObserver(() => { raf ||= requestAnimationFrame(() => { raf = 0; fn() }) }); ro.observe(el)
	return () => { cancelAnimationFrame(raf); ro.disconnect() } }

/** A canvas's backing store sized to its box at the screen's density; the 2D context draws in CSS pixels. */
export function fit(cv) { const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1, w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d))
	if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
	const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return { x, w: r.width, h: r.height } }

/** Several stops as one. */
export const all = (...fns) => () => { for (const f of fns) try { f?.() } catch {} }
