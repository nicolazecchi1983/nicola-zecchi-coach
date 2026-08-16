# DS1.6 — Typography & Information Density

## Goal

Use typography, spacing and metadata roles to create hierarchy before color or extra containers. Repeated information becomes easier to scan without shrinking interactive targets.

## Contract

- Page, section, subsection, body, secondary, caption and label roles come from `tokens.css`.
- Supporting copy uses a calmer secondary role and readable line-height.
- Numeric/time-heavy UI uses tabular figures where it improves scanning.
- Match section numbers are context markers, not competing primary cards.
- Repeated resources and metadata become denser through spacing, not smaller controls.
- Tables use a consistent label/body hierarchy.
- Mobile retains the canonical 760px breakpoint and 44/48px control contract.
- `typographyDensity.css` introduces no raw palette, `!important`, or new breakpoints.

## Benchmark rationale

Material 3 treats typography as named roles (headline/title/label/body) rather than arbitrary per-screen sizes. Apple recommends consistent text styles to create a clear hierarchy. WCAG 2.2 text-spacing guidance requires content to remain usable when users increase line, paragraph, letter and word spacing, so this layer avoids clipped supporting copy and fixed-height text containers.

## Ownership

`tokens.css` owns type metrics. `typographyDensity.css` applies semantic typography and density across existing product/domain markup. Domain CSS should only override when the football-specific visualization requires it.
