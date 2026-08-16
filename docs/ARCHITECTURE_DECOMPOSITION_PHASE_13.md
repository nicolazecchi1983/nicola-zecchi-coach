# STAFF — Architecture Decomposition Phase 13

Baseline: 0.25.0 recovery baseline (validated)

Physical extraction:
- global sidebar navigation wiring;
- profile menu interaction;
- mobile drawer interaction;
- global Escape/click shell behavior.

New owner:
- `src/app/events/globalShellEvents.js`

Architecture rules preserved:
- `appController.js` remains the composition root;
- navigation still delegates route opening to the Workspace Engine / `setView`;
- access guard remains injected;
- no Supabase, repository or app-state shortcut is introduced in the shell event module;
- persistence is limited to the pre-existing `nz-active-section` localStorage key;
- no domain, schema, route or UI redesign changes.

This phase deliberately does not touch the Legacy Match Editor or Training Editor event boundaries.
