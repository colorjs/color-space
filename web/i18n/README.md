# Translations

`en.json` is the English source, generated – never edit it. One file per language beside it,
named by its BCP 47 tag: `pt-BR.json`, `es.json`, `tr.json`.

## Format

```json
{
"@meta": {"name": "Português (Brasil)", "reviewed": null},
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

## Workflow

```sh
npm run i18n                                       # re-extract en.json, report every language
node scripts/i18n-extract.js --todo pt-BR > todo.json   # what pt-BR still needs, in its own format
npm run landing                                    # build; /pt-BR/ pages appear when ready
```

A key reads English, per key, wherever its translation is missing, stale or invalid.

## Publishing

- Translated and current, not reviewed: `/pt-BR/` pages are built for a native speaker to read –
  `noindex`, out of the sitemap, the hreflang links and the English language select.
- After the review, record it: `"@meta": {"name": "…", "reviewed": "Name, 2026-10-12"}`. The pages
  are then indexed, listed in the sitemap and the hreflang group, and offered in the select.
- A reviewed language stays published through later English edits: changed strings read English
  until retranslated (`npm run i18n` lists them). A space it never translated stays English-only.
