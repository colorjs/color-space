#!/usr/bin/env python3
"""
Verify web/js/python.js — the Python tab's colour-science and OpenCV snippets — against
color-space itself. Not part of `npm test`: it needs Python with colour-science, numpy,
scipy and OpenCV.

    python3 -m venv .venv
    .venv/bin/pip install colour-science==0.4.7 numpy scipy opencv-python-headless
    .venv/bin/python scripts/verify-python.py            # all entries
    .venv/bin/python scripts/verify-python.py lab hsv    # a subset

How: node imports index.js and web/js/python.js and returns color-space's float64 output
for a fixed sample set, plus the snippets exactly as the page shows them. Each snippet runs
after its preamble, with only the sample substituted (`rgb = [...]`, `v = [...]`, or the
cv2.imread() image), so the code a reader copies is the code that was measured.

Error = max |python - color-space| / channel range (data.json), over samples and channels.
Hue channels compare on the circle and are skipped on grays (hue is undefined there).
An entry passes at <= 1e-3. One over tolerance must carry a caveat in python.js, and a
caveat on an entry that now passes is stale. Either problem exits 1.

Condensed from the 2026-10-02 research harnesses (colour_verify.py, opencv_verify.py), which
also swept the OpenCV routes over all 16,777,216 8-bit colors; see
docs/formula-verification.md, "Python equivalents".
"""
import json
import math
import re
import subprocess
import sys
import warnings
from pathlib import Path

import numpy as np

warnings.filterwarnings("ignore")
import colour  # noqa: E402
import cv2  # noqa: E402

colour.utilities.filter_warnings(True, True, True)
np.seterr(all="ignore")

REPO = Path(__file__).resolve().parent.parent
TOL = 1e-3

# primaries, secondaries, gray, white, mid-tones, near-black (the research sample set)
SAMPLES = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (0, 255, 255), (255, 0, 255),
           (128, 128, 128), (200, 100, 50), (30, 60, 200), (250, 240, 230), (10, 20, 30), (100, 200, 150),
           (255, 255, 255), (64, 32, 16)]
# OpenCV adds the sRGB linear toe and seeded random colors (fixed-point / LUT paths)
_rng = np.random.default_rng(20261002)
CV_SAMPLES = SAMPLES + [(0, 0, 0), (1, 1, 1), (5, 10, 3), (10, 0, 0), (3, 3, 9)] + \
    [tuple(int(x) for x in _rng.integers(0, 256, 3)) for _ in range(24)]

NODE = r"""
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
const root = pathToFileURL(process.cwd() + '/').href
const space = (await import(root + 'index.js')).default
const py = await import(root + 'web/js/python.js')
const data = JSON.parse(readFileSync('data.json', 'utf8'))
const { samples, cv } = JSON.parse(readFileSync(0, 'utf8'))
const at = (id, set) => set.map((s) => id === 'rgb' ? [...s] : Array.from(space.rgb[id](...s)))
const ref = {}
for (const [id, e] of Object.entries(py.default))
	ref[id] = { ch: data.spaces[id].channels, fwd: at(id, samples), cv: e.opencv ? at(id, cv) : null }
process.stdout.write(JSON.stringify({ version: JSON.parse(readFileSync('package.json', 'utf8')).version,
	PREAMBLE: py.PREAMBLE, PREAMBLE_CV: py.PREAMBLE_CV, entries: py.default, ref }))
"""

# channels that are hue-like but not named "hue": compared linearly, skipped on grays
LINEAR_SKIP_GRAY = {"wavelength": [0], "dsh": [0]}
# cv2 hue masks (research): LCh hue only where the reference chroma >= 1
CV_HUE_MASK = {"lch-d65": lambda ref: ref[1] >= 1, "lchuv": lambda ref: ref[1] >= 1}
# convention subsets, reported next to the overall error for caveated entries
SUBSET = {
    "cct-duv": ("inside 1000-25000 K, |Duv| <= 0.05",
                lambda s, js, py: 1000 <= js[0] <= 25000 and abs(js[1]) <= 0.05 and 1000 <= py[0] <= 25000),
    "wavelength": ("non-purple samples", lambda s, js, py: not (min(s[0], s[2]) > s[1] + 30)),
}


def node():
    p = subprocess.run(["node", "--input-type=module", "-e", NODE], cwd=REPO, capture_output=True, text=True,
                       input=json.dumps({"samples": SAMPLES, "cv": CV_SAMPLES}), check=True)
    return json.loads(p.stdout)


