# STAFF 0.27.15 — Design System Legacy Cleanup Pass 2

Scope: retroactive cleanup of Dashboard CSS after DS2.1 migration.

## Ownership after cleanup
- `src/modules/dashboard/dashboardPolish.css` owns Dashboard structure, surfaces, event hierarchy and mobile agenda.
- `src/style.css` no longer owns Dashboard-specific visual geometry.
- Cross-domain match category rules remain in legacy only for non-Dashboard consumers.

## Removed debt
- V6.3 Dashboard owner and card styling.
- Old compressed 7-column mobile dashboard behavior.
- Legacy Dashboard ghost-button styling.
- V6.3.3 next-match card owner and mobile overrides.
- Dashboard-specific entries in old global overflow helpers.

No domain, state, persistence, Supabase, routing or event behavior changed.
