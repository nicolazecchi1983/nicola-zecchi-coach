# STAFF Architecture

## Core domain rules

### Team scope
- `teams.id` is the scope of team-owned sporting data.
- Roster records belong to a team through `team_players.team_id`.
- Supabase is the canonical persistent source; local state/cache must not redefine domain truth.

### Roster
- The active roster is read from `team_players`.
- Removal is soft-delete (`active = false`) to preserve historical references.
- `teams.roster_initialized` distinguishes an intentionally empty persistent roster from the pre-R7 Mezzolara legacy fallback.
- Legacy roster data is migration-only and must never reappear after initialization.

### Player identity — R9
- `team_players.id` (UUID) is the canonical persistent identity of a player.
- `full_name`, shirt number, role, status and other properties are mutable attributes.
- `player_key` is legacy/compatibility metadata; it is not unique and must not drive CREATE-vs-UPDATE decisions.
- Two different players may have the same full name.
- UPDATE/DELETE operations must target `(team_id, id)`.
- UI actions on persistent roster players must identify them by UUID. Legacy fallback may temporarily use `player_key` until migration creates UUIDs.

## Engineering method
For every relevant change: BUG → FLOW → RULE → CAUSE → RELATED CASES → EDGE CASES → ARCHITECTURE → FIX → VERIFY.
Use broad analysis and a surgical implementation. Critical domain rules must be protected below the UI when appropriate.


### Team neutrality — R10
- Team-specific names, facilities and individual staff/player identities must not be operational defaults in product code.
- Team-specific locations must never be inferred from unrelated historical event locations; R11 defines `team_facilities` as the canonical source for training facilities.
- Hardcoded player exclusions are forbidden: roster eligibility is governed by persisted player state.
- User display identity comes from persisted profile/auth metadata and role, not email whitelists in the frontend.
- References to Mezzolara are allowed only inside the explicit pre-R7 legacy migration path.

## Team Facilities Foundation (B2.3 R11)
- I campi/impianti di allenamento appartengono alla squadra e sono persistiti in `team_facilities` con scope `team_id`.
- Training Sheet e Calendario, quando l'evento è un allenamento, leggono solo gli impianti configurati della squadra.
- Le location di partite, riunioni o eventi occasionali restano dati dell'evento e non diventano automaticamente impianti della squadra.
- `Altro campo…` è un valore occasionale: non crea implicitamente un record `team_facilities`.
- La sostituzione della lista impianti avviene tramite RPC transazionale `replace_team_facilities`; la rimozione è soft-delete (`active=false`).
- Supabase/RLS protegge lettura e scrittura per squadra.



## Authoritative Team Profile Persistence (B2.3 R12)
- Supabase-confirmed Team Profile writes are authoritative whenever an authenticated Supabase session is available.
- UI/local cache must not publish optimistic Team Profile values before the remote `teams` UPDATE succeeds.
- After a successful remote write, cache/localStorage are refreshed from the row returned by Supabase.
- Without backend/session, STAFF may use explicit local-only persistence as a fallback mode.
- Logo uploads use immutable/versioned object paths rather than overwriting the currently referenced asset before the team row is updated.
- If the team UPDATE fails after a new logo upload, the old profile remains canonical; the unreferenced uploaded object may be cleaned up later without corrupting the team profile.


## Player Profile Identity (B2.3 R13)
- `player_profiles.player_id` is the canonical relation to `team_players.id`.
- Player-profile reads are scoped to the current team through the `team_players.team_id` relation; a profile from another team must never enter the active profile map.
- Persistent player profiles are created/updated by `player_id`, never by name or legacy `player_key`.
- `player_key` remains readable only for backward compatibility with pre-R13 profile records and pre-migration roster fallback.
- Existing R9 profiles that stored the player UUID in `player_key` are backfilled automatically into `player_id`.
- Older slug-based profiles are backfilled only when the legacy key maps unambiguously to exactly one `team_players` row; ambiguous records are deliberately left unresolved rather than linked to the wrong player.
- A persistent player can have at most one canonical `player_profiles` record.
- Hard delete of a referenced `team_players` record is restricted; normal roster removal remains soft-delete, preserving the player-profile relation.


