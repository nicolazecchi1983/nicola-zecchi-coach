# STAFF 0.28.6 — Error UX Foundation

## Goal
Centralize user-facing feedback for raw Supabase/network failures after the retry budget is exhausted, without adding more retries or changing workflow semantics.

## Contract
- `dataAccessUserFeedback.js` is the canonical adapter from raw data-access errors to user-safe Italian messages.
- Existing `AppError.userMessage` remains authoritative.
- Raw network/auth/permission/validation/service errors are normalized through the 0.28.3 data-access classifier.
- Pilot integration is limited to Training publish, Match creation, Team Settings save, Roster player save/remove.
- No CREATE/DELETE/BATCH retry policy is broadened in this release.

## Architecture Review
This release deliberately keeps error classification in Infrastructure and passes the formatter from the composition root to UI event modules. Core remains infrastructure-agnostic. UI workflows retain their existing local message surfaces and only change the message source.
