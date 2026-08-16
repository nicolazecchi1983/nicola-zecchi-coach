# STAFF 0.27.32 — Design System Legacy Cleanup Pass 19

## Scope
Board / Lavagna tattica presentation ownership only.

## Changes
- Added `src/modules/board/board.css` as the canonical desktop/tablet Board owner.
- Removed Board toolbar, color controls, pitch, token and helper presentation from legacy `src/style.css`.
- Preserved shared field convergence in `design-system/controls.css`.
- Preserved final real-device Board geometry in `design-system/responsive.css`.
- Kept the existing 900px Board-specific adaptation unchanged.
- No Board runtime, drag/drop, local persistence, Match, Convocazioni or Supabase behavior changed.
- Added `check:design-system-legacy-cleanup-pass19` to the aggregate check gate.

## Architecture review
The Board domain now owns its presentation explicitly instead of sharing the historical V6.5 block with Team Identity, Convocazioni and Match Sheet. The responsive final owner remains centralized, preventing a new mobile override chain.
