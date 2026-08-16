# DS2.3 — Training Command Bar Legacy Cleanup

Release: 0.27.13

## Scope
Presentation-only cleanup of the Training Sheet published-document command bar.
No domain, state, persistence, Supabase, PDF, Calendar, or Training workflow changes.

## Canonical ownership
- Desktop/tablet geometry: `src/modules/training/trainingCommandBar.css`
- Mobile geometry: final canonical block in `src/design-system/responsive.css`
- DOM contract: elastic published-sheet selector + indivisible `.ts-command-actions` cluster

## Removed legacy ownership
Command-bar selectors and obsolete variants were removed from:
- `src/style.css`
- `src/design-system/training-editor.css`
- `src/modules/training/trainingPolish.css`
- pre-canonical Training mobile adaptation rules in `src/design-system/responsive.css`

This removes historical definitions of `ts-editor-actions-wrap`, `ts-editor-actions`, `ts-open-sheet`, `ts-open-button`, `ts-draft-state--compact`, and obsolete balanced/full variants outside the canonical owners.

## Guardrail
`check:training-command-bar-legacy-cleanup` fails if legacy layers regain ownership of the command bar.
