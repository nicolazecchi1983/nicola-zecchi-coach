# STAFF 0.27.31 — Design System Legacy Cleanup Pass 18

## Scope
Convocazioni UI ownership only. No workflow, PDF generation, roster state, Match data, or Supabase behavior changed.

## Change
- Added `src/modules/match/ui/callups.css` as the domain owner for Convocazioni presentation.
- Removed Convocazioni selectors from `src/style.css`.
- Preserved the existing cascade: domain baseline loads immediately after legacy CSS; shared Controls/Surfaces and final Responsive remain later owners of cross-cutting behavior.
- Board and Match Sheet styles were intentionally left untouched.

## Guardrail
`check:design-system-legacy-cleanup-pass18` prevents Convocazioni ownership from returning to the monolithic stylesheet and verifies the domain/shared-layer boundary.
