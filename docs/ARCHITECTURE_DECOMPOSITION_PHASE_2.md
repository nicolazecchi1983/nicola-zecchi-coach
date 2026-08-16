# STAFF — Architecture Decomposition Phase 2

Baseline: 0.23.0

## Objective

Complete the internal segmentation of `bindDynamic()` before moving event handlers to module files.

This phase changes ownership visibility, not product behavior.

## Explicit dynamic boundaries

`bindDynamic()` now orchestrates these named domains:

- wireMatchLibraryEvents
- wireOpponentStudyEvents
- wireMatchWorkspaceEvents
- wireTeamAndRosterEvents
- wireCallupsEvents
- wireBoardEvents
- wireLegacyMatchEditorEvents
- wireTrainingEditorEvents
- wireCalendarEvents
- wireProfileEvents
- wireMatchAnalysisEvents
- wireStaffEvents
- wireTrainingDraftAndVoiceEvents
- wirePlayerProfileEvents
- wireDashboardEvents
- wireTrainingLibraryEvents

The global shell remains separated into:

- wireGlobalNavigationEvents
- wireGlobalProfileAndDrawerEvents

## Why these functions remain nested for now

They intentionally stay inside `bindDynamic()` because many handlers still depend on the application composition closure.

Moving them immediately would force broad dependency changes and make it difficult to distinguish:
- architecture improvement;
- accidental behavior changes;
- persistence changes.

The temporary nested functions make hidden module boundaries visible while preserving runtime semantics.

## Physical extraction order

The next phase should extract one domain at a time.

Recommended order from lower to higher risk:

1. Dashboard
2. Profile
3. Training Library
4. Callups
5. Board
6. Calendar
7. Team / Roster
8. Staff
9. Opponent Study / Match Library wiring
10. Match Analysis
11. Training draft / voice
12. Training Editor
13. Legacy Match Editor

Rules:

- do not move multiple high-risk domains in one commit;
- inject dependencies from the app composition root;
- do not import `appState` or Supabase into UI event modules as a shortcut;
- after every extraction run domain regression plus the full pre-build suite;
- add behavioral tests before extracting the largest Training and legacy Match blocks.

## Architectural result

The remaining large size of `appController.js` is now mostly explicit orchestration and domain wiring rather than anonymous mixed behavior.

This is the required intermediate state before safe physical decomposition.
