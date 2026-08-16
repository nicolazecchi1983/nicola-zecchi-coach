# STAFF 0.27.38 — Design System Legacy Cleanup Pass 25

## Scope
Training Flow / Workflow residual ownership consolidation.

## Changes
- Migrated A.13.3–A.13.4-R2 Training step workflow presentation from `src/style.css` to `src/design-system/training-editor.css`.
- Migrated B1.2 Training document state/archive presentation to the Training owner.
- Migrated Training Sheet brand-logo presentation to the Training owner.
- Preserved Match footer rules in the Match/global compatibility layer instead of moving them into Training.
- Preserved load order: compatibility rules remain before R20 canonical Training passes.
- No Training data, publish, preview generation, PDF generation, Supabase or workflow logic changed.

## Guardrail
`check:design-system-legacy-cleanup-pass25` prevents these Training owners from returning to `style.css`.
