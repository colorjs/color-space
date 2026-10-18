// A worker of the sweep pool (sweep.js): batches of strips in, their CSS out – the page's own sweepCSS, the same bytes.
// It says when it is ready: a module awaiting its data (data.json) drops a message sent before its handler exists
import { sweepCSS } from './sweep.js'
onmessage = ({ data }) => postMessage(data.map(j => { try { return { id: j.id, css: sweepCSS(j) } } catch { return { id: j.id } } }))
postMessage('ready')
