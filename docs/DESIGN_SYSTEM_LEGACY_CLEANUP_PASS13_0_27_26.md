# STAFF 0.27.26 — Design System Legacy Cleanup Pass 13

## Scope
Match Library CSS ownership only. No domain, persistence, Supabase, workflow or feature changes.

## Problem
Match Library presentation was still distributed across multiple historical generations in `style.css` (A.12, B2.3-R2, B2.4-R18, M1.3H and M2.0). Later generations relied on `!important` to override earlier geometry and colors.

## Resolution
- Added canonical owner `src/modules/match/ui/matchLibrary.css`.
- Consolidated the final dark SaaS Match Library presentation and monthly grouping into one module owner.
- Removed all `.match-library*` selectors from legacy `src/style.css`.
- Removed `!important` escalation from the canonical Match Library owner.
- Kept existing tablet/mobile behavior at 1000/760 px without redesigning the workflow.
- Added `check:design-system-legacy-cleanup-pass13` to the aggregated gate.

## Architecture review
This reduces cascade ambiguity for Match Library and makes future UI changes local to one domain stylesheet. Shared Design System controls/surfaces remain shared owners; Match Library owns only domain-specific geometry and presentation.
