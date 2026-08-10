# STAFF Release State

## Current release candidate
B2.5 R20.2A — Shell + Training Visual Redesign

## Stable baseline entering R13
B2.3 R12 — Authoritative Team Profile Persistence

## Completed
- Persistent Team & Roster foundation with team-scoped RLS.
- Explicit roster initialization protecting intentionally empty rosters from legacy fallback.
- Canonical player identity moved to `team_players.id` UUID; same-name players may coexist.
- Team neutrality: removed operational team/staff/player hardcodes from runtime product logic.
- Team Facilities Foundation: `team_facilities` is the canonical source for training facilities; historical event locations do not become facilities.
- Team Profile persistence: authenticated saves commit local cache only after Supabase confirms the `teams` UPDATE.
- Team logo uploads use versioned immutable storage paths so a failed profile UPDATE cannot overwrite the currently referenced logo asset.

- Player Profile Identity: `player_profiles.player_id` now references canonical `team_players.id`; persistent profile upsert uses UUID, reads are team-scoped through the roster relation, with safe legacy backfill/fallback.

## Known technical debt
- `player_key` remains only for legacy compatibility in roster/profile migration paths.
- Some pre-R13 slug-based player profiles may remain unresolved if their legacy key is ambiguous; they are intentionally not auto-linked.
- Failed Team Profile writes after a successful versioned logo upload can leave an unreferenced storage object; this is safe for data integrity but may need later garbage collection.

## Product scope
- STAFF remains intentionally mono-team. Multi-team switching / `activeTeamId` is out of scope unless this product decision is explicitly revisited.

## Next architecture candidates
- Optional storage garbage collection for unreferenced versioned team logos.


## B2.4 R14 — Callups Print Stabilization
- Print Engine HTML stabilizzato con handshake `postMessage` opener→print page oltre al fallback storage.
- La pagina di stampa attende font, immagini, frame e paint prima di invocare `window.print()`.
- Aggiunto controllo specifico contro documenti Convocazioni vuoti/bianco.
- Nessuna modifica al modello dati o alla Rosa canonica.


## B2.4 R15 — Match Report Workspace
- La sezione Report del Match Workspace non è più un placeholder.
- Il documento legge il `match_report` già salvato nelle note canoniche dell’evento Calendario.
- Nessuna nuova tabella e nessuna seconda copia del report: stessa partita, stessa fonte dati.
- Il Report può essere ristampato/salvato PDF usando il Print Engine condiviso stabilizzato in R14.
- Se il report non esiste ancora, il workspace guida direttamente ad Analisi gara.


## B2.4 R16 — Workspace Session Restore
- Il ritorno sulla scheda browser non ridisegna più STAFF per eventi auth Supabase ripetuti dello stesso utente.
- Ogni apertura vista riuscita persiste centralmente la route attiva.
- Un vero reload ripristina anche le route contestuali del Match Workspace, non soltanto le voci presenti nel menu laterale.
- Le route Match vengono ripristinate solo se `staff-active-match` punta ancora a una partita valida; altrimenti fallback sicuro a Match Library.


## B2.4 R17 — Post Gara Foundation
- La settima sezione del Match Workflow non è più un placeholder.
- Debrief, aspetti positivi, criticità, priorità del microciclo, follow-up individuali e link materiali vivono nelle note canoniche della stessa partita Calendario.
- Il salvataggio rilegge l'evento fresco e preserva Match Report, Studio avversario e altri metadati già presenti.
- Nessuna nuova tabella e nessun archivio parallelo.


## B2.4 R18 — Match Engine Closure Review
- Match Library organizzata per mese, coerentemente con la Training Library.
- I gruppi mensili sono ordinati dal più recente e mantengono ricerca, filtri, apertura e cancellazione delle gare.
- Durante i filtri, i mesi senza risultati vengono nascosti e i conteggi vengono aggiornati.
- Corretto il dominio `homeAway`: `neutral` non viene più degradato a `home` nella Match Library.
- Nessuna modifica allo schema Supabase.


### R18.1 — Match Library Search Consistency
- Le query testuali uguali a una competizione canonica (`Coppa`, `Campionato`, `Amichevole`) vengono interpretate come filtro competizione esatto, evitando collisioni lessicali con nomi squadra come `Copparese`.
- Il contatore globale della Match Library ora riflette i risultati effettivamente visibili dopo ricerca e filtri.


## B2.4 R19 — Season Calendar Import Foundation
- Calendario espone `Importa calendario stagione`.
- Pipeline separata in source parsing → normalizzazione → validazione → preview modificabile → duplicate check → commit.
- Il commit crea eventi Match canonici tramite Match Calendar Service; Match Library continua a derivare dagli stessi eventi.
- Foundation operativa con CSV strutturato. PDF/immagine sono sorgenti future dello stesso importer e non devono introdurre una seconda logica di persistenza.
- Duplicati iniziali: stessa data + stesso avversario vengono saltati.


### R19.1 — Season Calendar Import UI Stabilization
- Import modal riallineato ai componenti e token visivi nativi di STAFF.
- Eliminato il contrasto light involontario e corretto header/close del dialog.
- File picker dichiara già PDF/immagine/CSV; PDF e immagini non vengono interpretati falsamente come CSV finché l'estrattore documentale non è collegato.



