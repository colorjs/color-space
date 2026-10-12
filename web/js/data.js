// one data artifact for the site and everything else — fetched in the browser,
// imported as a JSON module in node (generate-landing); top-level await makes
// every importer wait transparently. Its own module so a bundle (the Figma plugin)
// can swap in the data inline.
const dataURL = new URL('../../data.json', import.meta.url)
export default dataURL.protocol === 'file:'
	? (await import(dataURL, { with: { type: 'json' } })).default
	: await (await fetch(dataURL)).json()
