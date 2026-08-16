# STAFF 0.29.37 — Navigation Simplification

## Scope
- Remove **Board** and **Metodologia** from the active desktop sidebar and mobile drawer.
- Freeze both product sections without deleting their implementation/history.
- Preserve **Rosa** and **Impostazioni** as the management entries.
- Keep the sidebar reachability contract: no visible scrollbar chrome in normal use, with vertical scrolling retained as a safety fallback on genuinely short viewports.

## Product contract
`Board` and `Metodologia` are now **frozen / inactive product sections**.

This means:
- they are not rendered as normal navigation destinations;
- role/capability access cannot open them through the normal workspace engine;
- stale restored navigation falls back to an available section;
- existing Board implementation remains in the repository so it can be revived intentionally in a future release.

## Architecture
- `appNavigation.js` owns visible desktop/mobile destinations.
- `accessControl.js` owns the explicit frozen-section deny contract.
- `appShell.css` continues to own desktop sidebar height/overflow behavior.
- No Board source files are deleted in this release.

## Regression guard
- `check:navigation-simplification-0-29-37`
