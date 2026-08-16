# STAFF 0.27.36 — Design System Legacy Cleanup Pass 23

## Scope
Training Editor legacy retirement, first controlled pass.

## Removed from `src/style.css`
- V6.1 legacy two-column parser/editor shell.
- V6.1.1 hidden/result compatibility presentation.
- V6.2 voice/dictation presentation tied to the retired parser UI.
- Dead generic `.secondary-action` declaration embedded in that retired block.

## Why this is safe
The current Training Sheet page is rendered by `trainingSheetEditorPageView.js` as the manual six-step workflow (`.ts-manual-editor`, `.ts-workspace--steps`). It does not render the retired V6.1 parser shell (`.ts-editor-grid`, `.ts-editor-panel`, `[data-ts-narration]`, voice toolbar/buttons).

Current presentation ownership remains:
- `src/design-system/training-editor.css`: Training Editor structural/product presentation.
- `src/modules/training/trainingPolish.css`: DS2.3 visual hierarchy and density.
- `src/modules/training/trainingCommandBar.css`: published-sheet command bar geometry.
- `src/design-system/responsive.css`: final adaptive/mobile owner.

No Training persistence, PDF generation, publish workflow, Supabase access, or event-domain behavior is changed in this pass.
