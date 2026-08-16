# Architecture Decomposition Phase 20

## Goal
Move Roster and Player Profile modal presentation out of `appController.js` while preserving the existing Team/Roster and Player Profile event owners and persistence flows.

## Ownership
- `src/modules/roster/ui/rosterModalViews.js` owns the modal markup for creating/editing roster players and editing persistent player profiles.
- `src/modules/team/events/teamRosterEvents.js` remains the Team/Roster interaction owner.
- `src/modules/roster/events/playerProfileEvents.js` remains the Player Profile interaction owner.
- `src/app/appController.js` composes the view factory and injects identity/state dependencies.

## Architectural effect
The application composition root no longer embeds Roster-specific HTML. Roster presentation now lives beside the Roster domain, while persistence and runtime behavior remain unchanged.

## Scope guard
No database, Supabase, player identity, soft-delete, roster persistence, Match/Training behavior, routes, or visual redesign changes are introduced in this phase.
