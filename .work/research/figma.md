# figma

## summary
I checked the Figma Plugin API against @figma/plugin-typings 1.140.0 (plugin-api.d.ts and index.d.ts from raw.githubusercontent.com) and a shallow clone of figma/plugin-samples (HEAD 03131bef, 2026-03-23). The sandbox blocks developers.figma.com and help.figma.com (403), so facts that only live on those pages are marked search-snippet.

**Confirmed from the typings and samples**
- **Manifest fields:** name, id, api "1.0.0", main, ui, editorType, documentAccess "dynamic-page", networkAccess {allowedDomains, reasoning}, capabilities (inspect/codegen/textreview), permissions, menu.
- **UI options:** `figma.showUI` takes visible, title, width (default 300, min 70), height (default 200), position and themeColors (default false).
- **Messaging:** `figma.ui.postMessage` / `onmessage`, and on the UI side `parent.postMessage({pluginMessage}, '*')`.
- **Selection:** `figma.currentPage.selection` and `figma.on('selectionchange')`.
- **Paints:** SolidPaint is {type:'SOLID', color: RGB {r,g,b} with no alpha, opacity, visible, blendMode, boundVariables}. `fills` can be `figma.mixed`. Paints are readonly, so you copy the array and reassign it; Figma's invert-image sample does exactly this.
- **Color profile:** `figma.root.documentColorProfile` is 'LEGACY' | 'SRGB' | 'DISPLAY_P3'.
- **Storage:** `figma.clientStorage` has get/set/delete/keysAsync.
- **Live updates:** under dynamic-page, `documentchange` first needs `loadAllPagesAsync`. Use `currentPage.on('nodechange')` with PROPERTY_CHANGE 'fills'/'strokes' to follow edits made while the plugin is open.
- **Dev Mode:** a plugin can run in both Figma Design and Dev Mode (sample manifest uses ["dev","figma"] plus capabilities codegen/inspect). Codegen returns {title, code, language:'CSS'|...} and times out after 15 s.
- **Loading for development:** Figma's own README says "Plugins > Development > Import plugin from manifest…" in the desktop app.

**Search-snippet only (primary page blocked)**
- In a DISPLAY_P3 file, SolidPaint {r,g,b} are Display P3 gamma-encoded values from 0 to 1. The RGB docs page says: "All colors are specified in the same color space which will be the color profile of the document, documentColorProfile". The typings don't say this.
- A file's profile can be changed two ways: Assign keeps the values, Convert keeps the appearance.
- Legacy files with no preferred profile render as sRGB.
- One manifest cannot target both FigJam and Dev Mode.
- Dev Mode plugins are read-only.
- Publishing:
  - needs the desktop app;
  - Figma generates the plugin id;
  - two-factor auth is required unless you sign in with SSO;
  - review takes about 5–10 business days.

**Penpot:** read from penpot/penpot main (plugin-types, manifest.schema.ts, register.cljs) and the starter template.
- The API looks similar: `penpot.selection`, `on('selectionchange')`, `ui.open/sendMessage/onMessage`.
- Fills are hex strings only (fillColor '#RRGGBB'), so Penpot can only write 8-bit sRGB, not P3.
- Plugins are hosted by URL and loaded through the Plugin Manager (Ctrl+Alt+P). Penpot takes the host from the manifest URL and makes the plugin id itself.
- For a manifest in a subfolder (e.g. color-space.io/penpot/), use "version": 2 so code paths resolve from that folder.

**Checked against the library and colour-science 0.4.7**
- Figma's sRGB maps to `space.rgb` (×255) and its P3 maps to `space.p3` (0..1).
- P3 and OKLCH conversions match colour-science to within about 1e-4.
- Out-of-gamut values come out differently in the two libraries (sign-mirrored vs linear transfer), so the plugin must gamut-map before writing. The CSS Color 4 algorithm (OkLCh chroma search, JND 0.02) was confirmed in the w3c/csswg-drafts source.
- Full minified bundle: 121,846 B (56,381 B gzipped). The lite build has no p3, hsl or hct.

