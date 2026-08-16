# STAFF Design System v1 — DS1.3 Buttons, Forms & Controls

## Scope
DS1.3 makes the interaction language visibly consistent without changing domain workflows.

## Ownership
- `tokens.css`: visual values.
- `primitives.css`: canonical primitives for new/refactored markup.
- `controls.css`: convergence layer for existing STAFF controls while legacy markup is progressively migrated.
- domain CSS: domain-specific geometry/meaning only.

## Rules
1. One dominant primary action per context when possible.
2. Primary is flat STAFF cyan; no decorative gradient, lift or heavy shadow.
3. Secondary uses dark control surface and neutral border.
4. Ghost is reserved for low-priority/contextual actions.
5. Danger colors are semantic only.
6. Text/select controls share height, radius, surface, border and focus.
7. Mobile interactive controls preserve the preferred 48px touch target.
8. DS1.3 adds no `!important`, raw hex colors, or new breakpoints.

## Migration strategy
The convergence layer intentionally recognizes existing classes (`primary-action`, `secondary-button`, `ghost-button`, `button`) so the product becomes coherent before all legacy HTML is renamed. New UI should prefer `.staff-button` and STAFF primitives directly.
