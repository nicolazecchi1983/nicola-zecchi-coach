# STAFF 0.29.35 — Sidebar scrollbar + Opponent pitch SVG isolation

## Scope
- Keep sidebar and mobile drawer navigation scrollable while hiding the visual scrollbar track.
- Give each Match pitch instance a unique SVG clip-path namespace.

## Root causes
1. Sidebar explicitly requested `scrollbar-width: thin` and `scrollbar-gutter: stable`, so the bar was part of the rendered chrome.
2. Own-team and opponent SVGs reused the same `clipPath` IDs. SVG fragment IDs are document-scoped; duplicate IDs could make the opponent penalty arcs resolve incorrectly and appear as complete circles.

## Architecture
- `appShell.css` owns desktop sidebar reachability and hidden scrollbar presentation.
- `responsive.css` owns the same contract for the mobile drawer.
- `matchPitchMarkup.js` remains the single pitch geometry owner, but receives an instance prefix from each consumer.
- New release guard: `check:ui-regression-0-29-35`.
