# STAFF — Architecture Decomposition Phase 1

Baseline: 0.22.2

## Why this phase exists

`appController.js` had grown into the main concentration point for:
- application view adapters;
- navigation orchestration;
- global shell events;
- dynamic view event wiring;
- parts of domain interaction logic.

The goal is not to minimize line count mechanically. The goal is to expose ownership boundaries before physical extraction of event handlers.

## Changes in this phase

### 1. View adapters extracted

Thin render adapters moved to:

`src/app/appViewAdapters.js`

These adapters:
- translate `appState` + services into renderer arguments;
- do not own DOM event listeners;
- do not own persistence;
- do not introduce new sources of truth.

Moved adapters include:
- Dashboard
- Calendario
- Training Sheet Editor (page renderer estratto nel modulo Training)
- Convocazioni
- Rosa
- Analisi gara
- Studio avversario
- Match Report
- Post gara
- Board
- Team Settings
- Placeholder
- Profile
- Settings
- Staff
- Training Library
- Nostra squadra
- Avversario

### 2. Match wiring segmented inside bindDynamic

The first explicit event boundaries are now:

- `wireMatchLibraryEvents`
- `wireOpponentStudyEvents`
- `wireMatchWorkspaceEvents`

They remain inside `bindDynamic` intentionally.

This preserves access to the existing closure while making domain boundaries explicit before any handler is moved to another file.

### 3. Global shell wiring segmented

The global shell now exposes:

- `wireGlobalNavigationEvents`
- `wireGlobalProfileAndDrawerEvents`

This separates persistent application-shell behavior from events that must be rebound when a dynamic view is rendered.

## Current bindDynamic domain map

The remaining body is intentionally not moved in bulk. Current identifiable domains are:

1. Match Library
2. Opponent Study
3. Match Workspace / Report / Post gara
4. Team Settings / Roster
5. Callups
6. Board
7. Legacy Match Editor
8. Manual Training Sheet Editor
9. Calendar import / bulk management / navigation
10. Profile
11. Match Analysis / templates
12. Staff administration / password
13. Training narration / draft autosave
14. Player profile
15. Dashboard shortcuts
16. Training Library filters / feedback

## Next extraction rule

For each remaining domain:

1. create a named `wireXEvents` function in the existing closure;
2. run behavioral/regression checks;
3. verify that no local variable leaks across the new boundary;
4. only then consider moving that function into the owning module.

No domain handler should move directly from an anonymous region of `bindDynamic` into a new file.

## Dependency rule

Event modules may receive dependencies explicitly.
They must not import `appState` or Supabase merely to avoid dependency injection.

The application controller remains the composition root during this transition.

## Testing rule

Regex/static checks are architecture guards, not behavioral proof.

Before physical extraction of domain event modules, add interaction tests where practical, starting with:
- Training step navigation and save;
- Match section navigation;
- Calendar create/edit;
- roster CRUD;
- template apply/save.

## Known technical debt

`appController.js` remains large and `bindDynamic` remains the main hotspot.

This is expected after Phase 1. The important change is that decomposition now follows visible domain boundaries rather than arbitrary line ranges.
