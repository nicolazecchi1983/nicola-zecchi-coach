# STAFF 0.25.11 — Check Suite Integrity

## Scopo
Chiudere un gap nella suite aggregata dopo la decomposizione del Calendario.

## Correzioni
- `check-season-calendar-import.mjs` verifica il runtime canonico `calendarRuntimeActions.js` invece del vecchio owner `appController.js`.
- Il controller viene verificato solo per la delega a `createCalendarRuntimeActions`.
- `check:season-calendar-import` è ora incluso in `npm run check`, vicino agli altri contratti di import stagione.

## Regola architetturale
Un check di regressione deve seguire l'owner reale del comportamento. I check standalone che proteggono un flusso canonico devono essere inclusi nella suite aggregata, altrimenti non costituiscono una guardia di release.
