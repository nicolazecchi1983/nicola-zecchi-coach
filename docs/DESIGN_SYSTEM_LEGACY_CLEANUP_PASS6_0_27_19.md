# STAFF 0.27.19 — Design System Legacy Cleanup Pass 6

## Scope
Retroactive cleanup of Calendar rules already migrated to `src/modules/calendar/calendarPolish.css`.

## Removed from legacy `src/style.css`
- V5.1 calendar event/category visual ownership now covered by Calendar Polish.
- V5.5/V5.5.1 toolbar and Today-button geometry/visual overrides.
- V6.3.x event detail/category overrides already superseded by neutral Calendar Polish surfaces.
- R19.2 actions-menu popup visual ownership.

## Canonical ownership
- `calendarPolish.css` owns calendar toolbar, Today action, event presentation, actions-menu shell/popup and responsive calendar adaptation.
- `style.css` retains Calendar domain-specific bulk-management and season-import content not yet migrated.

## Guardrail
`check:design-system-legacy-cleanup-pass6` prevents the removed Calendar owners from returning to `style.css`.
