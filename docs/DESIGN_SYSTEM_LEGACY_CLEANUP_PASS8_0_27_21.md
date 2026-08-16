# STAFF 0.27.21 — Design System Legacy Cleanup Pass 8

## Scope
Training Library ownership consolidation only. No domain, persistence, Supabase, or workflow behavior changes.

## Change
Training Library CSS was split across three legacy generations inside `src/style.css`: original library tree, B1.4 technical-memory/feedback expansion, and later compact filter-menu rules. These rules now live in one domain owner: `src/modules/training/trainingLibrary.css`.

The owner is loaded before shared `surfaces.css` and `typographyDensity.css`, preserving the existing Design System cascade: domain geometry first, shared visual primitives afterward.

## Guardrail
`check:design-system-legacy-cleanup-pass8` fails if Training Library ownership returns to `style.css` or if the canonical owner/import disappears.

## Architecture review
This reduces cascade ambiguity and gives Training Library a single discoverable place for future adaptive/polish work. Legacy breakpoint values were intentionally preserved in this cleanup pass to avoid visual behavior changes; breakpoint normalization is a separate UI change, not cleanup.
