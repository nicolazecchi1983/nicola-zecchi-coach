# Architecture Decomposition Phase 19

## Goal
Move the remaining Legacy Match compatibility presentation out of `appController.js` without changing Match persistence, runtime wiring, routes, or user-facing workflow.

## Ownership
- `src/modules/match/ui/legacyMatchCompatibilityView.js` owns the compatibility-only Match markup and score control markup.
- `src/modules/match/events/legacyMatchEditorEvents.js` remains the runtime/event owner.
- `src/app/appController.js` remains the composition root and injects access, active-match context, team identity, current-user identity, roster projection, and escaping.

## Architectural effect
This removes a Match-specific presentation island from the application composition root. The controller no longer knows the internal HTML structure of the compatibility editor, while the Match module still receives all application context explicitly.

## Scope guard
No database, Supabase, persistence, Match workflow, navigation, formation behavior, squad state, or visual redesign is introduced in this phase.
