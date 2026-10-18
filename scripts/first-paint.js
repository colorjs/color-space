// The first paint, carried by web/index.html itself – before any script, built or not: the hero's locus (its outlines,
// the boot color's mark), the field's swatch and hint and the top line in the boot color, the row's view mark. Derived
// from their one source (locus.js, the DEFAULT color, icons.js) and written into the page – `node scripts/first-paint.js`
// writes them, the build fails while they are stale
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DEFAULT, LIMIT } from '../web/js/render.js'
import { LI } from '../web/js/icons.js'
import { heroLocus } from '../web/js/locus.js'
import { rgbOf, hex, space, xyOf } from '../web/js/core.js'

export const SRC = fileURLToPath(new URL('../web/index.html', import.meta.url))

/** The page with its first-paint markup current – unchanged where it already is. */
export function firstPaint(html) {
	const rgb = rgbOf(DEFAULT.s, DEFAULT.vals), hx = hex(rgb)
	const sub = (re, f) => { if (!re.test(html)) throw new Error(`first-paint: anchor not found: ${re}`); html = html.replace(re, f) }
	const locus = heroLocus('color-space home', 'Surface', 'Light', { xy: xyOf(...space.rgb.xyz(...rgb)), hx })
	sub(/(<div class="hfield" id="hq">[\s\S]*?\n\t\t<\/div>\n)(?:\t\t<a class="hlocus"[^\n]*\n)?(\t<\/div>\n<\/section>)/, (m, a, b) => `${a}\t\t${locus}\n${b}`)
	sub(/(<input type="color" class="cd" id="cd")(?: value="[^"]*")?/, `$1 value="${hx.toLowerCase()}"`)
	sub(/(<textarea id="cval")(?: placeholder="[^"]*")?/, `$1 placeholder="${hx}"`)   // the boot gray as the field's hint, as the page will show it – never a value the script then empties
	sub(/(<i class="mtop" id="mtop")(?: style="[^"]*")?/, `$1 style="--cur:${hx}"`)   // the top color's line in it
	// the view's mark is the default Limit's, the layout's the view a first visit turns to (the page opens in grid)
	sub(/(<button class="cell lens" type="button" id="c-view")(?: data-g="[^"]*")?([^>]*><span class="ci">)[\s\S]*?(<\/span>)/, (m, a, b, c) => `${a} data-g="${LIMIT}"${b}${LI[LIMIT]}${c}`)
	return html
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const was = readFileSync(SRC, 'utf8'), now = firstPaint(was)
	if (now !== was) { writeFileSync(SRC, now); console.log('first-paint: web/index.html written') } else console.log('first-paint: current')
}