**Not verified:** whether `navigator.clipboard` works in the plugin iframe (forum evidence only), how `figma.util.rgb('lab(...)')` behaves in P3 files, whether writing to a variable-bound paint detaches it, and the clientStorage quota.

## recommendation
**Build the Figma plugin first.** Minimal layout: `plugins/figma/{manifest.json, code.js, src/ui.js → ui.html}`. A `plugins/` folder is not in package.json "files", so it won't ship to npm.

**manifest.json**
```json
{
  "name": "color-space",
  "id": "<dev string; Figma-generated id at publish>",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma", "dev"],
  "capabilities": ["inspect"],
  "documentAccess": "dynamic-page",
  "networkAccess": { "allowedDomains": ["none"] }
}
```
Pick Dev Mode over FigJam, because one manifest reportedly can't target both. Later, add the `codegen` capability so Dev Mode's Code panel prints `oklch()` / `color(display-p3 …)` for the selected node.

**code.js (main thread, no DOM)**
- `showUI(__html__, {themeColors: true})`.
- On `selectionchange` and on `currentPage.on('nodechange')` (fills/strokes), send `{profile: figma.root.documentColorProfile, paints: [...]}` for every SOLID fill or stroke.
- On a 'set' message, copy the fills/strokes array, replace the color, reassign it.
- Save the chosen space with `clientStorage`.
- Never write when `editorType === 'dev'`.

**ui.html (one self-contained file)**
- Bundle `src/ui.js` with esbuild `--format=iife` and inline the full library (about 56 KB gzipped). The lite build lacks p3, hsl and hct.
- Read values: DISPLAY_P3 → `space.p3`; SRGB and LEGACY → `space.rgb` ×255, with LEGACY labelled as sRGB.
- Write values: chosen space → p3 or rgb → CSS Color 4 gamut map (OkLCh, JND 0.02) → clamp to [0,1] → postMessage.
- Copy CSS as `oklch()`, plus `color(display-p3)` in P3 files or hex in sRGB files. Use `navigator.clipboard` with a textarea + `execCommand('copy')` fallback.
- Style only with the `--figma-color-*` tokens.

**Development and publishing:** develop in the Figma desktop app (Plugins > Development > Import plugin from manifest). Publishing needs a Figma account with two-factor auth (or SSO), a Figma-generated id, and Community review.

**Optional Penpot port:** host it at `color-space.io/penpot/manifest.json` with "version": 2 and permissions content:read/content:write/allow:localstorage/clipboard:write. People can try it with no install by pasting that URL into Penpot's Plugin Manager. Writes would be sRGB hex only.

**Before shipping, test in Figma:** clipboard access, how variable-bound paints behave, and what LEGACY files look like.

## files
['<session-scratch>/research/figma.json', '<session-scratch>/research/figma/plugin-api.d.ts', '<session-scratch>/research/figma/index.d.ts', '<session-scratch>/research/figma/samples/', '<session-scratch>/research/penpot/penpot_penpot_main_plugins_libs_plugin-types_index.d.ts', '<session-scratch>/research/penpot/penpot_penpot_main_plugins_libs_plugins-runtime_src_lib_models_manifest.schema.ts', '<session-scratch>/research/penpot/register.cljs', '<session-scratch>/research/css-color-4.bs']

