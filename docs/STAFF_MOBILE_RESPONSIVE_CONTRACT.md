# STAFF Mobile Responsive Contract — M1.1

## Status
Canonical responsive contract introduced after baseline `0.18.37`.
This release does **not** redesign individual pages. It defines the rules that all subsequent mobile work must follow.

## Core rule
**Beyond the Bug + Binary Direction + Design System.**
A visible mobile issue must be traced to its structural cause, solved at the shared-pattern level when reusable, and regression-tested on desktop and mobile. Beyond the Bug must never become Beyond the Release.

## Architecture decision
STAFF uses an **adaptive responsive architecture**: one product and one component tree, with layout and interaction patterns adapting by viewport/context. No duplicated desktop/mobile products.

## Canonical viewport tiers
These are the only tiers new Design System work may target unless a component has a documented physical constraint.

- `compact-mobile`: up to 390px
- `mobile`: up to 760px
- `tablet/compact`: 761px–980px
- `desktop`: above 980px

Legacy styles currently contain additional breakpoints. They are technical debt to be consolidated progressively; M1.1 does not rewrite them.

## Viewport regression matrix
Every mobile release must consider at least:
`320, 360, 375, 390, 412, 430, 768px`, plus a desktop baseline and smartphone landscape.

## Shared layout contract
- Page horizontal spacing is controlled by Design System responsive variables, never arbitrary page-local gutters.
- Interactive touch targets should be at least 44px; STAFF canonical target is 48px.
- A fixed/sticky mobile navigation must reserve its real occupied space plus safe-area inset.
- Components that expand (details, dropdowns, drawers, lists) must never receive fixed heights that block their content.
- Horizontal scrolling is an explicit interaction choice, never the default fix for layout overflow.
- Toolbars may change layout/presentation on mobile; desktop toolbars must not simply be compressed until they overflow.

## Viewport height / safe area
- Prefer `100dvh` for full-screen interactive surfaces where supported.
- Use `100vh` only as a fallback, not as the final mobile height contract.
- Apply `env(safe-area-inset-*)` only to screen-edge UI (bottom navigation, full-screen modal/drawer, sticky edge actions).

## Navigation contract
- Desktop sidebar and mobile navigation may present the same destinations differently.
- Mobile navigation must not require uncontrolled horizontal scrolling to reach core destinations.
- Global navigation, page navigation and workspace navigation are separate layers and must not compete visually.

## Page header / actions contract
- Page title remains the first page-level visual anchor.
- Global shell controls never overlap page content.
- Page actions must use an adaptive shared pattern; no page-specific fixed widths to force desktop layouts onto mobile.

## Forms / touch contract
- Canonical mobile input/control target: 48px.
- Numeric inputs should use appropriate `inputmode`.
- Keyboard opening must not hide the only save/close action.
- Sticky action bars must account for safe-area bottom.

## Dense data contract
Choose deliberately among:
1. responsive card/stack,
2. progressive disclosure,
3. reduced columns,
4. controlled horizontal scroll.
`overflow-x:auto` is not a universal solution.

## Training contract
- Training step navigation must remain controlled at mobile width; uncontrolled horizontal scrolling is not acceptable.
- Player selectors must remain touch-safe and expandable.
- Document preview is a document surface: it may scale/fit, but must not dictate page width.

## Match contract
- Match Workspace navigation requires a mobile interaction model, not compressed desktop tabs.
- Pitch + player list must adapt structurally.
- Drag & drop must be tested on touch; if precision/scroll conflict is unacceptable, a tap-based alternative may be introduced in the dedicated Pitch release, not in Foundation.

## Calendar contract
Monthly desktop density must not be shrunk blindly. The Calendar mobile release must decide which information is primary and use an intentional day/event interaction.

## PWA gate
PWA work starts only after the mobile regression matrix is acceptable. Installing STAFF must not merely package unresolved responsive problems.

## Regression safety
Mobile work must not alter domain logic, Supabase schema, permissions, Match/Training persistence or desktop behavior unless explicitly required by the current release.


## M1.2 — Mobile Shell & Navigation

The desktop sidebar and the mobile navigation are intentionally different presentations of the same application routes.

Mobile navigation contract:

