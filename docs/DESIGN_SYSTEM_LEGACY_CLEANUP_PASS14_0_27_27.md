# STAFF 0.27.27 — Design System Legacy Cleanup Pass 14

## Scope
Match Analysis ownership consolidation only. No domain, persistence, Supabase, workflow or product behavior changes.

## Ownership result
- `src/modules/match/ui/matchAnalysis.css`: analysis page/list, lifecycle form/archive, configurable schema editor, template apply toolbar, shared width contract and analysis-specific responsive rules.
- `src/modules/match/ui/analysisTemplateManager.css`: remains the owner of the Template Manager overlay only.
- `src/style.css`: no longer owns active Match Analysis/schema/template-toolbar selectors.

## Architecture rationale
Analysis presentation was split across V5.6, A.13.1, M2.0 and 0.20.x blocks in the legacy monolith. This pass moves the existing cascade into one domain owner while preserving declaration order and behavior, so later visual consolidation can happen inside one bounded file instead of through global overrides.

## Guardrail
`check:design-system-legacy-cleanup-pass14` prevents the active analysis selectors from returning to `style.css` and verifies the owner/import boundary.
