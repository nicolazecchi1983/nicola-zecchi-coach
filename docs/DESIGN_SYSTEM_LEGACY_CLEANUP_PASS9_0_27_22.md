# STAFF 0.27.22 — Design System Legacy Cleanup Pass 9

## Scope
Roster and Player Profile ownership cleanup only. No domain, persistence, Supabase or workflow behavior changes.

## Ownership after cleanup
- `src/modules/roster/roster.css`: roster grid/cards, roster forms, Player Profile content and roster-specific mobile adaptation.
- `src/design-system/overlays.css`: shared modal/backdrop/header/footer shell.
- `src/style.css`: no longer owns roster cards or Player Profile geometry.

## Removed debt
- Initial ROSA card block from `style.css`.
- Historical Player Profile generations V6.3, V6.3.1, V6.3.5, V6.3.6 and V6.3.7.
- Repeated Player Profile mobile overrides and their `!important` chain.
- Unused legacy `.player-card--button` styling.
- TEAM & ROSTER FOUNDATION visual rules moved to the domain owner.

## Guardrail
`check:design-system-legacy-cleanup-pass9` fails if roster ownership returns to `style.css`, if the shared modal shell leaks into the roster owner, or if Player Profile reintroduces `!important` overrides.
