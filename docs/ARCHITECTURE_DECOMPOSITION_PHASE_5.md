# STAFF — Architecture Decomposition Phase 5

Baseline: 0.23.3

Physical extraction:
- Calendar event wiring -> modules/calendar/events/calendarEvents.js

The Calendar event module owns only interaction wiring:
- opening existing events;
- creating events;
- previous/next/today month navigation;
- season import command;
- bulk calendar management command.

Persistence, Supabase, repositories and Calendar data remain outside the event module.
All dependencies are injected by appController.js, which remains the composition root.

No database, RLS or source-of-truth changes.
