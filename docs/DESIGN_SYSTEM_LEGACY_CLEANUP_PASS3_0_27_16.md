# STAFF 0.27.16 — Design System Legacy Cleanup Pass 3

## Scope
Retroactive cleanup of already-migrated Design System ownership only. No domain, persistence, Supabase, workflow, or feature changes.

## Canonical ownership reinforced
- `src/design-system/pageShell.css` owns page/root rhythm and page header geometry/typography.
- `src/design-system/controls.css` owns shared buttons, focus, shared control geometry and shared icon sizing.
- `src/design-system/surfaces.css` owns shared panels/surfaces and panel header hierarchy.

## Legacy removed
- old `#viewRoot` / `.page-head` page shell rules and mobile overrides;
- shared Release A primary/secondary/ghost button visuals and focus styling;
- obsolete `button--danger` `!important` override;
- old `.panel` / `.panel-head` visual owner;
- duplicated stat-card gradient/border/radius ownership.

## Rule
When a component has a canonical Design System owner, legacy CSS may retain domain layout only when still necessary; it must not keep a competing visual or responsive owner.
