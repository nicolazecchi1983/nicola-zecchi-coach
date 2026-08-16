# STAFF 0.27.29 — Design System Legacy Cleanup Pass 16

## Scope
Consolidate desktop/tablet App Shell navigation ownership without changing application behavior.

## Changes
- `src/design-system/appShell.css` now owns the desktop/compact-desktop shell, sidebar, brand, primary navigation items, Training/Match navigation groups, active state, logout action and the existing 1100px compact-sidebar behavior.
- `src/design-system/responsive.css` remains the only mobile navigation owner and continues to replace the desktop sidebar with the dedicated mobile navigation/drawer.
- Removed the same ownership from `src/style.css`.
- Removed the later DS1.5 shell override layer from `src/design-system/polish.css`.
- Removed the obsolete pre-M1 mobile sidebar implementation from legacy CSS.
- Added `check:design-system-legacy-cleanup-pass16` to prevent shell ownership from drifting back into legacy/polish files.

## Architecture review
The global chrome now has one desktop/tablet owner (`appShell.css`) and one responsive/mobile owner (`responsive.css`). Domain styles no longer need to win against the original sidebar or the later polish layer. The existing 1100px compact-sidebar threshold is intentionally preserved in this cleanup to avoid an unreviewed visual change; breakpoint normalization belongs to a dedicated responsive pass.
