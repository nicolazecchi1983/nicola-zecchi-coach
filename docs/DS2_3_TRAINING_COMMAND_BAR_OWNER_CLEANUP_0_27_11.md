# STAFF 0.27.11 — Training Command Bar Owner Cleanup

## Finding
The Training command row still had historical geometry in `training-editor.css` and in responsive blocks that predated the canonical DS2.3 owner. These declarations created width-dependent residual behavior even when the final rules usually won the cascade.

## Resolution
- `trainingCommandBar.css` is the only desktop/tablet geometry owner.
- The final DS2.3 block in `responsive.css` is the only mobile geometry owner.
- Historical `1fr 48px`, `1fr 44px`, 96px open-button and 390px wrapper layouts were removed from legacy layers.
- The canonical owner explicitly resets wrapper/grid alignment so inherited legacy geometry cannot leak through.

## Scope
Presentation only. No Training domain, persistence, PDF, Calendar or Supabase behavior changed.