def channel_err(sid, ch, js, py, gray, hue_ok=True):
    """Per-sample max relative error over channels; None when nothing comparable."""
    worst, any_ = 0.0, False
    for c, meta in enumerate(ch):
        rng = meta["max"] - meta["min"]
        hue = re.search(r"hue", meta.get("name", ""), re.I) is not None
        if (hue or c in LINEAR_SKIP_GRAY.get(sid, [])) and (gray or not hue_ok):
            continue
        d = abs(py[c] - js[c])
        if hue:
            d = d % rng
            d = min(d, rng - d)
        e = d / rng if rng else d
        worst = max(worst, e if np.isfinite(e) else math.inf)
        any_ = True
    return worst if any_ else None


def run_colour(sid, expr, pre, ref, inverse):
    errs, worst, worst_sub, n_sub, raised = [], 0.0, 0.0, 0, []
    for i, s in enumerate(SAMPLES):
        ns = {}
        exec(re.sub(r"^rgb = .*$", f"rgb = {list(s)}", pre, flags=re.M), ns)
        if inverse:
            ns["v"] = list(ref["fwd"][i])
        try:
            got = np.asarray(eval(expr, ns), dtype=float).ravel()
        except Exception as ex:  # noqa: BLE001
            raised.append(f"{s}: {type(ex).__name__}")
            continue
        if inverse:  # space -> sRGB 0-255
            e = float(np.max(np.abs(got - np.asarray(s, dtype=float)))) / 255
            e = e if np.isfinite(e) else math.inf
        else:
            js = np.asarray(ref["fwd"][i], dtype=float)
            if got.shape != js.shape:
                raised.append(f"{s}: shape {got.shape} vs {js.shape}")
                continue
            e = channel_err(sid, ref["ch"], js, got, s[0] == s[1] == s[2])
            if e is None:
                continue
            if sid in SUBSET and SUBSET[sid][1](s, js, got):
                n_sub += 1
                worst_sub = max(worst_sub, e)
        errs.append(e)
        worst = max(worst, e)
    return dict(err=worst if errs else None, n=len(errs), raised=raised,
                sub=(worst_sub, n_sub) if sid in SUBSET else None)


def run_cv(sid, expr, pre, ref):
    bgr = np.array(CV_SAMPLES, dtype=np.uint8)[:, ::-1].reshape(1, -1, 3).copy()
    ns = {"__img__": bgr}
    exec(re.sub(r"cv2\.imread\([^)]*\)", "__img__", pre), ns)
    got = np.asarray(eval(expr, ns), dtype=float).reshape(len(CV_SAMPLES), -1)
    worst = 0.0
    for i, s in enumerate(CV_SAMPLES):
        js = np.asarray(ref["cv"][i], dtype=float)
        ok = CV_HUE_MASK.get(sid, lambda r: True)(js)
        e = channel_err(sid, ref["ch"], js, got[i], s[0] == s[1] == s[2], ok)
        if e is not None:
            worst = max(worst, e)
    return dict(err=worst, n=len(CV_SAMPLES), raised=[])


def main():
    only = set(sys.argv[1:])
    d = node()
    print(f"color-space {d['version']} · colour-science {colour.__version__} · OpenCV {cv2.__version__} · numpy {np.__version__}")
    rows, bad = [], 0

    def judge(sid, kind, res, caveat):
        nonlocal bad
        err = res["err"]
        ok = err is not None and err <= TOL and not res["raised"]
        if ok and caveat:
            status = "STALE caveat"
            bad += 1
        elif ok:
            status = "pass"
        elif caveat:
            status = "caveat"
        else:
            status = "FAIL"
            bad += 1
        f = "-" if err is None else f"{err:.1e}"
        extra = ""
        if res.get("sub"):
            extra += f"  subset {res['sub'][0]:.1e} on {res['sub'][1]}/{len(SAMPLES)} ({SUBSET[sid][0]})"
        if kind == "inverse" and err is not None:
            extra += f"  ({err * 255:.2f} sRGB code values)"
        if res["raised"]:
            extra += f"  raised on {len(res['raised'])}: {res['raised'][0]}"
        rows.append((sid, kind, status))
        print(f"{sid:16s} {kind:8s} {status:13s} {f:>9s} n={res['n']}{extra}")

    for sid, e in d["entries"].items():
        if only and sid not in only:
            continue
        ref = d["ref"][sid]
        if "colour" in e:
            judge(sid, "colour", run_colour(sid, e["colour"], d["PREAMBLE"], ref, False), e.get("caveat"))
        if "inverse" in e:
            judge(sid, "inverse", run_colour(sid, e["inverse"], d["PREAMBLE"], ref, True), e.get("inverseCaveat"))
        if "opencv" in e:
            judge(sid, "opencv", run_cv(sid, e["opencv"], d["PREAMBLE_CV"], ref), None)

    from collections import Counter
    print(dict(Counter((k, s) for _, k, s in rows)))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
