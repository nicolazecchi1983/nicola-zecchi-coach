# STAFF 0.26.1 — Test Foundation

## Obiettivo

Aprire la fase Engineering Hardening affiancando ai regression contract sorgente-esistenti una prima suite di test comportamentali eseguibili con Vitest.

## Principio

I `check-*.mjs` restano utili per contratti architetturali, ownership, wiring e regressioni strutturali. Non devono però essere l'unica protezione della logica di dominio. I modelli puri devono essere verificati eseguendo realmente le funzioni e confrontandone input/output.

## Primo perimetro coperto

- `rosterDomain.js`: fallback legacy e inizializzazione roster.
- `seasonCalendarImportModel.js`: normalizzazione, validazione e duplicati calendario stagione.
- `matchModel.js`: risultato, casa/trasferta, location, competition round e validazione documento.
- `matchWorkflowModel.js`: sette sezioni canoniche e fase temporale della gara.
- `trainingAnalyticsModel.js`: record analytics, snapshot, coverage e filtri sulle sedute pubblicate.

## Release gate

`npm run check` esegue ora anche `npm run test:domain`. In questo modo una regressione comportamentale nei moduli coperti blocca la stessa catena usata dal Launcher.

## Strategia incrementale

Non viene riscritta la suite esistente. Vitest cresce per domini e casi limite, mentre i check sorgente vengono mantenuti solo dove proteggono realmente l'architettura. La metrica utile non è il numero di test, ma la copertura delle regole di dominio più costose da rompere.
