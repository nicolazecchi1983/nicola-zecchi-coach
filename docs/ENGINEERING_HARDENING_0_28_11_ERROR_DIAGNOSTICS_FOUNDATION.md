# STAFF 0.28.11 — Error Diagnostics Foundation

## Goal
Close the Error UX hardening track with a minimal diagnostic trail for failures that are intentionally hidden behind safe user-facing messages.

## Scope
- Added `reportDataAccessDiagnostic(error, { stage, logger })` to the canonical data-access feedback adapter.
- Every `getDataAccessUserMessage(...)` call now emits one normalized diagnostic before returning the safe user-facing message.
- Diagnostics include: stage, classified data-access code, retryability, HTTP status, source code and a bounded technical message.
- Default sink is `console.error`; the logger is injectable so a future observability service can be connected without migrating feature call sites.
- Diagnostic failures are swallowed and can never break the Error UX path.
- Added `check:error-diagnostics-foundation` to the aggregate release gate.

## Architecture Review
Diagnostics remain inside the existing infrastructure/data-access boundary. Feature modules do not import or own logging infrastructure, and no external telemetry dependency is introduced. The UI remains protected by the 0.28.9 raw-error exposure guard and the 0.28.10 centralized stage fallbacks.

## Out of scope
- No Sentry or external telemetry service.
- No analytics, remote logging or persistence of error payloads.
- No retry-policy changes.
- No schema, workflow, route, permission or visual changes.

## Track closure
0.28.11 closes the planned Error UX / data-access hardening sequence. The next development track returns to structured UI/UX work on top of the stabilized Design System baseline.
