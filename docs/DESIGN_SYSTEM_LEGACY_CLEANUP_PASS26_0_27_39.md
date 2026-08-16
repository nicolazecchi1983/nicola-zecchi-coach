# STAFF 0.27.39 — Design System Legacy Cleanup Pass 26

## Scope
Final Training V6.3.x residual ownership consolidation.

## Change
- Moved remaining `.ts-*` V6.3.x editor/preview/watermark rules from `src/style.css` into `src/design-system/training-editor.css`.
- Preserved cascade order by placing the migrated baseline before the Training Flow residual and all R20 canonical passes.
- Left non-Training V6.3 rules in the global legacy file for separate audit instead of mixing Calendar/Match/global shell ownership into Training.
- No workflow, persistence, Supabase, preview generation or PDF logic changes.

## Guardrail
`check:design-system-legacy-cleanup-pass26` prevents Training watermark/session/load/phase ownership from returning to `style.css`.