## Print Engine reliability
- Le stampe HTML autonome usano il Print Engine condiviso.
- Il payload è disponibile tramite storage e handshake same-origin `postMessage`; la pagina di stampa non deve dipendere da un solo canale di trasferimento.
- `window.print()` viene invocato solo dopo readiness di font/immagini e almeno un paint stabile del contenuto.


## Match Report source of truth
- Il Report partita è uno snapshot persistito nel payload `match_report` delle note dell’evento Calendario canonico.
- La sezione Report del Match Workspace è una proiezione dello stesso evento e non possiede una persistenza autonoma.
- Draft locali e UI editor possono preparare il contenuto, ma un Report pubblicato viene riletto dal Calendario.


## Workspace session continuity
- Gli eventi auth ripetuti dello stesso utente non devono rimontare l'intera SPA.
- La route attiva è persistita dal Workspace Engine dopo una navigazione riuscita.
- Il ripristino di una route contestuale richiede anche la validità del relativo contesto persistente.
- Per il Match Workspace, `staff-active-match` deve riferirsi a un evento Match ancora esistente; in caso contrario il fallback è Match Library.


## Post gara domain
- Il Post gara appartiene all'evento Match canonico del Calendario.
- `events.notes.post_match` è lo snapshot strutturato del debrief post-partita; aggiornamenti devono preservare tutte le altre sezioni delle note.
- Le priorità del microciclo sono un ponte informativo verso Training, non una Training Sheet generata automaticamente.
- I materiali esterni del Post gara accettano esclusivamente URL http/https.


## Match Library organization
- La data della partita determina esclusivamente il raggruppamento di presentazione `YYYY-MM`; non modifica l'identità o la persistenza della gara.
- Ricerca e filtri operano sulle card e propagano la visibilità ai gruppi mese.
- `home`, `away` e `neutral` sono tre stati distinti del dominio gara e devono restare distinti in normalizzazione, filtro e UI.


## Season Calendar Import
- Il formato sorgente è separato dal dominio: PDF, immagine, CSV o altri extractor devono produrre lo stesso array normalizzato di gare.
- Nessun extractor scrive direttamente su Supabase.
- Ogni import passa da preview/correzione e duplicate classification prima del commit.
- Il Calendario è la fonte canonica; Match Library è una proiezione degli stessi eventi Match.



## Calendar bulk operations
- Le operazioni massive sono sempre `select → classify → preview → confirm → commit`.
- La classificazione `protected` precede il delete e impedisce che documenti Training o contenuti Match vengano eliminati indirettamente da un reset ordinario.
- Il repository Calendario esegue il bulk delete in una singola query sugli ID già approvati; non decide quali eventi siano eliminabili.
- Un filtro distruttivo incompleto non deve ampliare implicitamente il proprio scope.



## Product identity presentation
- Stagione, categoria, nome e brand visualizzati nelle viste operative devono derivare dal Team Profile canonico, non da stringhe runtime hardcoded.
- `Match Sheet Editor` non è terminologia di prodotto; le viste utente devono riferirsi al Match Workspace e alle sue sezioni native.



## UI Polish architecture
- La UI Polish non modifica regole di dominio, persistenza o contratti di navigazione.
- I nuovi token `--ui-*` costituiscono il vocabolario visuale progressivo di STAFF.
- Le successive pagine devono convergere sui token condivisi invece di aggiungere nuovi valori visuali locali.
- Il debito CSS storico (override e `!important`) viene ridotto solo con pass dedicati e regression test, mai tramite riscrittura massiva durante il polish.



## STAFF Design System v1
- Un concetto visuale deve convergere su una primitiva condivisa, non su override locali.
- `tokens.css` è la fonte canonica dei token; nuove famiglie parallele di variabili sono vietate.
- `polish.css` è il layer visuale post-legacy e viene caricato per ultimo: preferire la cascade a `!important`.
- Le azioni usano quattro ruoli: primary, secondary, ghost, danger. Il testo dei pulsanti non va a capo.
- Brand squadra e brand applicazione sono separati: la sidebar mostra logo/nome squadra, mentre la palette UI resta STAFF.
