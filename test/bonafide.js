// Bona-fide cited reference values (audit pass). Each asserts an authoritative
// input->output, NOT a self-referential round-trip. Tolerance is relative to each
// output channel's span (TOL in refs.js), or the row's own stated `tol`.
// Every entry carries the authoritative deep link (url) for its cited source;
// values were recomputed from those sources (colour-science 0.4.7 / colorjs.io
// v0.5.2 / culori v4 / printed spec constants) in the 2026-07 audit — see
// docs/formula-verification.md.
import space from '../index.js'
import test, { is } from 'tst'

import { REF, TOL } from './refs.js'

const limit = (r, k) => {
  const t = Array.isArray(r.tol) ? r.tol[k] : r.tol
  if (t != null) return t
  const [lo, hi] = space[r.t].range[k]
  return TOL * (hi - lo)
}

test(`bona-fide reference values (${REF.length} cited points, ${new Set(REF.map(r => r.s)).size} spaces)`, () => {
  for (const r of REF) {
    const got = space[r.f][r.t](...r.in)
    for (let k = 0; k < r.out.length; k++) {
      const tol = limit(r, k)
      is(Math.abs(got[k] - r.out[k]) <= tol, true,
        r.s + ' ' + r.f + '->' + r.t + ' ch' + k + ': got ' + got[k].toPrecision(10) + ' exp ' + r.out[k] + ' tol ' + tol.toPrecision(3) + ' [' + r.src + ']')
    }
  }
})

test('bona-fide rows are complete: a source, its link, where the number comes from', () => {
  const KINDS = ['published', 'implementation', 'computed']
  is(REF.filter(r => !KINDS.includes(r.kind) || !r.src || !/^https?:\/\//.test(r.url) || r.in.length !== space[r.f].range.length || r.out.length !== space[r.t].range.length)
    .map(r => `${r.s} ${r.f}->${r.t}`), [], 'every row: kind, src, url, in/out sized to its spaces')
})
