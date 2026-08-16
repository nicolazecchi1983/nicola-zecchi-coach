# STAFF Design System v1 — DS1.1 Foundation Contract

## Scope
DS1.1 does not redesign product pages. It establishes the visual foundation contract that future UI work must consume.

## Ownership
- `tokens.css`: single owner of palette, spacing, typography roles, radii, control/touch sizes, motion, elevation, page-width roles and responsive tiers.
- `primitives.css`: shared controls consume foundation tokens and must not introduce raw colors.
- `productUi.css`: Training/Match product patterns consume canonical foundation values.
- `responsive.css`: owns adaptive behavior, but consumes touch/foundation tokens rather than redefining them.

## Canonical rules
- Spacing: 4 / 8 / 16 / 24 / 32 / 48.
- Structural radii: small 8, medium 12, large 18; 24 is reserved for large panels; pill only for semantic pill controls.
- Touch floor: 44px; preferred target/control: 48px.
- Responsive reference tiers: 390 / 760 / 980 / 1180. Existing legacy breakpoints are migration debt, not precedent for new ones.
- Brand color is STAFF cyan; semantic colors are only for semantic states. Team colors remain content identity, not application chrome.
- New shared UI should use typography roles rather than ad-hoc font sizes.
- New primitive CSS must not add raw color literals.

## Migration strategy
No big-bang rewrite of `style.css`. Product screens migrate progressively. When a legacy owner is replaced, its override should be removed instead of adding another override layer.

## Release guard
`check:design-system-foundation-contract` protects this contract and belongs to the canonical `npm run check` gate.

## DS1.1 acceptance
- Foundation contract check: 12/12.
- Existing direct Node regression scripts: 125/125 pass.
- All `check:*` scripts are represented in the aggregate release gate.
- Full Vitest/build/runtime validation remains the Launcher/CI responsibility because clean release archives intentionally exclude `node_modules`.
