# Training Sheet CSS Ownership Contract — R1.1A

## Stato

R1.1A introduce **solo un guardrail architetturale**.  
Non cambia UI, PDF, markup, comportamento, responsive o database.

## Canonical owner

La resa visuale della Training Sheet appartiene a:

`src/design-system/training-editor.css`

Questo è il solo owner canonico del namespace `.ts-paper*`.

## Transitional debt congelato

L'audit della baseline reale ha rilevato ownership ancora distribuita:

- `src/design-system/responsive.css` — 1 riga rilevata;
- `src/modules/training/trainingPolish.css` — 1 riga rilevata;
- `src/modules/match/ui/matchSheet.css` — 15 righe rilevate.

R1.1A **non sposta queste regole** perché farlo ora potrebbe cambiare la resa visiva o il PDF.

Il check congela invece il debito:

- nessun nuovo file CSS può iniziare a possedere `.ts-paper*`;
- `responsive.css`, `trainingPolish.css` e `matchSheet.css` non possono aumentare il numero di righe proprietarie;
- il canonical owner deve continuare a esistere.

## Perché Match è transitional debt

`matchSheet.css` contiene regole della Training Sheet, comprese regole roster/capture.  
Questo viola il boundary di dominio, ma viene mantenuto temporaneamente per non introdurre regressioni.

La release successiva dovrà migrare queste regole **una famiglia per volta**, con confronto visivo/PDF prima e dopo.

## Regola permanente

Nessun nuovo polish della Training Sheet deve essere implementato aggiungendo un ulteriore blocco CSS esterno o un nuovo owner.

Flusso:

1. identificare la regola corrente;
2. identificare l'owner reale nella cascade;
3. consolidare nel canonical owner;
4. targeted check;
5. test;
6. `npm run check`;
7. `npm run build`;
8. smoke preview/PDF.

## R1.1B

Prossimo step previsto: mappare e migrare in sicurezza le 15 righe `ts-paper` oggi presenti in `matchSheet.css`, iniziando dalle regole che non alterano il layout.


## R1.1B — Match ownership migration

R1.1B removes Training Sheet paper/capture ownership from `src/modules/match/ui/matchSheet.css`.

To preserve cascade position without touching the locally modified `training-editor.css`, the migrated rules live temporarily in:

`src/design-system/training-sheet-match-compat.css`

The bridge is loaded immediately after `matchSheet.css` and before `training-editor.css`.

This is a migration bridge, not a new permanent owner. Its ts-paper surface is frozen at the migrated baseline and Match must remain at zero.

Next consolidation step: move the bridge into the final canonical Training Sheet owner only after the local `training-editor.css` working-tree change has been resolved and visual/PDF equivalence can be tested.

## R1.1E — Canonical consolidation

R1.1D verified that the temporary bridge was loaded before `training-editor.css` and that the stylesheets located between them did not own `.ts-paper*` or `.ts-capture-root` selectors.

R1.1E therefore moves the bridge rules into the **beginning** of the canonical owner:

`src/design-system/training-editor.css`

This preserves their order relative to the existing Training Sheet rules while eliminating the temporary file:

`src/design-system/training-sheet-match-compat.css`

After R1.1E:
- `matchSheet.css` remains at zero Training Sheet ownership;
- the Match compatibility bridge must not exist;
- `training-editor.css` is the canonical owner;
- `responsive.css` and `trainingPolish.css` remain frozen transitional debt until their dedicated migration.

## R1.1F1 — Training Polish migration

`src/modules/training/trainingPolish.css` no longer owns `.ts-paper*` selectors.

Its `.ts-manual-editor .ts-paper-frame` presentation block is moved to the **end** of the canonical owner `src/design-system/training-editor.css`.

R1.1F verified there are no other Training Sheet owners between `training-editor.css` and `trainingPolish.css`. Appending the block to the canonical owner preserves its precedence over the pre-existing Training Sheet rules, while `responsive.css` remains later in the cascade and keeps its mobile override.

Residual transitional debt after R1.1F1:
- `src/design-system/responsive.css` — 1 selector family.

## R1.1F2 — Responsive ownership migration

`src/design-system/responsive.css` no longer owns `.ts-paper*` or `.ts-capture-root` selectors.

The final mobile rule `.ts-manual-editor .ts-paper-frame` is moved into the canonical owner `src/design-system/training-editor.css` while preserving its original `@media (max-width: 760px)` scope.

After R1.1F2:
- `training-editor.css` is the only Training Sheet CSS owner;
- `responsive.css` has zero Training Sheet ownership;
- `trainingPolish.css` has zero Training Sheet ownership;
- the retired Match compatibility bridge remains absent.
