# STAFF 0.27.23 — Design System Legacy Cleanup Pass 10

## Scope
Retroactive ownership cleanup for Staff Management. No domain, Supabase, persistence, permission or workflow changes.

## Ownership
- `src/modules/staff/staffManagement.css`: staff profile grid, staff list/cards, create-user UI, access badges and staff-specific responsive behavior.
- `src/design-system/controls.css`: shared `.danger-button` interaction language.
- `src/design-system/responsive.css`: final narrow-device adaptation remains authoritative.

## Legacy removed
Removed duplicated Staff Management owners from `src/style.css`, including V5.5.8 and Release A.2–A.4 staff-specific rules. Generic form and team-settings rules were intentionally retained with their current owners.

## Result
- `src/style.css`: 5123 -> 4944 lines.
- Staff Management now has a named domain owner.
- Shared danger action is canonicalized in Design System controls.
- No new `!important` in Staff Management; hidden state no longer requires it.

## Regression
- `check:design-system-legacy-cleanup-pass10`: 12/12.
- 149/149 standalone `check-*.mjs` scripts pass.
- Syntax: OK.
- Architecture: OK.
- Local Vite build not executed because the extracted validation workspace does not contain `node_modules/.bin/vite`; Launcher V3 remains the full environment gate.
