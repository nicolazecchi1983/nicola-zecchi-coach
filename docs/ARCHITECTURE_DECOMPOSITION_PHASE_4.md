# STAFF — Architecture Decomposition Phase 4
Baseline: 0.23.2

Physical extraction:
- Callups events -> modules/match/events/callupsEvents.js
- Tactical Board events -> modules/board/events/boardEvents.js

The validated event behavior was moved rather than redesigned.
Calendar remains isolated for the next release because it combines navigation,
editing, persistence and season import.

No database, RLS, repository or source-of-truth changes.
