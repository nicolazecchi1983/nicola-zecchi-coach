# STAFF 0.27.37 — Design System Legacy Cleanup Pass 24

## Scope
Training Editor active baseline and preview ownership consolidation.

## Changes
- Removed the V6.2–V6.2.5 active Training Editor/preview/print baseline from global `src/style.css`.
- Consolidated that validated baseline at the beginning of `src/design-system/training-editor.css`, before the newer canonical Training rules so cascade priority remains intentional.
- Kept `trainingPolish.css`, `trainingCommandBar.css`, and final `responsive.css` as later presentation owners.
- Moved the unrelated `.squad-departments` roster layout to `src/modules/roster/roster.css` instead of contaminating the Training owner.
- No Training workflow, repository, publish, Supabase, PDF generation JavaScript, or event logic changed.

## Architecture result
`style.css` no longer owns the V6.2 active Training editor shell, fields, preview paper, print contract, or PDF confirmation overlay. The remaining Training legacy can now be audited as later refinements instead of a second complete editor implementation.

## Guardrail
`check:design-system-legacy-cleanup-pass24` prevents the retired V6.2 base ownership from returning to `style.css` and verifies stylesheet order.
