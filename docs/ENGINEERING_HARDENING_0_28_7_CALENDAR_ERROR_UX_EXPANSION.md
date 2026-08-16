# STAFF 0.28.7 — Calendar Error UX Expansion

## Goal
Extend the 0.28.6 centralized data-access feedback foundation to the Calendar write surfaces that still exposed raw Supabase/network messages.

## Covered flows
- Create Calendar event.
- Update Calendar event.
- Delete Calendar event.
- Season calendar import commit.
- Calendar bulk delete commit.

## Contract
- `dataAccessUserFeedback.js` remains the single canonical adapter for user-facing data-access errors.
- Existing `AppError.userMessage` remains authoritative.
- Calendar event validation messages remain local and unchanged.
- No retry policy is broadened. CREATE, DELETE and BATCH operations remain non-retried unless separately reviewed for idempotency.
- Persistence, event schema, Calendar workflow, Match/Training linking and permissions are unchanged.

## Architecture Review
`calendarRuntimeActions.js` receives the formatter by dependency injection from `appController.js`, matching the 0.28.6 composition-root pattern. This removes raw infrastructure messages from the Calendar UI without coupling the Calendar module directly to Infrastructure.

## Regression guard
`check:error-ux-calendar-expansion` verifies all five Calendar stages, composition-root injection, removal of the prior raw error strings, and registration inside `npm run check`.
