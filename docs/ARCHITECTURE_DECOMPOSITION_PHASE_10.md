# STAFF — Architecture Decomposition Phase 10

Baseline: 0.23.8

Physical extraction:
- Staff administration event wiring -> `src/modules/staff/events/staffEvents.js`

Preserved:
- create Staff user;
- permission guards;
- temporary password generation;
- update Staff profile and access role;
- delete Staff account with confirmation;
- current-user profile/access refresh;
- password update through Supabase Auth.

The module receives all application services, capabilities, state and Supabase client
from `appController.js`. It does not import repositories or application composition.

No database schema, RLS or source-of-truth changes.
