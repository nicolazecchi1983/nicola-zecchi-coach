# STAFF 0.27.34 — Design System Legacy Cleanup Pass 21

## Scope
Match residual ownership consolidation, without functional changes.

## Changes
- Migrated legacy Match Workspace presentation from `src/style.css` to `src/modules/match/workspace/matchWorkspace.css`.
- Consolidated A.13.5/A.13.6 Match context header/back-button geometry into the canonical workspace owner.
- Removed duplicated native Match compatibility geometry from the legacy stylesheet; canonical workspace shell remains the owner.
- Migrated Match Statistics A.14 presentation to `src/modules/match/ui/matchStatistics.css`.
- Migrated remaining B2.2/B2.3/M2.0 Match Workspace tab/header presentation, including the 760px tab layout.
- Added `check:design-system-legacy-cleanup-pass21` to the aggregate gate.

## Out of scope
- Match Sheet legacy editor internals.
- Own-team/opponent token styling.
- Match report print/paper styles.
- Match business logic, persistence, Supabase, workflow or statistics calculations.

## Architecture result
The Match Workspace and Match Statistics no longer depend on `src/style.css` for their page-level presentation ownership. Remaining Match CSS in the monolith is now mostly legacy Match Sheet/report/token-specific work and can be audited separately.
