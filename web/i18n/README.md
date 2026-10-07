# Translations

`en.json` is the English source, generated – never edit it. One file per language beside it,
named by its BCP 47 tag: `pt.json`, `es.json`, `zh-Hans.json`.

## Format

```json
{
"@meta": {"name": "Português", "reviewed": null},
"ui.header.find": {"t": "buscar espaços…", "h": "60d838c1"},
"space.oklch.desc": {"t": "OKLCH é a forma cilíndrica…", "h": "…"}
}
```

- `@meta.name` – the language's own name, shown in the language select.
- `t` – the translation. `h` – copied unchanged from the same key in `en.json`: it records which
  English you translated. When the English changes, its `h` changes, and your entry is stale.
- Keys are namespaced: `page.*` titles and descriptions, `ui.*` interface, `faq.*`, `cat.*`
  families, `purpose.*`, `tag.*` and `channel.*` vocabulary, `space.<id>.*` descriptions and uses,
  `lore.<id>.*`, `tour.*`, `editor.*`, `lens.*`.

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

Translate the action or explanation, not the English sentence structure. Read interface text
in place: an image button loads an image, a search hint shows matching spaces, and a table can
be sorted by column. English shorthand such as “test-pinned”, “the field growing”, or “a model
borrowing an anchor” needs a direct explanation in the target language.

Write each translation as an original explanation in that language. Use ordinary words,
conventional technical terminology and the language's own sentence structure. Do not carry
over English marketing formulas or personification: “ready for” can become a statement of
support, “a space that keeps its promises” should explain which quantities it preserves, and
“the average CRT, standardized” describes standardized display characteristics.

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
`@meta.reviewed` remains `null`. The language-specific questions in `GLOSSARY.md` still need
native readers with color-science or imaging experience.

## Workflow

```sh
npm run i18n                                       # re-extract en.json, report every language
node scripts/i18n-extract.js --todo pt > todo.json      # what pt still needs, in its own format
npm run landing                                    # build; /pt/ pages appear when ready
```

A key reads English, per key, wherever its translation is missing, stale or invalid.

## Publishing

- A language ships once 95% of the shared strings are translated (`COVER` in scripts/i18n.js) – its
  `/<code>/` index and every space page whose own text is translated, offered in the language select.
- It stays published through later English edits: a new or reworded string reads English, per key,
  until retranslated (`npm run i18n` lists them). An English edit never takes a language off the site.
- Published pages are in search – indexed, in the sitemap and the hreflang group – reviewed or not.
  After a native reader's review, record it: `"@meta": {"name": "…", "reviewed": "Name, 2026-10-12"}`.
