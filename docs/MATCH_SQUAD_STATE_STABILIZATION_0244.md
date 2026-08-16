# STAFF 0.24.4 — Match Squad State Stabilization

Baseline: 0.24.3, manually validated after the rejected 0.24.2 extraction.

## Domain contract

The match squad is one coherent state:

Roster -> match list (max 20) -> Starting XI + Bench -> match shirt numbers -> Captain/Vice -> Pitch positions.

## Fixes

- Bench is no longer one-way automatic:
  - players may be excluded;
  - when the list falls below 20, excluded players can be added back.
- Bench shirt numbers are visible and editable.
- Bench shirt numbers persist independently from the roster master number and survive remove/re-add/reload.
- Captain and vice are restored only after the starting-XI select options are rebuilt.
- Captain/Vice changes are saved immediately to avoid navigation timing races.

## Single source of truth

Roster identity remains the canonical player identity.
Match shirt numbers are match-specific fields and do not mutate the Roster.
The list cap remains 20.

## Scope deliberately excluded

No decomposition/refactoring extraction is performed in this release.
Formation, token dragging, Match Workspace navigation, database schema and RLS are unchanged.
