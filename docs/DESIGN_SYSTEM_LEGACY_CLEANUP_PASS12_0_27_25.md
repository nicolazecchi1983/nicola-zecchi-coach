# STAFF 0.27.25 — Design System Legacy Cleanup Pass 12

## Scope
Profile ownership and shared form-control consolidation only. No domain logic, persistence, Supabase, authentication or workflow behavior changed.

## Changes
- Added `src/modules/profile/profile.css` as the Profile page-specific layout owner.
- Removed Profile layout/avatar/card geometry from `src/style.css`.
- Consolidated generic `.form-field` stack and `.form-message` feedback states into `src/design-system/controls.css`.
- Removed duplicate legacy `.form-field input/select/textarea` and feedback-state owners from `src/style.css`.
- Preserved shared surface ownership in `surfaces.css` and typography ownership in `typographyDensity.css`.
- Added `check:design-system-legacy-cleanup-pass12` to the aggregate gate.

## Ownership contract
- `profile.css`: Profile page layout and avatar only.
- `controls.css`: shared field stacks, controls and feedback.
- `surfaces.css`: shared Profile card surface.
- `typographyDensity.css`: shared Profile heading density.
- `style.css`: no Profile or generic form-control ownership.
