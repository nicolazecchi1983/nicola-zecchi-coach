# Architecture Decomposition Phase 16 — Calendar Runtime Actions

## Obiettivo
Ridurre ulteriormente `appController.js` spostando il runtime operativo del Calendario nel dominio Calendar, senza modificare UI, persistenza o workflow.

## Estratto
- binding tipo evento / venue
- import calendario stagione
- gestione massiva eventi
- creazione e modifica evento
- eliminazione evento
- drawer evento e apertura Training Sheet

## Ownership
Il nuovo owner è `src/modules/calendar/events/calendarRuntimeActions.js`. `appController.js` resta composition root e inietta servizi, viste, permessi, storage e callback di navigazione.

## Vincoli
Nessuna nuova fonte di verità. Nessuna modifica Supabase/database. Nessuna modifica di dominio Match/Training. Nessun redesign UI.
