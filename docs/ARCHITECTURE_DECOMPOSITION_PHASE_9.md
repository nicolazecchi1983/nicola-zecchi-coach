# STAFF — Architecture Decomposition Phase 9
Baseline: 0.23.7

Physical extraction:
- Match Library interaction wiring -> modules/match/events/matchLibraryEvents.js

Preserved create/open from Calendar, create-new Match, search/filtering,
active Match state, workspace navigation and deletion.
No database, RLS, repository or source-of-truth changes.
