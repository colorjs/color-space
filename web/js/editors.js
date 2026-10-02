// Camera log → editor: where each app takes a conversion .cube, and which cube to give it.
//
// One file fits every editor here: a plain 3D .cube (one LUT_3D_SIZE line, 0–1 input,
// no shaper), 33 points by default. 65 ("high precision") goes to Resolve, Premiere, Final
// Cut, OBS and ffmpeg; LumaFusion documents "up to 64 points" and CapCut and VN document
// no limit, so they get 33. Never 1D for an editor — a channelwise pair would otherwise
// auto-emit LUT_1D_SIZE 4096, which ffmpeg's lut3d rejects and OBS (per its source)
// cannot allocate.
// The shaper cube (lut.js { shaper }) is Resolve's own format: DaVinci Resolve / OCIO only.
//
// Provenance (research 2026-10-02): FFmpeg and OBS steps are checked against their own
// source and docs (and ffmpeg 6.1.1 runs); every other app's menu path comes from vendor
// help pages seen only as search snippets, so those entries say menu names may vary.
// The research's 8.6/213 shaper-error figures were refuted by review and are not used.

export const SOFT = 'Menu names may vary by version.'
export const SHAPER_LABEL = 'DaVinci Resolve / OCIO only'
export const SIZE_LABEL = { 33: 'standard', 65: 'high precision' }

// the copy-paste line for a cube the page just saved (its names are [a-z0-9-.] only, so
// the filter string needs no quoting); interp is lut3d's default, spelled out
export const ffmpeg = (file) => `ffmpeg -i in.mov -vf "lut3d=file=${file}:interp=tetrahedral" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a copy out.mp4`

