# Architecture Decomposition Phase 17

## Scope

Phase 17 extracts Calendar event presentation builders from `appController.js` into the Calendar UI domain.

Moved ownership:
- event drawer markup;
- create-event modal markup;
- edit-event modal markup;
- team facility option rendering used by Calendar/Training presentation;
- configured-facility presentation predicate.

New owner: `src/modules/calendar/ui/calendarEventViewBuilders.js`.

## Boundaries

`calendarEventViewBuilders.js` owns markup only. It receives capabilities, formatters, icons, facility readers and Training Sheet render helpers by dependency injection. It does not persist data and does not access Supabase.

`calendarRuntimeActions.js` remains the operational owner for create/update/delete/import/bulk/drawer behavior and continues receiving the view builders from the application composition root.

## Result

`appController.js` is reduced from the Phase 16 baseline (~1,629 lines) to ~1,232 lines while preserving the existing Calendar and Training contracts.
