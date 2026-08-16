# STAFF 0.26.3 — Type Safety Foundation

## Obiettivo

Introdurre controllo statico graduale nel codice JavaScript esistente senza avviare una conversione massiva a TypeScript e senza modificare runtime, UI o persistenza.

## Strategia

STAFF resta JavaScript ESM. TypeScript viene usato come analizzatore statico tramite `allowJs + checkJs + noEmit` e JSDoc.

Il primo perimetro comprende quattro nuclei di dominio già relativamente puri e coperti dai test comportamentali:

- `src/modules/roster/rosterDomain.js`
- `src/modules/calendar/seasonCalendarImportModel.js`
- `src/modules/match/matchModel.js`
- `src/modules/training/trainingSheetModel.js`

Non viene attivato `checkJs` sull'intero repository: il rollout resta intenzionalmente incrementale per evitare una massa di errori legacy non correlati e mantenere ogni release revisionabile.

## Contratti introdotti

JSDoc esplicita progressivamente:

- identità/configurazione squadra usata dal fallback Rosa;
- shape delle righe di import calendario e degli eventi Match esistenti;
- input del Match document e validation issue;
- stati Training Sheet e input del documento;
- parametri `unknown` ai boundary di normalizzazione, costringendo la logica a normalizzare prima dell'uso.

## Release gate

Nuovi comandi:

```bash
npm run typecheck:domain
npm run check:type-safety-foundation
```

Entrambi fanno parte di `npm run check`, quindi anche Launcher e CI li ereditano automaticamente.

## Regola architetturale

La type safety si espande per ownership di dominio, non per numero di file. Un modulo entra nel perimetro `checkJs` solo quando il suo contratto può essere dichiarato senza introdurre `@ts-ignore` sistematici o cambiare comportamento applicativo per soddisfare il checker.

## Fuori scope

- conversione `.js` → `.ts`;
- tipizzazione dell'intero DOM/event wiring;
- refactoring UI;
- modifiche Supabase/database;
- nuove feature.
