// Bona-fide cited reference values (audit pass). Each asserts an authoritative
// input->output, NOT a self-referential round-trip. Scale-aware tolerance.
// Every entry carries the authoritative deep link (url) for its cited source;
// values were recomputed from those sources (colour-science 0.4.7 / colorjs.io
// v0.5.2 / culori v4 / printed spec constants) in the 2026-07 audit — see
// docs/formula-verification.md.
import space from '../index.js'
import test, { is } from 'tst'

import { REF } from './refs.js'

test(`bona-fide reference values (${REF.length} cited points, ${new Set(REF.map(r => r.s)).size} spaces)`, () => {
  for (const r of REF) {
    const got = space[r.f][r.t](...r.in)
    for (let k = 0; k < r.out.length; k++) {
      const tol = 0.01 + 0.002 * Math.abs(r.out[k])
      is(Math.abs(got[k] - r.out[k]) <= tol, true,
        r.s + ' ' + r.f + '->' + r.t + ' ch' + k + ': got ' + got[k].toFixed(4) + ' exp ' + r.out[k] + ' [' + r.src + ']')
    }
  }
})
