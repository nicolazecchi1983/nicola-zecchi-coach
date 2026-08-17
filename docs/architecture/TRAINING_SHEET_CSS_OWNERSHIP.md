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
