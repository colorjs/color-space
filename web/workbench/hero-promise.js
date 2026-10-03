// Atlas hero · Promise – the Search variant's simplicity without a second search: one promise, the facts beside it,
// and the way in is the page itself – the catalog right under it, which already writes the current color. The
// masthead keeps the only search.
import { FACTS } from './hero.js'

export default function mount({ hero }) {
	hero.innerHTML = `<div class="row hpr">
		<p class="lab hpr-meta"><span class="tnum">${FACTS.count} spaces</span><span class="tnum">${FACTS.from}–${FACTS.to}</span><span>CC0</span></p>
		<div class="hpr-body">
			<h1 class="hpr-h">Every color space,<br>one tiny API.</h1>
			<p class="hpr-sub">${FACTS.count} ways to write a color down, from ${FACTS.from} to ${FACTS.to} – converted both ways, each one tested against its source. Below, every one of them writes the color you pick.</p>
			<a class="hpr-in" href="#cat">The spaces<span aria-hidden="true">↓</span></a>
		</div>
	</div>`
}
