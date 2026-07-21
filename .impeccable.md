# color-space — design context

## Design Context

### Users
Everyone on the ladder, in one view: students and the curious (learning what color spaces
are — history, lore, intuition), designers and explorers (browsing and comparing spaces),
color scientists and colorists (verifying a formula, a white point, a range — citations
matter), and JS developers (picking a space, grabbing the conversion). No surface may serve
one rung by shutting out another: lore sits next to formula, intuition next to citation,
API next to reference. The moment of use is consultation — a person arrives with a question
about a specific space and must leave with the exact answer and a reason to trust it.

### Brand Personality
**Quiet authority.** A well-set reference book: dense, exact, calm. Trust comes from
typography and rigor, not decoration. No marketing voice, no hype, no ornament that
doesn't carry information. The page never raises its voice; it is simply right.

### Aesthetic Direction
The **current atlas theme is canonical**: Inter (`--f`), cool paper, slate ink, fixed
coral signal (`--c`), OKLCH tokens throughout (`web/tokens.css`). The "Almanac" concept
(Hanken Grotesk/Newsreader, slate accent) remains a token-level experiment — new work
matches the atlas, not the Almanac. Light and dark themes both first-class.
Anti-references: developer-tool SaaS landing pages, dark-neon "technical" aesthetics,
card-grid genericism, decorative glassmorphism. The existing consistency agreements in
`CLAUDE.md` (tokens only, established idioms: `↗`, dim→ink hover, `.tag`, `.diamond`;
no text-shadow; CSS over JS) are part of this direction and override improvisation.

### Design Principles
1. **Rigor is the aesthetic.** Density, exactness, and citation build the visual voice;
   every element earns its place by carrying information. When in doubt, set it like a
   reference book would.
2. **Color is content, chrome is neutral.** Swatches, planes, and gradients are the data.
   The surrounding UI stays paper/ink/slate so sample colors are never contaminated;
   coral is a signal, spent sparingly.
3. **One page, every rung.** Progressive depth — a student, a designer, a scientist, and
   a developer all find their layer without any layer being hidden behind another's jargon.
4. **Consistency over novelty.** Reuse tokens, components, and idioms before inventing;
   a new element must read as the same book, not a new cousin (see CLAUDE.md working
   agreements — they are binding).
5. **AA + reduced motion.** WCAG AA contrast for all text and UI, honor
   `prefers-reduced-motion`, full keyboard lifecycle (focus visible, escape closes,
   tab order sane). Swatches are content — exempt from contrast rules, always labeled.
