# STAFF — Architecture Decomposition Phase 6

Baseline: 0.23.4

Physical extraction:
- Team + Roster interaction wiring -> `src/modules/team/events/teamRosterEvents.js`

Scope deliberately preserves one Team/Roster interaction boundary because settings,
facilities and roster share the active Team identity. Persistence remains in existing
services/repositories and is injected by `appController.js`.

Preserved contracts:
- Team Profile is the canonical team identity;
- facilities use their existing service;
- roster CRUD uses existing roster services;
- player identity remains UUID-aware;
- removal remains soft-delete through the existing domain/service path.

No database, RLS, schema or source-of-truth changes.
