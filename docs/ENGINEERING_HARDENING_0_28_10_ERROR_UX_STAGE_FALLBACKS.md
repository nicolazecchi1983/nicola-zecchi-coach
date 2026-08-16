# STAFF 0.28.10 — Error UX Stage Fallback Centralization

## Goal
Consolidate the user-facing fallback text introduced during 0.28.6–0.28.9 so migrated data-access flows no longer duplicate fallback strings at each UI call site.

## Scope
- Added canonical `DATA_ACCESS_USER_FALLBACKS` map in `dataAccessUserFeedback.js`.
- Added `getDataAccessUserFallback(stage)` resolver with a safe generic fallback for unknown stages.
- Migrated existing Error UX call sites in Calendar, Staff, Roster, Training and Match to resolve fallback text from `stage`.
- Kept the explicit fallback argument supported for backward compatibility and focused legacy tests.
- Added `check-error-ux-stage-fallbacks.mjs` to prevent new staged call sites from reintroducing inline literal fallbacks.

## Architecture Review
Presentation remains owned by each feature module. Only stable failure-copy ownership moves to the existing data-access user-feedback adapter. Existing `AppError.userMessage` remains authoritative, classifier messages still win for recognized network/auth/permission/transient failures, and the stage fallback is used only when no stronger user-safe message exists.

## Out of scope
- No telemetry or external observability service.
- No retry-policy changes.
- No persistence, schema, workflow, route or permission changes.
