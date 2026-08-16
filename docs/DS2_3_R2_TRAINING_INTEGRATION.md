# STAFF 0.27.9-R2 — DS2.3 Training Integration

Scope: presentational Training Sheet Editor corrections only.

## Visual issues closed

- Removed `product-surface` ownership from Training step wrappers. Step wrappers are structural; inner operational blocks own visible surfaces.
- Stabilized published Training Sheet command area across desktop/mobile.
- Draft status is part of the command group and lives below mobile actions; it cannot overlap `Apri TS` or More.
- Added a Training-specific mobile page-title size through a Design System custom property, without changing other product pages.
- Match Day selector now exposes `Nessuno` explicitly instead of an ambiguous dash, keeps all nine choices in one desktop grid, and preserves the existing domain values/hooks.
- `PREPARAZIONE` remains a normal operational choice, with compact typography rather than a special decorative treatment.

## Out of scope

No changes to Training domain, persistence, Supabase, PDF generation, Calendar linkage, autosave, or navigation behavior.

## Regression protection

`check:ds2-3-r2-training-integration` protects the wrapper ownership, command layout, mobile status placement, title token and Match Day presentation contract.
