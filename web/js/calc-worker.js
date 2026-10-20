// The worker of the exports' sums (calc.js): a job in, its answer out – the page's own JOBS. It says when it is ready: a
// module awaiting its data (data.json) drops a message sent before its handler exists
import { JOBS } from './calc.js'
onmessage = ({ data: { id, job, args } }) => { try { postMessage({ id, out: JOBS[job](args) }) } catch (e) { postMessage({ id, err: String(e?.message || e) }) } }
postMessage('ready')
