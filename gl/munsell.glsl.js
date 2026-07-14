// Munsell renotation is a ~5000-entry measured lookup table (RIT MCSL real.dat)
// with an iterative inverse — not representable as a closed-form shader chunk.
// Convert via JS and upload results as a texture LUT instead.
export default {
	name: 'munsell',
	excluded: 'renotation lookup table — convert in JS, ship as texture LUT',
	edges: {},
	code: '',
}
