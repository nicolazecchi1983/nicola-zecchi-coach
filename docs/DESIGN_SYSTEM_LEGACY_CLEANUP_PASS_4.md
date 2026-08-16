# Design System Legacy Cleanup — Pass 4

Scope: overlay shell ownership only.

Canonical owners after this pass:
- `src/design-system/overlays.css`: modal/drawer backdrop, panel geometry, headers, close controls, action footers, mobile overlay geometry.
- `src/design-system/controls.css`: shared secondary action styling.
- domain CSS / `style.css`: domain-specific content inside overlays only.

Removed from legacy `style.css`:
- Calendar drawer shell/backdrop/header/actions geometry.
- New/Edit Event modal shell/header/close/actions and mobile shell geometry.
- Match Report dialog shell/header/body/footer and mobile shell geometry.
- Generic `.modal-actions` layout ownership.

Explicitly deferred:
- Analysis Template Manager internal interaction/layout. It has multiple historical runtime contracts and will be cleaned in a dedicated pass rather than mixed into this shell cleanup.
