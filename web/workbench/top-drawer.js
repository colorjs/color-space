// Atlas header · Drawer – the two variants.html pieces the owner liked, joined: Studio's masthead, wearing the
// current color – wordmark and count, the color, five to try (then the recent ones), the search, EN · theme ·
// GitHub – and, where the atlas starts (under the hero), ONE row of the Drawer's cells: the eight facets, then how
// the catalog is drawn (Draw · Limit · Vision · View). Every cell opens its illustrated options right under itself
// (a popover anchored to the cell). The masthead stays pinned; the cells tuck under it as the page scrolls past
// them and come down when asked for (atlas.css).
// On a page wide enough for the catalog's ladder the masthead hangs on the same grid: the identity in the label
// column, the color where the spaces start (top-drawer.css). The hero under it is a variant's (atlas.js).
export default function mount({ top, cells, wb }) {
	top.innerHTML = `<header class="top dmast">
		<span class="did"><span data-wb="brand"></span><span data-wb="count"></span><span data-wb="dclear"></span></span>
		<span data-wb="chip"></span><span data-wb="try"></span><span data-wb="search"></span>
		<span class="dend"><span data-wb="lang"></span><span data-wb="tools"></span></span>
	</header>`
	cells.innerHTML = `<div class="cells dcells" role="group" aria-label="Filters and view">${wb.drawerHTML()}</div>
	${wb.menusHTML()}`
}
