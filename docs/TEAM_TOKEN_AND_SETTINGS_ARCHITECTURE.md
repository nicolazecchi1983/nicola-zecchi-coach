# Team Token + Settings Architecture

## Token Visual Foundation
The physical visual language of a team token is shared across STAFF.

- `src/shared/ui/teamToken.css` owns ring, depth, number typography and premium physical shell.
- `src/modules/match/ui/matchTokenMarkup.js` owns the canonical Match token shell markup.
- `teamToken.css` owns Match token colors/pattern rendering in addition to ring, depth and number typography.
- `matchSquad.css` owns own-team positioning, surname labels and leadership overlays only.
- `matchOpponent.css` owns opponent positioning and match-scoped appearance controls only.
- `teamSettings.css` owns Settings preview placement and contextual color/pattern mapping; physical token sizes come from the shared foundation.
- `style.css` must not own Match token appearance.

Data ownership is intentionally separate from visual ownership. Nostra squadra and Avversario must render the same `staff-match-token__shell`; differences are expressed only through data, colors/pattern variables and optional overlays.

### Size variants
- Match field token: `36px` canonical shared size.
- Settings preview token: `38px`, intentionally secondary to the field token.
- Context owners must not redefine `--staff-token-size`; mobile device sizing may adapt through the responsive layer.

## Team Settings Grid v2
`Impostazioni → Squadra` is arranged by responsibility, not by incidental field order.

1. Brand preview.
2. `Identità / Dati squadra` section with a 2-column desktop grid and 1-column responsive grid.
3. `Aspetto / Identità visiva` section with a 2-column desktop grid:
   - primary color | secondary color
   - aligned appearance row: kit style + premium token preview | logo upload (equal-height sibling blocks)
4. Facilities full width.

New fields must be placed inside the correct semantic section instead of being appended to the root grid.
