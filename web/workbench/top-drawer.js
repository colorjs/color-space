// Atlas top · Drawer – the two variants.html pieces the owner liked, joined and fixed. The masthead is Studio's:
// it wears the current color – wordmark and count, the color, five to try, the search, EN · theme · GitHub.
// Under it ONE row of the Drawer's cells: the eight facets, then how the catalog is drawn (Draw · Limit ·
// View) – Studio's long icon groups become three dropdowns. Every cell opens its illustrated options right
// under itself (a popover anchored to the cell), never a drawer across the page. Both rows stay pinned; the
// definition and the tour scroll away under them. Contract: atlas.js.
export default function mount({ top, hero, wb }) {
	top.innerHTML = `<header class="top dmast">
		<span class="did"><span data-wb="brand"></span><span data-wb="count"></span><span data-wb="dclear"></span></span>
		<span data-wb="chip"></span><span data-wb="try"></span><span data-wb="search"></span>
		<span class="dend"><span data-wb="lang"></span><span data-wb="tools"></span></span>
	</header>
	<div class="cells dcells" role="group" aria-label="Filters and view">${wb.drawerHTML()}</div>
	${wb.menusHTML()}`
	hero.innerHTML = `<div data-wb="orient"></div>
	<div class="dtour"><span class="lab" aria-hidden="true">Start here</span><div data-wb="stops"></div></div>
	<div class="dstop" data-wb="stop"></div>`
}
