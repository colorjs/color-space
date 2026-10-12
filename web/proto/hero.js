// Workshop: the hero on the catalog's grid (?hero=<variant>) – see hero.css. Delete this folder once a variant is chosen.
const V = {
	center: ['Centre', 'Today: everything centred over the burst.'],
	rail: ['Rail', 'The title in the rail’s column over the row’s color; the words and the field over the spaces.'],
	column: ['Column', 'Everything in the spaces’ column, left-aligned – the title right over the row’s count.'],
	split: ['Split', 'The title across the page from the rail’s edge; the words and the field in the spaces’ column.'],
}
const root = document.documentElement, want = new URLSearchParams(location.search).get('hero'), K = V[want] ? want : 'center'
root.dataset.hero = K
const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./hero.css', import.meta.url); document.head.append(css)
const bar = document.createElement('nav'); bar.className = 'hw-study'; bar.setAttribute('aria-label', 'hero variants')
bar.innerHTML = `<span>Hero</span>${Object.entries(V).map(([k, [n]]) => `<a href="?hero=${k}"${k === K ? ' aria-current="true"' : ''}>${n}</a>`).join('')}<i>${V[K][1]}</i>`
bar.addEventListener('click', e => { const a = e.target.closest('a'); if (a) { e.preventDefault(); location.assign(location.pathname + '?hero=' + new URL(a.href).searchParams.get('hero') + location.hash) } })
document.body.append(bar)
// the field wears the current color (the row's rhombus, read as it changes)
const field = document.getElementById('hq'), cd = document.getElementById('cd')
const tick = () => { field.style.setProperty('--w', cd.value); requestAnimationFrame(tick) }; tick()
css.onload = () => { document.getElementById('hero').style.minHeight = 'calc(100svh + .01px)' }   // a nudge to the hero's size: the burst re-hangs at the field's new centre
