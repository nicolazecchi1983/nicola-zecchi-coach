# STAFF 0.27.42 — Design System Legacy Cleanup Pass 29

## Scope
Final residual audit, low-risk ownership cleanup only. No functional changes.

## Changes
- Retired unused V5 Dashboard/Analysis presentation selectors from `src/style.css`.
- Moved shared empty-state geometry (`.placeholder-panel`) to `src/design-system/surfaces.css`.
- Created `src/modules/settings/settingsHub.css` as canonical owner of the Settings landing page.
- Created `src/modules/calendar/calendarBulkManagement.css` as canonical owner of Calendar bulk-management presentation.
- Preserved import order immediately after `style.css` so this pass does not intentionally redesign the UI.

## Explicitly not changed
- Match print rules.
- Match token/formation styling.
- Global viewport safety rules.
- Runtime/domain/Supabase behavior.

## Result
`src/style.css`: 1390 -> 1188 lines.

This pass marks the transition from broad domain extraction to final residual classification. Remaining legacy rules should be changed only with a concrete owner/risk rationale.
