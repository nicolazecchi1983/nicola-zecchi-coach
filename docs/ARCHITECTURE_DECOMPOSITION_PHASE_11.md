# STAFF — Architecture Decomposition Phase 11

Baseline: 0.23.9

Physical extraction:
- Match Analysis interaction wiring -> `src/modules/match/events/matchAnalysisEvents.js`

Preserved:
- analysis schema editing;
- local analysis save state;
- Match Report generation and publication;
- Match section navigation;
- CSV import into match_analysis;
- analysis search/filtering.

All dependencies are injected by `appController.js`.
Supabase remains injected for the existing CSV import path; no new direct import or repository duplication was introduced.

No database schema, RLS or source-of-truth changes.
