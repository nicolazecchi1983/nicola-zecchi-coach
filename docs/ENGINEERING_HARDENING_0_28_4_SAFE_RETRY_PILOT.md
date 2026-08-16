# STAFF 0.28.4 — Safe Retry Pilot

## Scope
Introduce retry automatico solo per un piccolo insieme di letture idempotenti e ad alto valore operativo.

## Pilot operations
- Caricamento profilo/accesso (`profiles` read)
- Caricamento analisi gara (`match_analysis` read)
- Caricamento Rosa attiva (`team_players` read)

## Policy
- massimo 2 retry automatici oltre al primo tentativo;
- backoff esponenziale 250 ms, 500 ms;
- retry solo per errori classificati come rete, timeout, rate limit o server temporaneamente indisponibile;
- nessun retry per errori di validazione, autenticazione, permessi, conflitto o not-found;
- nessun retry automatico per CREATE, DELETE o BATCH;
- la shape di risposta Supabase `{ data, error }` resta invariata.

## Architecture review
Il pilot usa `dataOperationPolicy.js` come autorità: il retry helper non decide autonomamente quali categorie siano sicure. In questo modo l'estensione futura rimane policy-driven e non dispersa nei repository.
