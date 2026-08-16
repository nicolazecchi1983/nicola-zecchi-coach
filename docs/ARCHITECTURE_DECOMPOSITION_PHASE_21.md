# Architecture Decomposition Phase 21

## Goal
Remove the hidden STAFF color-picker runtime dependency from the Match compatibility editor and give the shared control a single explicit owner.

## Finding from the final controller review
`legacyMatchEditorEvents.js` called `bindStaffColorPickers(matchEditor)` without declaring or importing that dependency. A defensive `try/catch` prevented the Match workspace from freezing, but it also masked the missing binding and could leave team color controls inactive.

## Ownership
- `src/design-system/colorPickerController.js` owns the reusable STAFF color-picker interaction.
- `src/app/appController.js` remains the composition root and injects the shared binding into Team/Roster and Legacy Match runtimes.
- `src/modules/match/events/legacyMatchEditorEvents.js` now declares the dependency explicitly.

## Architectural effect
There is no hidden global dependency for STAFF color controls. Runtime failure can no longer be silently caused by an undeclared symbol, and the same interaction owner is reused across domains.

## Scope guard
No database, Supabase, Match persistence, lineup logic, team identity, routes, visual redesign, or workflow changes are introduced in this phase.
