# STAFF 0.27.24 — Design System Legacy Cleanup Pass 11

## Scope
Season Calendar Import CSS ownership consolidation.

## Change
- Added `src/modules/calendar/seasonCalendarImport.css` as the single CSS owner for the Season Calendar Import flow.
- Migrated R19.1, R21 and 0.19.5–0.19.8 presentation rules out of `src/style.css`.
- Preserved existing geometry, responsive thresholds and desktop/mobile preview behavior.
- Updated existing season import checks to inspect the canonical owner instead of the legacy monolith.
- Added `check:design-system-legacy-cleanup-pass11` to the aggregated gate.

## Out of scope
No changes to parsing, preview data, bulk event creation, Supabase, persistence or calendar-domain behavior.
