# STAFF 0.26.4-R1 — Security / RLS Hardening

## Perché esiste

L'audit live Supabase ha confermato RLS attivo su tutte le 10 tabelle browser-facing, ma ha trovato policy troppo permissive su `match_analysis`, `player_profiles` e `profiles`, oltre alla vecchia policy UPDATE di `analysis_templates` ancora presente nel database live.

## Interventi

- `analysis_templates`: UPDATE/DELETE richiedono owner del template + accesso attivo alla squadra.
- `match_analysis`: introdotto `team_id`, auto-assegnazione fail-closed per l'app mono-squadra e policy SELECT/INSERT/UPDATE/DELETE team-scoped. Le righe legacy vengono auto-assegnate solo se il DB contiene esattamente una squadra; in caso contrario restano `NULL` e sono visibili solo all'owner finché non vengono assegnate.
- `player_profiles`: rimossi SELECT/ALL globali; lettura e scrittura passano dalla relazione canonica `player_id -> team_players.team_id`.
- `profiles`: rimossa la lettura globale `authenticated USING(true)`, sostituita con self/same-team; rimossi i bypass UPDATE globali/hard-coded. Un trigger impedisce escalation self-service di `role`, `app_role`, `active`, email o identità.

## Compatibilità applicativa

Il browser non deve passare esplicitamente `team_id` quando importa `match_analysis`: il trigger lo assegna usando il team unico accessibile all'utente. Se l'utente ha zero o più di un team accessibile, l'INSERT fallisce invece di scegliere una squadra arbitraria.

Le modifiche profilo STAFF continuano a usare gli RPC canonici `update_my_profile` e `admin_update_staff_profile`.

## Procedura di rollout

1. Validare la ZIP 0.26.4-R1 con Launcher.
2. Eseguire `supabase/20260812_security_rls_hardening_r2.sql` nel SQL Editor Supabase.
3. Eseguire `supabase/SECURITY_RLS_VERIFY_R1_READONLY.sql` e conservare l'output.
4. Verificare login, Impostazioni/Staff, Scheda giocatore e import CSV Analisi.

Non applicare policy manuali fuori dalla migration: il repository deve rimanere la fonte versionata del cambiamento.
