// Live color-space bento engine — theme-agnostic.
// One canonical colour (OKLCH), every card reflects it in its own space.
// Edit any channel → recompute through sRGB → re-derive all cards.
import space from '../../dist/color-space.js'
import meta from '../../meta.js'

// live count of registered spaces — never hardcode it
export const spaceCount = Object.keys(space).filter(k => space[k] && space[k].name).length

const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v
const round = (v, d = 2) => { const f = 10 ** d; return Math.round(v * f) / f }

// channel definitions per space (symbol, min, max), from generated meta
const chans = s => (meta[s]?.channels || []).map(c => ({ sym: c.symbol, min: c.min, max: c.max, name: c.name }))

// sRGB (0–255, clamped) for any space's channel values
const toRgb = (s, vals) => {
	if (s === 'rgb') return vals.map(v => clamp(Math.round(v), 0, 255))
	try { return space[s].rgb(...vals).map(v => clamp(Math.round(v), 0, 255)) }
	catch { return [0, 0, 0] }
}
// a space's channel values for a given sRGB
const fromRgb = (s, rgb) => {
	if (s === 'rgb') return rgb.slice()
	try { return space.rgb[s](...rgb) } catch { return chans(s).map(c => c.min) }
}
const hex = rgb => '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase()

// gradient showing how channel `ci` sweeps min→max, holding the others
const trackGradient = (s, vals, ci, steps) => {
	const c = chans(s)[ci]; const stops = []
	const n = (c.max - c.min) === 360 ? 24 : steps
	for (let i = 0; i <= n; i++) {
		const v = vals.slice(); v[ci] = c.min + (c.max - c.min) * i / n
		stops.push(hex(toRgb(s, v)))
	}
	return `linear-gradient(90deg, ${stops.join(',')})`
}

const fmt = (v, c) => {
	const span = c.max - c.min
	const d = span <= 1 ? 3 : span <= 40 ? 2 : span >= 300 ? 0 : 1
	return round(v, d).toFixed(d)
}

export function createBento({ mount, primary = 'oklch', secondary = [], tertiary = [], initial = [0.7, 0.16, 40], onChange }) {
	let master = initial.slice()          // OKLCH
	const order = [primary, ...secondary, ...tertiary]
	const cards = new Map()

	const card = (s, tier) => {
		const el = document.createElement('article')
		el.className = `card card--${tier}`; el.dataset.space = s
		el.innerHTML = `
			<div class="card__swatch" aria-hidden="true"></div>
			<header class="card__head">
				<span class="card__name">${s.replace(/-/g, '‑')}</span>
				<span class="card__hex tnum"></span>
			</header>
			<div class="card__chans">${chans(s).map((c, i) => `
				<label class="chan">
					<span class="chan__sym">${c.sym}</span>
					<input class="chan__range" type="range" data-i="${i}"
						min="${c.min}" max="${c.max}" step="${(c.max - c.min) <= 1 ? 0.001 : (c.max - c.min) <= 40 ? 0.01 : 0.1}"
						aria-label="${c.name}">
					<input class="chan__num tnum" type="number" data-i="${i}"
						min="${c.min}" max="${c.max}" step="${(c.max - c.min) <= 1 ? 0.001 : 0.1}">
				</label>`).join('')}
			</div>`
		const onInput = e => {
			const i = +e.target.dataset.i
			const vals = chans(s).map((c, k) => {
				const inp = el.querySelector(`.chan__range[data-i="${k}"]`)
				return k === i ? +e.target.value : +inp.value
			})
			master = space.rgb.oklch(...toRgb(s, vals))
			paint(s)   // skip the card being edited to keep inputs stable
		}
		el.querySelectorAll('.chan__range, .chan__num').forEach(inp => inp.addEventListener('input', onInput))
		cards.set(s, el)
		return el
	}

	const paintCard = (s, skip) => {
		const el = cards.get(s)
		const rgb = space.oklch.rgb(...master).map(v => clamp(Math.round(v), 0, 255))
		const vals = fromRgb(s, rgb)
		const cs = chans(s)
		el.style.setProperty('--c', hex(rgb))
		el.querySelector('.card__hex').textContent = hex(rgb)
		cs.forEach((c, i) => {
			const r = el.querySelector(`.chan__range[data-i="${i}"]`)
			const num = el.querySelector(`.chan__num[data-i="${i}"]`)
			r.style.setProperty('--track', trackGradient(s, vals, i, 8))
			if (s !== skip) {
				r.value = vals[i]
				num.value = fmt(vals[i], c)
			}
		})
	}

	let raf
	const paint = skip => {
		cancelAnimationFrame(raf)
		raf = requestAnimationFrame(() => {
			order.forEach(s => paintCard(s, skip))
			const rgb = space.oklch.rgb(...master).map(v => clamp(Math.round(v), 0, 255))
			onChange?.(rgb, hex(rgb))
		})
	}

	// build DOM: primary, secondary, then a tertiary group (page folds via CSS)
	const frag = document.createDocumentFragment()
	frag.append(card(primary, 'primary'))
	secondary.forEach(s => frag.append(card(s, 'secondary')))
	const t3 = document.createElement('div'); t3.className = 'tier3'
	const t3i = document.createElement('div'); t3i.className = 'tier3__inner'
	tertiary.forEach(s => t3i.append(card(s, 'tertiary')))
	t3.append(t3i); frag.append(t3)
	mount.append(frag)
	paint()

	return {
		set: oklch => { master = oklch.slice(); paint() },
		random: () => { master = space.rgb.oklch(...[0, 0, 0].map(() => Math.floor(Math.random() * 256))); paint() },
		get rgb() { return space.oklch.rgb(...master).map(v => clamp(Math.round(v), 0, 255)) },
		get hex() { return hex(this.rgb) }
	}
}
