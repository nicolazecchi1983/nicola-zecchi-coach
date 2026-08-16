# MATCH Token Appearance Architecture

## Goal
Keep token presentation reusable across Nostra squadra, Avversario and Soccer Board without duplicating UI or visual rules.

## Three separate responsibilities

1. **Token Display Control** — what is visible on a token (`Numero`, `Cognome`, `Foto`).
   - Shared Match-domain UI component: `matchTokenDisplayControl.js` + `matchTokenDisplayControl.css`.
   - It must not own team colors, kit pattern or field rendering.

2. **Token Appearance Source** — how the token looks.
   - **Own team:** global defaults come from `Impostazioni → Squadra` (`primaryColor`, `secondaryColor`, `kitPattern`).
   - **Opponent:** appearance is match-scoped because the opponent changes from match to match; it must reuse the same renderer and may later be prefilled from an opponent profile.
   - Match pages may expose a local override only when the domain requires it; they must not duplicate the own-team global identity controls.

3. **Token Renderer** — draws the token on a pitch.
   - Must consume an appearance object/preset rather than read settings UI directly.
   - Nostra squadra, Avversario and Soccer Board should converge on one rendering language before adding new token styles.

## Product rule
Configure stable own-team appearance once in Settings; choose display content where the board is used. Opponent appearance belongs to the match context. Local controls never become a second source of truth for own-team identity.
