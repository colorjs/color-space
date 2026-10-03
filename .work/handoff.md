# Handoff — 2026-10-03

State of the marketing/integrations push, for whoever picks it up next. Verified research
(primary sources, skeptic-checked) lives in `.work/research/*.md`; `<session-scratch>` paths in
those files pointed at throwaway harness scripts and are gone.

## Live on master (deployed)

Name views orbit like the index; clean dossier URLs; ACEScg Bradford fix; four camera logs
(Apple Log 2, F-Log2 C, GP-Log2, KineLOG3); editor-aware LUT export; PY + EMBED tabs, `?embed`,
vision lens, Cite; MCP server (annotations, structured output, gamut + css tools, server.json);
Figma plugin source; CITATION.cff; workbench prototypes at `/workbench/`.

## In the open PR (branch `claude/hopeful-wright-hzzfs4`)

- Samsung Log (`samsunglog`) and Insta360 I-Log (`ilog`) from the owner's vendor documents —
  anchors cite Table 1 / the 1D LUT / the I-Log table; vendor files are NOT in the repo
  (redistribution isn't ours to grant). 168 spaces.
- HLSL + MSL: `gl/naga.js`, `gl/hlsl.js`, `gl/msl.js` translate the verified WGSL with naga.
  `naga-wasm` is an OPTIONAL peer (package keeps zero install deps) + exact devDependency;
  `web/vendor/naga-wasm/` follows the libheif vendoring idiom (test pins it byte-identical).
  `.github/workflows/shaders.yml` (DXC/FXC/Metal) passed on its first PR run.
- Follow-ups: one CSS serializer (`css.js`) for site + MCP + workbench; display names from one
  source; Umami analytics (OFF until `UMAMI` in `web/js/track.js` holds the website id);
  guarded storage for embeds; stale counts in third.html.
- GL harness: NaN outputs now fail the float comparator (the old one passed NaN as 'not worse');
  `dkl` verified against the JS. Benchmark: `benchmark/compare.js` passed a channel count to
  `wasm.alloc()` (which takes pixels), so WASM rates were computed over a third of the work —
  fixed; README/marketing/library-comparison now quote measured figures unrounded.
- rec2020 in the CSS tab: CSS Color 4's `rec2020` uses a pure 2.4 gamma (BT.1886 — css-color-4
  Overview.bs + conversions.js), the library's `rec2020` uses the BT.2020 OETF, so the tab says
  CSS can't name it directly instead of emitting a `color(rec2020 …)` that decodes differently.
- Atlas workshop: `web/workbench/atlas.html?top=studio|editorial|search|statusbar`, contract at
  the top of `web/workbench/atlas.js`; side panel = the real dossier via `/<space>?embed` iframe
  with two-way color sync; flush strips; full quantization + metric + limits selects.

## Owner decisions (verbatim where quoted)

- Prototypes first: "I want to prototype designs, not to have thorough detailed view, to select the
  design from. And then invest time into full version."
- Atlas is the direction: "organic iteration of current design … after lots of adjustments".
  No 2px gaps between strips (visual noise). Side panel must keep the current dossier's layout and
  features. Quantization = dropdown with every kind. Keep the view switch incl. slider kinds.
  Hero + options bar was "a chaotic mess – needs workshop of variants"; likes the Studio top panel;
  likes Search's minimalism and side display but it was "too collapsed".
- GP-Log2: "whatever would be the least confusing" → scene linear (0.18 = middle grey), like
  every other log here; GoPro's clip-relative 0.0517 is noted in the dossier.
- Zenodo enabled; the DOI is minted by the next `release.yml` run (it creates the GitHub Release).

## Not done — pick up here

1. **Atlas workshop** – Search and Status bar are designed, the chooser links all four headers
   (`atlas.html?top=studio|editorial|search|statusbar`); `--stick-bot` (atlas.css, contract in atlas.js)
   is the bottom bar's counterpart of `--stick-top`. Left: the critic pass on Studio and Editorial; a live
   variant-swap check (color, filters, open dossier, scroll survive); opening a space mid-page at 1440 can
   leave its entry off-screen in every variant – `openPane`'s `scrollIntoView` (wb.js) runs before the dock
   narrows the page, re-run it a frame after the dock opens; with filters on, a ladder count like
   "1 of 22" truncates "Colorimetry & research" (label column too narrow).
2. ~~**Shader tabs on the site**~~ – done: GLSL · WGSL · HLSL · MSL in the dossier's GL tab, naga lazy on
   the first HLSL/MSL pick, check-site pins each language's entry name and the on-demand load.
3. **Translations pilot (pt-BR, es, tr)** – the pipeline is built on branch `wip/i18n` (not in this PR):
   `npm run i18n` → `web/i18n/en.json` (912 keys, 18.6k words), `scripts/i18n.js` stamps `/<lang>/`
   documents, `web/js/i18n.js` is the runtime, `web/i18n/README.md` the translators' notes,
   `test/i18n.js` covers it against a fixture locale; the English build differs only by one
   modulepreload. One rule added: a language stays `noindex`, out of hreflang/sitemap/select until
   `@meta.reviewed` names its native reader. Left: string coverage of index.html (head, search and
   toast only so far – the app module's local `t` variables must be renamed while wrapping), the
   translations themselves, a visual check of the select, a full `npm test`. The decided design:
   - URLs `/<lang>/` and `/<lang>/<space>`, stamped documents (GitHub Pages can't rewrite) with
     `<html lang>`, translated title/description/og, self canonical, reciprocal hreflang
     (pt-BR · es · tr · en · x-default→en), sitemap alternates. No auto-redirect.
   - Header language select in the existing de-chromed select idiom, real links preserving space+hash.
   - `scripts/i18n-extract.js` → `web/i18n/en.json` from the sources of truth (UI strings in
     index.html wrapped in `t()`, data.json description/use, lore.js for/sin/nm, tour.js,
     categories/purpose); `web/i18n/<lang>.json` maps key → `{ t, h }` (h = hash of the English it
     translated). Runtime `web/js/i18n.js`: language from path prefix, lazy load, per-key English
     fallback when missing or stale. Build guard: a language page is stamped/listed only when its
     content is translated and fresh. Bake translated dossiers.
   - Per language: glossary first (CIE e-ILV equivalents, national standards), translator, then an
     independent reviewer. Google accepts AI translation only with human review → have a native
     speaker read each language before promoting it.
4. **Smaller** – done: the WASM tab quotes 1.38–4.78×; `variants-data.js` reads CSS capability from
   css.js and alt.html drops rec2020; the dead USES fallback is deleted (a test requires `@use`);
   `paintBarGL` takes the palette metric (check-site samples per metric); culori is 30 spaces with no
   HSLuv (culori 4.0.2's registered modes); README notes naga-wasm's Node ≥ 24.12 engines field.
   third.html's CSS notation already came from css.js – nothing left there.

## Owner actions

- Umami Cloud (free Hobby, 100k events/month, custom events): create the site, put its id in
  `web/js/track.js` → `UMAMI`. Cloudflare Web Analytics is the pageview-only fallback.
- Figma: desktop app → Plugins › Development › Import plugin from manifest
  (`plugins/figma/manifest.json`), test in an sRGB and a Display P3 file, publish from the
  development menu; Figma assigns the real id (replace the placeholder in manifest.json).
- Next npm release via `release.yml`: publishes npm, the GitHub Release (→ Zenodo DOI) and, after
  npm, the MCP registry entry (`io.github.colorjs/color-space`).
