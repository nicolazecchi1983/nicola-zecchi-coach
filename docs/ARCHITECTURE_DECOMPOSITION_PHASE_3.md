# STAFF — Architecture Decomposition Phase 3

Baseline: 0.23.1

## Scope

First physical extraction of low-risk event wiring.

Extracted:
- Dashboard events → `src/app/events/dashboardEvents.js`
- Profile events → `src/app/events/profileEvents.js`
- Training Library events → `src/modules/training/events/trainingLibraryEvents.js`

## Dependency rule

All external dependencies are injected from `appController.js`.

The extracted modules do not import:
- `appState`;
- Supabase;
- repositories;
- application navigation state.

This keeps `appController.js` as the composition root while reducing event ownership inside it.

## Behavioral ownership

### Dashboard
Owns only Dashboard-specific navigation interaction.

### Profile
Owns:
- profile form submit;
- navigation to Staff;
- navigation to Profile.

Supabase and application state are injected.

### Training Library
Owns:
- search/filter behavior;
- feedback editor open/cancel/select;
- feedback save interaction.

Persistence services and calendar reload are injected.

## Why only these three

They are low-risk, clearly bounded domains validated in Phase 2.

Higher-risk domains remain nested in `bindDynamic()` until dedicated behavioral coverage is strong enough.

## Next recommended extraction

1. Callups
2. Board
3. Calendar
4. Team/Roster

Then re-evaluate before Staff, Match Analysis, Training Draft/Voice, Training Editor and Legacy Match Editor.
