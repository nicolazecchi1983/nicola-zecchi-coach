# STAFF 0.27.40 — Design System Legacy Cleanup Pass 27

## Scope
Shared Document Viewer ownership cleanup.

## Changes
- Moved shared document viewer shell, backdrop, body lock, frame/image and mobile full-screen presentation from `src/style.css` to `src/shared/documentViewer/documentViewer.css`.
- Kept Training/Calendar-specific `.drawer-ts-view-actions` outside the shared viewer owner.
- Preserved existing visual values and breakpoint behavior; no functional or document-viewer controller changes.
- Added `check:design-system-legacy-cleanup-pass27` to the aggregate `npm run check` gate.

## Architecture review
The shared document viewer now owns its presentation next to its JS module instead of depending on global legacy CSS. This removes one cross-domain global owner while keeping domain-specific drawer actions separate.
