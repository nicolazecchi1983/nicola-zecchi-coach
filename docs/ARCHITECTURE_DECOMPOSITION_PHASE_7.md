# STAFF — Architecture Decomposition Phase 7

Baseline: 0.23.5

Physical extraction:
- Opponent Study interaction wiring -> modules/match/events/opponentStudyEvents.js
- Player Profile interaction wiring -> modules/roster/events/playerProfileEvents.js

Both boundaries were selected after a fresh risk/dependency map of the remaining controller.
They are small, service-backed, and do not own database access.

Preserved:
- Opponent Study event-service flow and refresh;
- UUID-aware player identity;
- legacy player-profile key compatibility;
- existing profile save service.

No DB, RLS, schema or source-of-truth changes.
