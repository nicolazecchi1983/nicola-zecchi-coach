# STAFF UI Audit — R20

## Scope
Audit based on the real post-R20.1 codebase and the visual regression screenshots supplied during UI Polish.

## Structural findings

### 1. Visual ownership is fragmented
- `src/style.css` still contains ~6900 lines, 101 media-query blocks and 449 `!important`.
- Training Sheet Editor markup still lives inside `appController.js`.
- Match has already started moving into dedicated views/CSS, therefore visual consistency differs by module.
- Existing legacy selectors often have greater specificity than generic Design System primitives.

### 2. Shell
- The former topbar still reserves vertical page space even when visually transparent.
- Team identity is cleaner after R20.1, but content and profile must share one spatial system.
- Page content currently starts at different perceived heights depending on the module.

### 3. Training Editor
- Header actions are too large and visually compete with the page title.
- Six navigation steps are oversized and some labels wrap.
- The active section repeats the same hierarchy twice: top step + oversized section banner.
- Content width is artificially constrained by legacy `max-width`.
- Sections 2–5 use different internal grids, creating empty space and visual asymmetry.
- Phase actions can wrap (`Dividi fase`) and the phase card does not exploit available width.
- Footer navigation has its own visual language instead of using the shared button system.

### 4. Match Workspace
- Seven sections are visually heavy and some pages produce horizontal overflow.
- Workspace home uses a large saturated-blue hero that dominates the page.
- Section pages do not yet share one strict header/navigation/content frame.
- This is intentionally frozen until R20.2A Shell + Training is validated.

### 5. Controls and domain visuals
- Native file/color controls remain visually inconsistent.
- Team color selector and opponent token colors are two different UX patterns.
- Player tokens/pedine differ between Squad, Opponent and Board.
- These are intentionally assigned to the PlayerToken/ColorSelector phase.

## Frozen execution plan

1. **R20.2A — Shell + Training Visual Redesign**
   - Remove residual topbar band/space.
   - Rebuild Training header hierarchy and action proportions.
   - Six Training steps on one line on desktop.
   - Full-width Training content grid.
   - Standardize sections 01–06 and footer.
   - Fix phase-editor asymmetries and wrapped actions.

2. **R20.2B — Match Workspace Frame**
   - One Match page frame.
   - Seven sections visible on desktop without horizontal scrollbar.
   - Shared page header/back action.
   - Remove oversized hero treatment and inconsistent spacing.

3. **R20.2C — Match Domain Components**
   - Shared `PlayerToken`.
   - Shared `ColorSelector`.
   - Symmetric Our Team / Opponent layouts.
   - Convocazioni action/button cleanup.

4. **R20.2D — Libraries + Calendar + Settings**
   - Match Library search/filter proportions.
   - Month cards and action hierarchy.
   - Calendar visual density.
   - Team Settings controls/file/color inputs.

5. **R20.2E — Responsive + Visual Regression**
   - Desktop widths.
   - Tablet.
   - Smartphone.
   - No overlap, accidental horizontal scroll, clipped labels or inconsistent controls.

6. **R20.3 — CSS Debt Consolidation**
   - Remove superseded legacy declarations and safe `!important`.
   - No visual redesign during this phase.

## Non-negotiable UI rules
- One concept = one component = one visual representation.
- Navy is structure; cyan is orientation; bright blue is reserved for active/primary actions.
- Green/amber/red only communicate semantic state.
- Button text never wraps on desktop.
- Page headers, spacing and content widths derive from shared tokens.
- New UI work must not add indiscriminate `!important`.
- No product feature is added during UI Polish.