- the desktop sidebar is hidden at the canonical mobile breakpoint;
- the bottom navigation has four primary destinations plus one `Altro` entry;
- the bottom navigation never requires horizontal scrolling;
- `Altro` opens a bounded mobile sheet for secondary product areas;
- the bottom navigation reserves the device safe-area and never overlaps page content;
- global profile identity remains in the topbar;
- the topbar and bottom navigation are application shell elements, not page-specific components;
- page modules must not add their own global mobile navigation;
- active navigation state is synchronized across desktop and mobile representations.

Primary mobile destinations:

1. Dashboard
2. Calendario
3. Training
4. Match
5. Altro

Secondary destinations currently exposed through `Altro`:

- Training Library
- Board
- Rosa
- Metodologia
- Impostazioni

Match sub-sections remain owned by Match Workspace and are not duplicated in global navigation.


## M1.3A — Mobile Navigation Drawer + Brand-Neutral Palette

This decision supersedes the M1.2 bottom-navigation presentation.

Permanent navigation contract:

- desktop uses the persistent sidebar;
- mobile uses a left navigation drawer opened from the global topbar;
- there is no global bottom navigation on mobile;
- every destination in the drawer shows both icon and text label;
- destinations are grouped by product meaning: Principale, Training, Match, Squadra, Sistema;
- the drawer owns safe-area handling, vertical overflow, backdrop and Escape/close behavior;
- selecting a destination closes the drawer and preserves the same route/access-control logic used by desktop;
- Match Workspace sub-routes remain inside Match and are not duplicated as global destinations.

Permanent color contract:

- STAFF application chrome uses a product-owned, brand-neutral dark palette;
- team crest/logo colors must never drive navigation, surfaces, controls, selection states or semantic colors;
- team colors may appear only in team identity content (logo, kit/pitch visualization, exported team documents when explicitly required);
- no yellow/gold is part of the global STAFF UI palette;
- warning semantics use orange, while destructive states use coral/red and positive states use green;
- the primary STAFF accent remains cyan/blue and is used sparingly for focus, selection and primary actions.


## M1.3B — Drawer Reliability and Training Editor Compaction

- drawer text labels are explicitly owned by the drawer and cannot be hidden by legacy sidebar/mobile rules;
- a closed drawer is inert as well as aria-hidden;
- focus is restored to the menu trigger before the drawer is hidden;
- opening the drawer moves focus to the close control;
- the Training Sheet published-selector area uses a compact two-row mobile command cluster;
- editor-only parallel-work surfaces use the dark STAFF palette; white remains reserved for document/print representation;
- M1.3B does not redesign Training Library, Calendar, Match Post-gara or document generation.


## M1.3E — Match Workspace Single Navigation Source

- the Match Workspace navigation is the single visible index of match sections;
- duplicated section cards are removed from the workspace landing view;
- selecting a workflow item routes directly to its native section;
- no secondary preview-card layer is introduced;
- section descriptions remain domain metadata but are not repeated in the landing view;
- this reduces UI code without changing Match domain models, persistence, routes or permissions.


## M1.3F — Match Team Mobile Width and Shared Team Visuals

- Nostra squadra and Avversario use the same mobile content-width contract;
- the native Match header/navigation keep their normal page gutter while the team work surface reclaims nested legacy padding;
- football pitches use the full available work-surface width;
- own-team and opponent markers share the same visual scale intent, while each native domain owns its responsive geometry;
- captain and vice-captain remain the existing Match domain fields and drag/click hooks; only their presentation is grouped as labelled role controls;
- opponent appearance keeps the existing persisted primary/secondary/pattern fields and opens them through a match-scoped progressive disclosure owned by `matchOpponent.css`;
- no Match persistence, route, permission, formation model or report schema is changed.


## M1.3G — Match Team Visual Unification

- Nostra squadra and Avversario use the same mobile width contract;
- team identity and opponent appearance use one shared STAFF color-picker component;
- all nine preset swatches stay on one row on desktop and mobile; custom color is a separate control below;
- captain and vice-captain are selected from the current starting XI via dropdowns while canonical hidden Match fields remain captain and vice_captain;
- own-team and opponent football tokens share a restrained ring, depth and number-legibility language across desktop and mobile;
- the our-team workflow label resolves dynamically from configured team identity and is never hardcoded to a club;
- no Match persistence schema, route, formation schema or roster source is changed.
