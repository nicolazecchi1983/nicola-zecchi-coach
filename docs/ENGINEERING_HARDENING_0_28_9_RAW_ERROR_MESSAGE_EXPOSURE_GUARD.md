# STAFF 0.28.9 — Raw Error Message Exposure Guard

## Goal
Complete the focused Error UX audit started in 0.28.6–0.28.8 by removing remaining direct `error.message` exposure from user-facing UI sinks and making the rule regression-safe.

## Scope
- Audited direct `error.message` / `error?.message` use in user-visible sinks only.
- Migrated residual Staff, Player Profile, Training, Match and Calendar surfaces to `getDataAccessUserMessage`.
- Console diagnostics, internal classification and wrapped service errors remain untouched because they are not rendered directly to users.
- Added `check-raw-error-message-exposure.mjs` to the canonical `npm run check` pipeline.

## Architecture Review
This is not a general error-handling refactor. Existing local UI surfaces remain owners of presentation; only the source of user-visible failure text is normalized. Unknown raw errors resolve to the local fallback while existing `AppError.userMessage` remains authoritative. No retry, persistence, schema, workflow or permission behavior changes.

## Deferred deliberately
- A central `stage -> fallback` dictionary is deferred until duplication is measurable across a larger migrated surface.
- Telemetry/Sentry-style reporting is deferred as a separate observability concern; existing console diagnostics are not removed.
