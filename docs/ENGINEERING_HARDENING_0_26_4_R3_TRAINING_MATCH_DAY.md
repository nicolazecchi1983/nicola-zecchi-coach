# STAFF 0.26.4-R3 — Training Match Day Constraint

## Bug
La pubblicazione Training Sheet generava correttamente il PDF ma il PATCH su `events` falliva con `events_match_day_check`, bloccando collegamento Calendario e download finale.

## Causa
La UI Training supporta il dominio MD corrente (`PREPARAZIONE`, `MD`, `MD±1/2/3`) ma il constraint live del database era rimasto a una versione precedente.

## Fix
La migration `20260812_training_match_day_constraint_r3.sql` riallinea il constraint al dominio Training corrente mantenendo `NULL` valido. Il Match domain continua a scrivere `match_day: null`; la giornata di campionato resta in `competition_round`/notes.

## Verifica
Dopo la migration eseguire `TRAINING_MATCH_DAY_VERIFY_R3_READONLY.sql` e verificare che il constraint contenga tutti i valori canonici.
