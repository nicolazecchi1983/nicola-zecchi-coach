# STAFF 0.27.41 — Design System Legacy Cleanup Pass 28

## Scope

Final low-risk domain ownership cleanup for Team Facilities, Match Report Workspace, and Post gara presentation. No domain logic, persistence, Supabase, PDF generation, or workflow behavior changed.

## Ownership

- `src/modules/settings/teamSettings.css`: Team Facilities presentation.
- `src/modules/match/ui/matchReportWorkspace.css`: Match Report Workspace baseline.
- `src/modules/match/ui/matchPostMatch.css`: Post gara baseline.
- `src/modules/match/workspace/matchWorkspace.css`: remains the later canonical Match Workspace polish layer.

The Match Report and Post gara owners are intentionally imported before `matchWorkspace.css`, preserving the validated cascade order that previously came from `style.css`.

## Guardrail

`check:design-system-legacy-cleanup-pass28` prevents these three domain owners from returning to `style.css` and verifies import ordering.
