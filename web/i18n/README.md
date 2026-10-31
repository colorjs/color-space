# Translations

`en.json` is the English source, generated – never edit it. One file per language beside it,
named by its BCP 47 tag: `pt.json`, `es.json`, `zh-Hans.json`.

## Format

```json
{
"@meta": {"name": "Português", "reviewed": null},
"ui.header.find": "buscar espaços…",
"space.oklch.desc": "OKLCH é a forma cilíndrica…"
}
```

- `@meta.name` – the language's own name, shown in the language select.
- Every other key maps directly to its translation. English wording changes keep existing
  translations; no fingerprints or version fields need updating.
- Keys are namespaced: `page.*` titles and descriptions, `ui.*` interface, `faq.*`, `cat.*`
  families, `purpose.*`, `tag.*` and `channel.*` vocabulary, `space.<id>.*` descriptions and uses,
  `lore.<id>.*`, `editor.*`, `lens.*`.

## Rules

- `{name}` placeholders stay, spelled as they are; move them where the sentence needs them.
- HTML tags stay, with their attributes – reorder them with the words. A `title="…"` inside a tag
  may be translated.
- Never type a straight double quote `"` – use the language's own quotes (“ ” « »).
- Leave untranslated: code, CSS and color notations (`oklch(0.7 0.1 50)`), numbers and units,
  space ids and display names (OKLCH, S-Log3, CIELAB), standards (ITU-R BT.709, ICC), people and
  company names, file formats (.cube, .icc).
- An entry that breaks a rule is invalid and reads English.

## Translation quality

The register: short, scientific, open – the serious, exact language of the field, written to be
understood, as a good popular-science or university text in that language reads. Accessible and
educative; never dry officialese, never chatty or flippant. Short by cutting words, not by going
colloquial. A reference work keeps its native name for one (Справочник, Referenz, リファレンス),
whatever shorter word the English uses.

Translate the action or explanation, not the English sentence structure. Read interface text
in place: an image button loads an image, a search hint shows matching spaces, and a table can
be sorted by column. English shorthand such as “test-pinned”, “the field growing”, or “a model
borrowing an anchor” needs a direct explanation in the target language.

Write each translation as an original explanation in that language. Use ordinary words,
conventional technical terminology and the language's own sentence structure. Do not carry
over English marketing formulas or personification: “ready for” can become a statement of
support, “a space that keeps its promises” should explain which quantities it preserves, and
“the average CRT, standardized” describes standardized display characteristics.

Keep labels to a few words where the meaning allows it. Name the quantity or action;
put definitions in the existing tooltip or description. Preserve scientific distinctions:
a code value is not a physical measurement, and luma is not luminance. Do not abbreviate
a term into an unexplained acronym just to make it fit.

Prefer the language's ordinary words for opening images, editing, conversion and output.
Keep established technical loans when replacing them would be less clear or less precise.
Explain implementation terms only where they help the reader: “variant with adjustable
parameters”, not “parameterized legacy node”; “linear segment near black”, not a literal
translation of the English curve metaphor. Read labels with their adjacent controls,
and update references to renamed sections in the FAQ.

- Follow `GLOSSARY.md` for technical distinctions. Lightness, luminance, brightness, chroma,
  saturation and chromaticity are not interchangeable. Keep established loanwords where the
  field uses them; do not replace them merely because they come from English.
- Use the language's usual action labels and word order. Refer to the same control consistently
  in buttons, tooltips, accessibility labels and explanatory prose.
- Read interpolated text with actual values. If the placeholder can take several grammatical
  forms, use a natural construction that works with all of them (for example, a count after
  a label), rather than guessing the number or the ending of a space name.
- Review sample colors as labels; keep executable CSS names such as `tomato` unchanged in
  input examples. Do not translate code, identifiers or menu names without checking the
  corresponding application's localized interface.

The 2026-10-07 editorial passes corrected shared interface labels, search/image actions,
testing copy, timeline explanations, FAQ, historical notes and scientific descriptions across
all 12 translations. The second pass addressed English idioms repeated throughout the
historical notes, rewrote the introductions and model explanations, and revised Russian
terminology and prose more extensively. These were AI-assisted editorial reviews;
they do not constitute native-speaker approval of every space description.
The 2026-10-17 terminology pass reviewed every language's titles, catalog labels and descriptions
for calques, checking terms against Wikipedia's interlanguage links where it was reachable (not for
ru and ja): each hero title is now the plain search term (the kicker left empty), and category,
purpose and grouping labels use the field's own words. It was AI-assisted too.
The 2026-10-18 calque pass read every string of every language against the English: sentences
mirrored from English («равные шаги выглядят равными», «предсказание восприятия», a gamut "under" a
log curve), literal metaphors and personified spaces were rewritten in each field's own register,
one recurring English formula settled once per language, and the meaning errors found on the way
fixed (three coordinates "suffice" where English says the minimum needed). AI-assisted as well.
The 2026-10-19 copy pass shortened the English by about a third (descriptions, “used for” lines,
margin notes), corrected the content errors a source check found (CIECAM16 is CAM16; the IgPgTg and HSM
authors; PAL's BT.470 gamma 2.8; CCT measured in CIE 1960 uv, among others), and retranslated every
changed string in all 12 languages from the new English, the glossary's terms kept. AI-assisted too.
`@meta.reviewed` remains `null`. The language-specific questions in `GLOSSARY.md` still need
native readers with color-science or imaging experience.

The subsequent register pass covered recurring labels and explanations in all 14 available
translations, including Ukrainian. It shortened channel names, clarified conversion and LUT
labels, removed internal implementation jargon and literal curve metaphors, and revised
selected Russian descriptions and Hindi interface vocabulary. The corresponding English
ACES and BT.709 descriptions were corrected at their source. This was an AI-assisted
editorial pass, not an exhaustive native-speaker review.

## Workflow

```sh
npm run i18n                                       # re-extract en.json, report every language
node scripts/i18n-extract.js --todo pt > todo.json      # what pt still needs, in its own format
npm run landing                                    # build; /pt/ pages appear when ready
```

A key reads English, per key, wherever its translation is missing or invalid.
Existing valid translations stay visible when English changes. CI's **Translation review**
step compares the English catalog with the pull request's base or the previous push and lists
the changed text, unchanged translations to review, and missing translations in the job summary.
This is a review notice, not a deployment gate or a native-speaker approval.

## Publishing

- A language ships once 95% of the shared strings are translated (`COVER` in scripts/i18n.js) – its
  `/<code>/` index and every space page whose own text is translated, offered in the language select.
- It stays published through later English wording edits. A missing or structurally invalid
  translation reads English, per key (`npm run i18n` lists them).
- Published pages are in search – indexed, in the sitemap and the hreflang group – reviewed or not.
  After a native reader's review, record it: `"@meta": {"name": "…", "reviewed": "Name, 2026-10-12"}`.
