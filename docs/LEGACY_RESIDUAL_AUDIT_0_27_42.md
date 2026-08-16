# STAFF 0.27.42 — Legacy Residual Audit

## Executive result
The global legacy stylesheet has been reduced from the initial audit baseline of ~8,333 lines to ~1,003 lines without a broad visual redesign.

Current residual metrics:
- `src/style.css`: ~1,003 lines
- `!important`: 132
- media queries: 17
- all 168 `check-*.mjs` scripts pass after Pass 29

## Classification

### A — Keep intentionally in global/core for now
These rules are active, cross-cutting or print-sensitive and should not be moved merely to reduce line count:
- root aliases/reset/base viewport safety
- print isolation for Match report
- access guard notice
- global width/overflow safety still protecting legacy view composition

### B — Normalize only when the owning feature is next touched
These are active domain rules but further movement now has lower benefit/risk than the previous cleanup passes:
- Calendar Training Sheet detail/readable drawer fragments
- Match game-data controls and icon/input composition
- Match token palettes, leadership controls and formation toolbar refinements
- opponent color-picker refinements

They should be migrated as part of the next functional/UI work on those exact components, preserving structure-before-polish.

### C — Retired in Pass 29
Removed rather than migrated because no current runtime markup owns them:
- old Dashboard stats/timeline/activity V5 presentation
- old Analysis cards/video placeholder V5 presentation
- obsolete responsive rules tied to those retired layouts

### D — Canonical owners created in Pass 29
- Settings landing page -> `src/modules/settings/settingsHub.css`
- Calendar bulk management -> `src/modules/calendar/calendarBulkManagement.css`
- shared empty-state geometry -> `src/design-system/surfaces.css`

## Decision
Broad legacy cleanup should stop after this pass unless a concrete owner conflict is discovered. Further CSS movement should be feature-driven, not line-count-driven. The remaining legacy file is now primarily a compatibility/core layer rather than the main presentation owner of the portal.
