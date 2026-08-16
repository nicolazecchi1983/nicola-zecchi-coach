# STAFF — Architecture Decomposition Phase 14

Baseline: 0.25.1 validated via STAFF Launcher

Physical extraction:
- Training Sheet manual editor event/runtime wiring;
- Training Sheet step navigation and autosave;
- phase editor and split/parallel-work behavior;
- Training Sheet preview rendering and responsive fitting;
- publish/relink/update Calendar workflow;
- opening and restoring published/historical Training Sheets.

New owner:
- `src/modules/training/events/trainingEditorEvents.js`

Architecture rules preserved:
- `appController.js` remains the composition root;
- Training Editor dependencies are injected explicitly by the controller;
- the extracted module does not import `appState`, Supabase, repositories, or services directly;
- the existing Training Sheet model, Calendar integration, publish service and local-storage keys remain unchanged;
- no database, schema, route, persistence model, product behavior or UI redesign changes are introduced;
- Legacy Match Editor remains the final high-risk nested event boundary.

This phase reduces controller ownership without changing the Training Sheet workflow.