## facts
- [fetched-primary] Manifest core fields used by all official Figma samples: name, id, api:'1.0.0', main, ui, editorType:[...], documentAccess:'dynamic-page', networkAccess:{allowedDomains:['none']}; optional: capabilities, permissions, menu, parameters, codegenLanguages, networkAccess.reasoning (figma/plugin-samples */manifest.json (git clone HEAD 03131bef))
- [search-snippet] documentAccess 'dynamic-page' required for new plugins: required for new plugins/widgets since API Update 87 (2024-02-21); deprecated sync getters throw under it (search snippet developers.figma.com updates/2024/02/21; throw behaviour in plugin-api.d.ts l.423-433)
- [fetched-primary] figma.editorType values: 'figma' | 'figjam' | 'dev' | 'slides' | 'buzz' (plugin-api.d.ts line 29 (@figma/plugin-typings 1.140.0))
- [fetched-primary] Figma Design + Dev Mode in one plugin: editorType ['dev','figma'] + capabilities ['codegen','inspect'] (official dev-mode sample) (figma/plugin-samples dev-mode/manifest.json)
- [search-snippet] FigJam and Dev Mode cannot be combined: ['figjam','dev'] and ['slides','dev'] unsupported (search snippet developers.figma.com/docs/plugins/manifest)
- [search-snippet] Dev Mode plugins are read-only: read document, write pluginData/relaunchData, listen to events; no node edits (search snippet developers.figma.com/docs/plugins/working-in-dev-mode)
- [fetched-primary] figma.showUI options: visible(true), title, width(300,min 70), height(200,min 0), position{x,y}, themeColors(false) (plugin-api.d.ts l.348-394, ShowUIOptions l.2778)
- [fetched-primary] themeColors CSS variables: --figma-color-bg, --figma-color-text, --figma-color-border, --figma-color-bg-brand ... used by official samples; html class figma-light/figma-dark (snippet) (figma/plugin-samples webpack-react/esbuild-react UI; class names via search snippet developers.figma.com/docs/plugins/css-variables)
- [fetched-primary] UI messaging: main: figma.ui.postMessage(msg,{origin?}), figma.ui.onmessage=(msg,{origin})=>..; UI: parent.postMessage({pluginMessage:msg},'*'), window.onmessage=e=>e.data.pluginMessage; structured-clone payloads (plugin-api.d.ts UIAPI l.2813-2895; plugin-samples post-message/code.js + ui.html)
- [fetched-primary] Selection and events: figma.currentPage.selection: ReadonlyArray<SceneNode>; figma.on('selectionchange', ()=>{}) (no args, async) (plugin-api.d.ts l.10602, l.4-13, l.480-560)
- [fetched-primary] Watching fill edits under dynamic-page: documentchange needs loadAllPagesAsync; use figma.currentPage.on('nodechange') with PROPERTY_CHANGE properties 'fills'/'strokes' (plugin-api.d.ts l.562-566, 3686-3694, 10683)
- [fetched-primary] SolidPaint shape: {readonly type:'SOLID', readonly color: RGB{r,g,b} (no alpha), visible?, opacity? 0..1, blendMode?, boundVariables?{color?}} (plugin-api.d.ts SolidPaint l.4668, RGB l.3942)
- [fetched-primary] fills/strokes typing: fills: ReadonlyArray<Paint> | figma.mixed (text ranges -> getRangeFills/setRangeFills); strokes: ReadonlyArray<Paint>; Paint = Solid|Gradient|Image|Video|Pattern|Shader (plugin-api.d.ts l.4871, 8636-8752, 9886)
- [fetched-primary] Setting fills requires copying the array: clone node.fills, replace paint via {...paint, color}, reassign node.fills = arr (readonly typings; plugin-samples invert-image/code.ts l.30-47; JSON clone idiom from search snippet of docs 'Editing Properties')
- [fetched-primary] documentColorProfile: figma.root.documentColorProfile: 'LEGACY' | 'SRGB' | 'DISPLAY_P3' (LEGACY = pre-color-management docs) (plugin-api.d.ts DocumentNode l.10402-10404)
- [search-snippet] Space of SolidPaint.color values: same as documentColorProfile: in DISPLAY_P3 files {r,g,b} are Display P3 encoded 0..1 (= color(display-p3 r g b)); in SRGB files sRGB 0..1 (search snippet developers.figma.com/docs/plugins/api/RGB ('All colors are specified in the same color space which will be the color profile of the document, documentColorProfile'); typings silent)
- [search-snippet] File profile change semantics and legacy rendering: Assign keeps values (appearance changes); Convert keeps appearance (values rewritten); new files default sRGB; legacy file without preferred profile renders sRGB (search snippet help.figma.com/hc/en-us/articles/360039825114)
- [fetched-primary] figma.util.rgb/solidPaint accept CSS strings: hex, rgb(), hsl(), lab(); target space in P3 docs undocumented (plugin-api.d.ts UtilAPI l.2900-2990)
- [fetched-primary] clientStorage API: getAsync/setAsync/deleteAsync/keysAsync, local to user's machine; quota not verified (plugin-api.d.ts ClientStorageAPI l.2663-2683)
- [fetched-primary] Codegen in Dev Mode: figma.codegen.on('generate', ({node,language}) => CodegenResult[] {title, code, language:'CSS'|'JSON'|'PLAINTEXT'|...}); 15 s timeout (plugin-api.d.ts l.3035-3110)
- [fetched-primary] Development loading: Figma desktop app: Plugins > Development > Import plugin from manifest...; not available in browser (figma/plugin-samples README.md (desktop path); browser absence via search snippets)
- [search-snippet] Plugin id and publishing: any id string for local import; Figma-generated id needed to publish (New plugin / 'Generate ID'); 2FA required unless SAML/Google SSO; review ~5-10 business days (search snippets of help.figma.com articles 360042293394, 4410337103639, 360039958914)
- [unverified] Clipboard inside plugin UI: only possible from iframe; navigator.clipboard possibly unavailable, execCommand('copy') fallback (forum.figma.com threads only)
- [fetched-primary] Penpot manifest: {name, description<=200, code, icon?, version? 1|2, permissions from content:read/write, library:read/write, user:read, comment:read/write, allow:downloads, allow:localstorage, clipboard:read/write}; host + plugin-id derived by Penpot (penpot/penpot main plugins-runtime manifest.schema.ts + frontend/src/app/plugins/register.cljs)
- [fetched-primary] Penpot manifest version 2 resolves code relative to the manifest folder: v1 origin = URL with path stripped; v2 origin = URL joined with '.' (register.cljs parse-manifest)
- [fetched-primary] Penpot API shape and limits: penpot.selection, penpot.on('selectionchange', ids), penpot.ui.open(name,url,{width,height}) (hosted URL), ui.sendMessage/onMessage; Fill {fillColor:'#hex', fillOpacity} -> sRGB 8-bit only; loaded via Plugin Manager Ctrl+Alt+P with manifest URL (penpot plugin-types index.d.ts l.1-130, 896-916, 1768, 4165; starter template README l.98-106)
- [fetched-primary] CSS Color 4 gamut mapping: 'to CSS gamut map' OkLCh chroma binary search, JND = 0.02 (w3c/csswg-drafts css-color-4/Overview.bs l.6384, 6519, 6563)
- [computed] Library mapping to Figma profiles: SRGB/LEGACY -> space.rgb (range 0..255, multiply by 255); DISPLAY_P3 -> space.p3 (range 0..1) (node import /home/user/color-space/index.js, space.rgb.range / space.p3.range)
- [computed] Library vs colour-science agreement: p3(1,.5,0)->oklch lib [0.742513,0.219804,51.160] vs colour [0.742512,0.219731,51.158]; rgb(255,128,0)->p3 lib [0.936118,0.529018,0.198730] vs colour [0.936153,0.528949,0.198647] (node + colour-science 0.4.7)
- [computed] Out-of-gamut encoding differs by convention: p3(1,.5,0)->sRGB blue: lib -53.68 vs colour -120.05 (of 255); linear values agree (-0.03647 vs -0.03644) -> plugin must gamut-map and clamp to [0,1] (node + colour-science)
- [computed] Bundle size for ui.html: dist/color-space.min.js 121,846 B (56,381 B gzip), ESM; lite build 43,503 B lacks p3/hsl/hct (ls + gzip on /home/user/color-space/dist; node import lite.js)