## B2.4 R19.2 — Calendar Bulk Management & Safe Reset
- Header Calendario semplificato: `Oggi` resta visibile; `Nuovo evento`, `Importa calendario stagione` e `Gestisci / elimina eventi` confluiscono nel menu `Azioni`.
- Gestione massiva disponibile per intervallo date, tipo evento, competizione e intero calendario.
- Ogni operazione mostra preview, conteggi per tipo, numero eliminabile e numero protetto.
- Eventi con lavoro tecnico collegato sono protetti automaticamente: Training Sheet collegata; Match Report, Studio avversario o Post gara presenti.
- Il delete massivo invia al database solo gli ID eliminabili e richiede checkbox + conferma finale.
- Un intervallo date vuoto non equivale mai a “tutto il calendario”.



## B2.4 R19.3 — Product Identity & Terminology Consistency
- Dashboard e Calendario non mostrano più stagione/categoria hardcoded: usano il profilo squadra canonico.
- Il Calendario mostra la categoria soltanto quando configurata.
- Match Library non espone più lo stato utente `Match Sheet disponibile`; usa `Partita pronta`, coerente con il Match Workspace nativo.
- Nessuna nuova persistenza o schema dati.



## B2.5 R20 — UI Polish 1.0 Foundation
- Prima release esclusivamente visuale dopo la chiusura funzionale R19.
- Introdotti token UI dedicati per superfici, bordi, testo, accento, radius, shadow e focus.
- Sidebar, topbar, gerarchia pagina, navigazione attiva, azioni e stepper Match riallineati a un linguaggio visivo unico.
- Migliorati densità desktop, respiro delle pagine e focus accessibile; mantenuto il comportamento responsive esistente.
- Nessuna modifica a persistenza, workflow, route, permessi o dominio.
- Il CSS storico resta volutamente compatibile: la foundation R20 è uno strato controllato; consolidamento/rimozione override sarà un lavoro successivo, non mescolato alla UI Polish.



## B2.5 R20.1 — Design System Core
- Rimossa la banda scura full-width della topbar: profilo mantenuto accessibile su header trasparente.
- Sidebar semplificata: logo + nome squadra leggibile; categoria nascosta nella brand area.
- Centralizzati Button, form controls, Page Header, spacing, surfaces, focus e responsive in `design-system/polish.css`.
- I pulsanti di azione mantengono il testo su una sola riga; sono i contenitori a gestire il wrapping.
- Match stepper e Training stepper iniziano a convergere sulla stessa grammatica visuale.
- Rimosso il layer provvisorio `--ui-*`: il Design System usa solo i token canonici `--staff-*`.
- `polish.css` viene caricato dopo CSS legacy/moduli per usare la cascade senza nuovi `!important`.
- Nessuna modifica a dominio, dati, workflow, permessi o persistenza.



## B2.5 R20.2A — Shell + Training Visual Redesign
- UI audit completo salvato in `docs/STAFF_UI_AUDIT_R20.md` con roadmap R20 congelata.
- Prima fase visuale limitata a Shell + Training Editor.
- Topbar desktop resa flottante: non occupa più una banda full-width; sui viewport medi torna nel flusso per evitare collisioni.
- Training header, azioni, six-step navigation, section cards, session grid, roster, load, phases, pillars e footer sono stati riproporzionati.
- Gli step Training restano su una riga desktop; sotto 1080px passano a griglia senza scrollbar orizzontale.
- `Apri TS`, `Reset editor`, navigazione footer e azioni fase convergono sulle primitive Button condivise.
- Nessun intervento funzionale sul Training Engine e nessuna modifica Match in questa fase, salvo il margine di sicurezza del floating profile.

## B2.5 R20.2A-R1 — Training visual corrective pass
- Training Sheet Editor only; Match untouched.
- Header forced into a stable desktop hierarchy; title no longer collapses into three lines.
- Section headings converted from oversized full-width banners to compact left-aligned identities.
- Steps 01/02/03/05 now use coherent content panels while Step 04 phase cards are preserved.
- Stepper density reduced and spacing normalized.
- No workflow/domain/data changes.
- Static R20.2A and Training Steps checks pass. Build could not be re-run in the sandbox because the configured npm registry does not currently provide the locked Vite 8.1.5 package.

## M1.1 — Mobile Responsive Contract
- Baseline: STAFF 0.18.37 production-stable.
- Introduced `design-system/responsive.css` as the canonical home for shared mobile variables and opt-in responsive primitives.
- Canonical new responsive tiers: compact mobile ≤390px, mobile ≤760px, tablet/compact ≤980px, desktop >980px.
- Centralized page gutter, 48px touch target, safe-area insets, mobile navigation dimensions and dynamic viewport-height fallback.
- Added a formal Mobile Responsive Contract covering shell, navigation, page actions, forms, dense data, Training, Match, Calendar, PWA gate and regression safety.
- Existing legacy breakpoints remain untouched in M1.1; consolidation is progressive and must not become a mass CSS rewrite.
- No domain, workflow, Supabase, permissions or persistence changes.
