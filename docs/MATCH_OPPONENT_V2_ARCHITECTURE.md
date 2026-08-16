# Match Opponent v2 — architecture contract

## Purpose
The native `Avversario` workspace is not a copy of `Nostra squadra`; it is a second Match consumer with its own domain responsibilities and a dedicated UI owner.

## Canonical anatomy
1. **Command 50/50** — `Sistema iniziale` and `Aspetto pedine` share the top command width; no empty filler surface is allowed.
2. **Initial system** — one match-scoped formation control (`opponent_system_0`).
3. **Opponent appearance** — the command exposes only real opponent capabilities today: number visibility, a compact token preview and `Cambia colori`. Match-scoped primary/secondary/pattern values remain persisted with the Match draft. The palette is a compact popover and never participates in page-flow geometry.
4. **Core 50/50** — opponent field and uploaded opponent sheet share the same desktop width.
5. **Opponent reading** — analysis schema and observed system changes live in one reading surface.
6. **System changes** — `opponent_system_1..5` remain compatible with reports/drafts, but their UI is no longer an autonomous “Sistemi di gioco avversari” panel. They are observations with minute, new system and optional note.

## Ownership
- `matchOpponentView.js` owns native opponent markup.
- `matchOpponent.css` is the only geometry/presentation owner for the native opponent configuration, field, sheet, appearance disclosure and system-change rows.
- `legacyMatchEditorEvents.js` remains the compatibility runtime for draft persistence and drag behavior until the broader legacy Match runtime is retired.
- `matchSheet.css`, `style.css` and global responsive layers must not own native opponent field/appearance geometry.

## Data compatibility
Existing persisted fields are preserved:
- `opponent_system_0`, `opponent_system_minute_0`, `opponent_system_note_0`
- `opponent_system_1..5`, minute/note companions
- `opponent_position_x_0..10`, `opponent_position_y_0..10`
- `opponent_token_primary`, `opponent_token_secondary`, `opponent_token_pattern`
- `opponent_analysis_schema`

No new database table and no report-schema fork is introduced.

## Responsive
Desktop core layout is 50/50. Below the structural breakpoint it becomes one column. Appearance palettes remain closed by default and open as an explicit disclosure.


## 0.29.20 — Simplified structure

- The opponent step uses the same vertical rhythm and 1420px canonical content width as the native own-team workspace.
- The appearance half is not filled with artificial controls: Number + live token preview stay left, while the progressive `Cambia colori` action is anchored to the far edge.
- `Lettura avversario` is the only visible reading heading. System changes are recorded from that same header and remain observations, not a separate configuration section.
- The shared analysis editor now exposes `showIntro`; Avversario uses `showIntro:false` instead of hiding a duplicate title with CSS.