export default [
	{ id: 'davinci-resolve', name: 'DaVinci Resolve', platforms: ['Windows', 'macOS', 'Linux'], dims: 3, sizes: [33, 65], shaper: true,
		steps: [
			'Open Project Settings (gear icon, bottom right) > Color Management > Lookup Tables.',
			'Click “Open LUT Folder” and copy the .cube into it — a subfolder becomes a submenu.',
			'Click “Update Lists”, then “Save”.',
			'On the Color page, right-click a node > LUT > your LUT, or drag it from the LUTs browser onto a node.',
		],
		notes: [SOFT,
			'Use “Open LUT Folder” rather than a typed path: the folder differs by install (sources disagree on Linux; the Mac App Store build keeps its own).',
			'Resolve also reads the shaper cube (1D shaper + 3D lattice in one file, Blackmagic’s layout) — a shaped 33³ beats a plain 65³ on log footage. Other editors don’t: ffmpeg rejects it, OBS reads only its 1D part.'],
		source: 'https://forum.blackmagicdesign.com/viewtopic.php?f=21&t=40284#p232952' },
	{ id: 'premiere-pro', name: 'Adobe Premiere Pro', platforms: ['Windows', 'macOS'], dims: 3, sizes: [33, 65], shaper: false,
		steps: [
			'Window > Lumetri Color, then select the clip in the Timeline.',
			'Basic Correction > “Input LUT” > “Browse…” and choose the .cube — a conversion belongs here, not under Creative > Look.',
			'Premiere 24 and later also offer Input LUT under Lumetri Color > Settings > Source Clip.',
		],
		notes: [SOFT,
			'Premiere 25’s color management can already interpret log footage — check Lumetri Color > Settings so the log isn’t converted twice.'],
		source: 'https://helpx.adobe.com/premiere/desktop/correct-color/add-color-effects/add-look-up-tables.html' },
	{ id: 'final-cut-pro', name: 'Final Cut Pro', platforms: ['macOS'], dims: 3, sizes: [33, 65], shaper: false,
		steps: [
			'Select the clip, open the Effects browser > Color, and double-click “Custom LUT”.',
			'In the Video inspector’s Custom LUT section, open the LUT pop-up > “Choose Custom LUT…”, select the .cube, click Open.',
			'Set the Input and Output pop-ups to the color spaces the LUT converts from and to.',
			'For log clips, alternatively: Info inspector > Camera LUT > “Add Custom Camera LUT…”.',
		],
		notes: [SOFT, 'Apple documents 3D LUT import as .cube and .mga, with no size limit stated.'],
		source: 'https://support.apple.com/guide/final-cut-pro/apply-luts-ver24f966423/mac' },
	{ id: 'capcut-desktop', name: 'CapCut (desktop)', platforms: ['Windows', 'macOS'], dims: 3, sizes: [33], shaper: false,
		steps: [
			'Select the clip in the timeline.',
			'Open the “Adjustment” tab and select “LUT”.',
			'Click “Import” and pick the .cube file.',
			'Apply it to the clip and keep “Intensity” at 100% for a technical log conversion.',
		],
		notes: [SOFT, 'CapCut’s pages state neither a size limit nor 1D support — the 33-point 3D cube is the safe file.'],
		source: 'https://www.capcut.com/resource/luts-for-color-grading' },
	{ id: 'capcut-mobile', name: 'CapCut (mobile)', platforms: ['iOS', 'Android'], dims: 3, sizes: [], shaper: false,
		steps: [
			'CapCut mobile has no known .cube import — import the LUT in CapCut desktop (Adjustment > LUT > Import) instead.',
			'Or bake the conversion into the clip first (see FFmpeg), then bring the clip to mobile.',
		],
		notes: ['CapCut’s own pages describe LUT import on desktop and web only; third-party guides say the mobile app cannot import custom LUTs.'],
		source: 'https://www.capcut.com/resource/luts-for-color-grading' },
	{ id: 'obs-studio', name: 'OBS Studio', platforms: ['Windows', 'macOS', 'Linux'], dims: 3, sizes: [33, 65], shaper: false,
		steps: [
			'Right-click the source (or scene) > Filters.',
			'Under “Effect Filters”, click “+” > “Apply LUT”, name it, OK.',
			'“Path”: Browse… and pick the .cube.',
			'“Amount”: keep 1.0 for a technical conversion.',
		],
		notes: ['“Settings only apply to SDR video” — OBS skips the filter on HDR sources.'],
		source: 'https://github.com/obsproject/obs-studio/blob/master/plugins/obs-filters/color-grade-filter.c' },
	{ id: 'ffmpeg', name: 'FFmpeg', platforms: ['Windows', 'macOS', 'Linux'], dims: 3, sizes: [33, 65], shaper: false,
		steps: [
			ffmpeg('<file>.cube'),
			'Windows drive-letter path: escape the colon inside single quotes — lut3d=file=\'C\\:/LUTs/x.cube\' — or cd into the LUT folder and use the bare file name.',
		],
		notes: ['lut3d reads 3D cubes only (a 1D file fails with “3D LUT is empty”), sizes 2–256.',
			'Never hand lut3d a shaper cube — it is Resolve’s format.'],
		source: 'https://ffmpeg.org/ffmpeg-filters.html#lut3d-1' },
	{ id: 'lumafusion', name: 'LumaFusion', platforms: ['iOS', 'iPadOS', 'Android', 'ChromeOS'], dims: 3, sizes: [33], shaper: false,
		steps: [
			'Copy the .cube to Files, or another location the app can reach.',
			'Tap Import in the Library or the Color & Effects editor, choose the LUT, tap Open.',
			'Double-tap the clip > Color & Effects > LUTs > User LUTs, and tap your LUT; keep the mix at full for a technical conversion.',
		],
		notes: [SOFT, 'Luma Touch documents .cube import “up to 64 points”, so LumaFusion gets the 33-point cube.'],
		source: 'https://luma-touch.helpscoutdocs.com/article/44-how-do-i-imports-luts-cube-and-3dl-files-into-lumafusion' },
	{ id: 'vn', name: 'VN Video Editor', platforms: ['iOS', 'Android'], dims: 3, sizes: [33], shaper: false,
		steps: [
			'Copy the .cube to the device (e.g. the Files app).',
			'Select the clip > Filter > Add, choose the .cube, then a category or folder.',
			'Or from the Filter library: My Filters > Import Filter.',
			'Apply it from the category you chose in the Filter panel.',
		],
		notes: [SOFT, 'VN’s pages state neither a size limit nor 1D support — the 33-point 3D cube is the safe file.'],
		source: 'https://vlognow.me/help/creative-tools/filters/' },
]

/**
 * The lut.js cube() options for an editor at a size — always a plain 3D lattice; the
 * shaper only where the editor reads it (Resolve) and only when asked for.
 * @param {object} ed an entry of the default export
 * @param {number} [size] one of ed.sizes — default the first (33)
 * @param {boolean} [shaper] Resolve's 1D shaper + 3D combined cube
 * @returns {{dims: 3, size: number, shaper?: true} | null} null where the editor takes no .cube (CapCut mobile) or not at that size
 */
export function cubeOpts(ed, size = ed?.sizes?.[0], shaper = false) {
	if (!ed?.sizes?.includes(size)) return null
	return ed.shaper && shaper ? { dims: 3, size, shaper: true } : { dims: 3, size }
}
