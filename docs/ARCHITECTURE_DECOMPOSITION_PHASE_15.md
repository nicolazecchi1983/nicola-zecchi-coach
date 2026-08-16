# Architecture Decomposition Phase 15 — Legacy Match Editor Event Ownership

## Scope
Phase 15 physically extracts the remaining high-risk nested Legacy Match Editor event boundary from `src/app/appController.js` into `src/modules/match/events/legacyMatchEditorEvents.js`.

`appController.js` remains the composition root: it resolves application/session dependencies and injects them into the Match-owned event module. The extraction changes ownership, not domain behavior.

## Preserved contracts
- five-step compatibility editor navigation
- formation/custom formation and pitch token positioning
- starter selection, jersey numbers, captain and vice-captain
- fixed nine-slot bench (12–20) and structural 20-player cap
- substitutions, goals and cards
- opponent formations and opponent token dragging
- match analysis schema binding
- draft persistence and hydration
- Match Report rendering, Calendar publish and print

## Dependency direction
The Match event owner receives storage, app state, calendar actions, report services and team/roster resolvers through dependency injection. It does not import Supabase, repositories, `appStateStore`, or Calendar persistence directly.

## Architecture result
Training Editor and Legacy Match Editor are now both physically extracted from the controller. The controller is substantially smaller and its remaining responsibility is orchestration/composition rather than owning the two largest editor runtimes.

## Next review
Before any further extraction, validate the complete regression suite and Launcher runtime. The next architecture pass should inventory the remaining modal/calendar orchestration in `appController.js` and select one cohesive owner at a time; do not combine unrelated domains in one release.
