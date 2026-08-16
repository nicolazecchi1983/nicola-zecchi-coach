# Architecture Decomposition Phase 18 — Training Presentation Ownership

## Scope
Phase 18 removes residual Training presentation builders from `appController.js` without changing behavior or persistence.

## New owner
`src/modules/training/ui/trainingPresentationBuilders.js` now owns:
- Training roster projection used by editor/match compatibility flows;
- parsed voice-result markup;
- Calendar drawer Training Sheet preview;
- Calendar drawer structured Training Sheet summary.

## Architecture rule
`appController.js` remains the composition root. Training and Calendar runtimes receive presentation functions by dependency injection. No Supabase access, repository access, or new source of truth is introduced in the presentation owner.

## Compatibility
The existing consumers remain unchanged at the contract level:
- `trainingDraftAndVoiceEvents.js` receives `trainingSheetResultHtml`;
- `trainingEditorEvents.js` and Legacy Match receive `getTrainingSheetRosterPlayers`;
- `calendarEventViewBuilders.js` receives the two Training drawer presentation hooks.
