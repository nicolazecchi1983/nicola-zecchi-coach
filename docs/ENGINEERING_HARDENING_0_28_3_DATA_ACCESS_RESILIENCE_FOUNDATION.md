# 0.28.3 — Data Access Resilience Foundation

## Obiettivo

Preparare STAFF alla resilienza di rete senza introdurre retry automatici prematuri sulle scritture Supabase.

## Decisione architetturale

Prima del retry servono due fonti di verità condivise:

1. **normalizzazione degli errori data-access** (`src/infrastructure/dataAccess/dataAccessError.js`);
2. **policy di sicurezza per tipo di operazione** (`src/infrastructure/dataAccess/dataOperationPolicy.js`).

La foundation distingue rete indisponibile, timeout, rate limit, sessione/autorizzazione, conflitto, validazione, not found, indisponibilità server e unknown.

## Retry safety

- `READ`: candidato a retry automatico;
- `IDEMPOTENT_WRITE`: candidato a retry automatico;
- `CREATE`: nessun retry automatico nella foundation; richiede una strategia di idempotenza esplicita;
- `DELETE`: nessun retry automatico finché non viene auditato il singolo flusso;
- `BATCH`: nessun retry automatico.

## Non-scope 0.28.3

- nessun `withRetry()` runtime;
- nessuna modifica alle query Supabase esistenti;
- nessun cambiamento UX;
- nessuna modifica di schema database;
- nessuna promessa di offline mode.

## Passo successivo

0.28.4 potrà introdurre un **Safe Retry Pilot** solo su operazioni che risultino idempotenti dopo audit del codice reale, con backoff limitato e test comportamentali.
