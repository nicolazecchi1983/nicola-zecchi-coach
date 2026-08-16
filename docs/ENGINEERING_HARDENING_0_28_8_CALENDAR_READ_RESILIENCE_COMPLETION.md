# STAFF 0.28.8 — Calendar Read Resilience Completion

## Goal
Complete the Calendar hardening track by applying the existing safe READ retry policy and centralized user feedback to the canonical Calendar read path.

## Covered reads
- Calendar event list (`listCalendarEvents`).
- Single Calendar event read (`getCalendarEvent`).
- Top-level Calendar load feedback in the composition root.

## Retry contract
- Both repository-facing reads are idempotent and use the existing `DATA_OPERATION_KIND.READ` policy.
- Retry remains bounded by the shared foundation (maximum 2 retries after the first attempt, transient categories only).
- No CREATE, UPDATE, DELETE, import or bulk operation gains automatic retry in this release.
- The training duplicate-slot preflight query is intentionally unchanged because it belongs to a write workflow and requires a separate workflow-level audit before any retry expansion.

## Error UX contract
- The top-level Calendar loader no longer exposes raw `Supabase`/network messages through `alert`.
- `getDataAccessUserMessage` remains the canonical adapter and preserves `AppError.userMessage` when present.

## Non-scope
- No schema or persistence changes.
- No offline mode or cache.
- No Calendar workflow/UI redesign.
- No retry-policy changes.

## Architecture review
The Calendar service depends only on the shared data-access retry foundation already introduced in 0.28.3/0.28.4. The composition root remains responsible for translating exhausted data-access failures into user-safe feedback.
