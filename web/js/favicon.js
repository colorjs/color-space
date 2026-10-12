// The favicon – the site's rhombus filled with a cloud, the social card's in a tab: a centre color and four soft
// blobs of its neighbouring hues, one from each tip. A color picked: the cloud gathers round it – its own color at
// the centre, hues ±30° at the tips. None picked: the whole wheel at the tips, turning slowly.
// Browsers paint only the first frame of an SVG favicon, so the motion is ours: the link is redrawn ~8×/s while the
// cloud moves (a background tab's timers slow that to ~1/s – it turns on, slower), never at rest.
import { space, hex } from './core.js'

const TIPS = [[8, 0], [16, 8], [8, 16], [0, 8]]
const WHEEL = { L: .8, C: .14, w: 360 }   // none picked: the hero's band, every hue
const TURN = 24   // degrees a second while none is picked
/** The first frame – none picked, red up; the build stamps it into the page's head (scripts/generate-landing.js). */
export const START = { ...WHEEL, h: 0 }
const col = (L, C, h) => hex(space.oklch.rgb(L, C, ((h % 360) + 360) % 360))

/** The icon for a cloud state: centre lightness L, chroma C and hue h (degrees), its tips spread w degrees round it. */
export const iconSVG = ({ L, C, h, w }) => {
	const tip = (k) => col(L, C, h + w * ((k + .5) / 4 - .5))
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><defs><clipPath id="d"><path d="M8 0 16 8 8 16 0 8z"/></clipPath>${
		TIPS.map((_, k) => `<radialGradient id="g${k}"><stop offset="0" stop-color="${tip(k)}"/><stop offset="1" stop-color="${tip(k)}" stop-opacity="0"/></radialGradient>`).join('')
	}</defs><g clip-path="url(#d)"><rect width="16" height="16" fill="${col(L, C, h)}"/>${
		TIPS.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="7.5" fill="url(#g${k})"/>`).join('')}</g></svg>`
}
export const iconURL = (s) => 'data:image/svg+xml,' + encodeURIComponent(iconSVG(s))

/** Drive `link`'s icon: call the returned function with the current color as 0–255 rgb, or null when none is picked. */
export function favicon(link) {
	const reduce = matchMedia('(prefers-reduced-motion: reduce)')
	const cur = { ...START }, want = { ...START }
	let wheel = true, timer = 0, last = 0, drawn = ''
	const tick = () => {
		const now = performance.now(), dt = Math.min(1, (now - last) / 1000), k = reduce.matches ? 1 : 1 - Math.exp(-dt / .18); last = now
		if (wheel && !reduce.matches) want.h += TURN * dt
		for (const p of ['L', 'C', 'w']) cur[p] += (want[p] - cur[p]) * k
		cur.h += (((want.h - cur.h) % 360 + 540) % 360 - 180) * k   // the short way round
		const still = !(wheel && !reduce.matches) && ['L', 'C', 'w'].every((p) => Math.abs(want[p] - cur[p]) < 2e-3) && Math.abs(((want.h - cur.h) % 360 + 540) % 360 - 180) < .5
		if (still) Object.assign(cur, want)   // at rest the centre is the color itself, not 2e-3 short of it
		const u = iconURL(cur)
		if (u !== drawn) link.href = drawn = u
		timer = still ? 0 : setTimeout(tick, 125)
	}
	return (rgb) => {
		wheel = !rgb
		if (rgb) { const [L, C, h] = space.rgb.oklch(...rgb); Object.assign(want, { L, C, w: 60 }); if (isFinite(h) && C > 1e-3) want.h = h }
		else Object.assign(want, WHEEL)
		if (!timer) { last = performance.now(); timer = setTimeout(tick, 0) }
	}
}
