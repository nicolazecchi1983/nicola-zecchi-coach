# STAFF 0.26.4-R4 — Training Post-Publish Refresh

## Problema
La pubblicazione della Training Sheet completava correttamente PDF, persistenza e collegamento Calendario, ma il post-success runtime generava `ReferenceError: loadCalendarEvents is not defined`.

## Causa
Durante la decomposizione del Training Editor, `trainingEditorEvents.js` ha mantenuto la chiamata al refresh canonico del Calendario senza dichiarare `loadCalendarEvents` tra le proprie dipendenze. Il composition root possedeva già la funzione, ma non la iniettava nel modulo Training.

## Correzione
- `wireTrainingEditorEvents` dichiara `loadCalendarEvents` come dipendenza esplicita.
- `appController.js` inietta il refresh canonico nel Training runtime.
- Il refresh post-publish resta attivo, così `appState.calendarEvents` viene riallineato dopo il salvataggio.
- Il regression check Training Publish verifica ora sia la chiamata sia il contratto di dependency injection.

## Verifica
- Training Publish Runtime: 10/10
- Syntax: OK
- Architecture: OK
- 123/123 check Node passati
