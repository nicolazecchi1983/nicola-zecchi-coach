# STAFF — Architecture Decomposition Phase 8

Baseline: 0.23.6

Physical extraction:
- Match Workspace event wiring -> modules/match/events/matchWorkspaceEvents.js

Preserved: section navigation (including Statistics), Callups navigation,
Match Report print, Report -> Analysis and Post gara save flow.

All dependencies are injected by appController.js. No database, RLS,
repository or source-of-truth changes.
