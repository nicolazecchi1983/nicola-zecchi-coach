# STAFF 0.27.35 — Design System Legacy Cleanup Pass 22

## Scope
Legacy Match Sheet compatibility presentation ownership cleanup, without functional changes.

## Changes
- Removed the historical V6.4.1–V6.4.7.2 Match Sheet presentation chain from `src/style.css`.
- Preserved Training watermark rules in their existing Training/legacy location instead of moving unrelated Training CSS into Match ownership.
- Localized the still-required legacy Match Sheet compatibility presentation at the beginning of `src/modules/match/ui/matchSheet.css`.
- Kept the migrated compatibility layer before the canonical Match Sheet rules so the existing cascade priority remains unchanged.
- Kept `matchSquad.css` and `matchOpponentStudy.css` as separate canonical owners for their current native sections.
- Added `check:design-system-legacy-cleanup-pass22` to the aggregate gate.

## Architecture result
`src/style.css` no longer owns the historical V6.4 Match Sheet generations. The remaining compatibility presentation is now confined to the Match domain, while current squad and opponent sections retain their dedicated owners.

## Out of scope
- Match business logic, persistence, Supabase or report generation.
- Training Editor cleanup.
- Full semantic consolidation of every historical selector inside `matchSheet.css`; this pass first removes cross-domain ownership from the global monolith while preserving validated behavior.
