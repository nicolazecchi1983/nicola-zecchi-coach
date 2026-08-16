# STAFF 0.26.4 — Security / RLS Audit Foundation

## Scopo

Rendere verificabile la sicurezza del Data API Supabase senza inventare policy per tabelle storiche il cui schema originario non è versionato nel repository.

## Inventario statico

Il browser usa direttamente 10 tabelle Supabase: `analysis_templates`, `events`, `match_analysis`, `player_profiles`, `profiles`, `team_facilities`, `team_members`, `team_players`, `teams`, `training_sheet_drafts`.

Il repository contiene evidenza RLS completa per `analysis_templates`, `team_facilities` e `team_players`. Le altre sette tabelle sono esplicitamente marcate come **live DB verification required** nel manifest `security/rls-audit-manifest.json`.

## Finding corretto in 0.26.4

Le policy originarie `analysis_templates_update_own` e `analysis_templates_delete_own` controllavano soltanto `owner_user_id = auth.uid()`. La migration `20260812_analysis_templates_rls_hardening_r1.sql` riallinea UPDATE/DELETE alla stessa regola team-scoped già usata da SELECT/INSERT.

Questo evita che una membership revocata continui a consentire modifiche e impedisce che un UPDATE possa cambiare il `team_id` senza accesso alla squadra destinazione.

## Storage

`team-assets` è usato per i loghi tramite `getPublicUrl`: la sua pubblicità deve essere una scelta esplicita. I documenti tecnici privati usano Storage con accesso controllato e richiedono policy su `storage.objects`.

## Edge Function privilegiata

`create-staff-user` usa la service-role key esclusivamente lato server. Prima delle chiamate admin valida il JWT del chiamante, il profilo attivo, il livello owner/admin e l'accesso alla squadra.

## Verifica live richiesta

Eseguire `supabase/SECURITY_RLS_AUDIT_READONLY.sql` nel SQL Editor Supabase. Lo script è read-only e restituisce:

1. RLS attivo/non attivo per tutte le tabelle usate dal browser;
2. numero e nomi delle policy;
3. stato public/private dei bucket STAFF noti;
4. policy presenti su `storage.objects`.

Nessuna policy sulle tabelle storiche viene inventata prima di vedere questo output.

## Gate automatico

`npm run check:security-rls-audit` impedisce che:

- una nuova tabella venga usata dal browser senza essere registrata nell'inventario sicurezza;
- una nuova tabella creata dalle migration STAFF ometta l'abilitazione RLS;
- una service-role key entri nel codice browser o nel `.env` operativo;
- il fix RLS dei template venga perso in refactoring futuri.
