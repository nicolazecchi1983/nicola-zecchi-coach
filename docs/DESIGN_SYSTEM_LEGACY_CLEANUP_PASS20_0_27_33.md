# STAFF 0.27.33 — Design System Legacy Cleanup Pass 20

## Scope
Login/access presentation ownership only.

## Changes
- Extracted Login presentation from `src/style.css` to `src/modules/auth/login.css`.
- Removed duplicate legacy ownership of `.primary-button` / `.primary-action` from `style.css`; shared buttons remain owned by `src/design-system/controls.css`.
- Added a regression guard preventing Login selectors from returning to the monolith.

## Out of scope
No authentication logic, Supabase, permissions, routing, form behavior or product redesign changed.
