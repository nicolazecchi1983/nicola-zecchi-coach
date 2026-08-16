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


## 0.18.40 — M1.2-R1 Real Device Mobile Corrective

Baseline derived from Android production testing. The release stays inside the Mobile Compatibility track and does not introduce new product features.

- mobile typography and descriptive-copy density reduced;
- `Altro` requires visible section labels;
- Training Match Day wraps into a grid instead of horizontal scrolling;
- Match Workspace navigation becomes readable without sideways scrolling;
- callups selected counter remains inside its layout;
- own/opponent pitch surfaces use the available mobile width and tokens scale down;
- tactical Board tokens scale down and Android color changes persist on both `input` and `change`;
- minutes played are rendered as a readable mobile list rather than compressed bars;
- staff avatars/actions are compacted; destructive actions no longer dominate the card;
- Match Report mobile preview and bench list are made single-column/readable;
- print page adds a mobile settle delay before invoking the OS print service. This is hardening and still requires real-device verification.

No database or Supabase schema changes.

## 0.19.0 — M2.0 Configurable Match Analysis
- Product rule: STAFF supplies structure without imposing one coach's methodology.
- Shared analysis schema introduced for `Studio avversario`, `Avversario` and `Analisi gara`.
- Only three macro-phases are canonical: Possesso, Non possesso, Transizioni.
- Subphases are optional and user-created; suggested labels are shortcuts, never mandatory stored fields.
- Legacy fixed analysis fields remain read-compatible for older Match data; new editing writes the shared JSON schema.
- Match Report consumes the same schema instead of owning a fourth hardcoded taxonomy.
- Studio avversario keeps persistence inside the canonical Calendar event notes; no new Supabase table introduced.
- Captain/Vice selectors are now the canonical form fields themselves, removing hidden duplicate UI state.
- Match Workspace and Match Library move toward neutral STAFF surfaces; visible Match ID removed; desktop Match navigation uses a fixed seven-column grid without horizontal scrolling.
- Training Library filters are collapsed behind a single `Filtri` control while existing filter hooks remain unchanged.
- Architecture contract documented in `docs/STAFF_MATCH_ANALYSIS_SCHEMA.md`.

## 0.25.0 — Recovery Baseline Candidate
- Derived exclusively from the certified 0.24.5 Recovery baseline after full local `npm run go` validation.
- Fixed regression contracts for the Match bench model so tests reflect the canonical 9 fixed bench slots (12–20) and structural 20-player cap.
- No product feature, domain, persistence, route, permission or Supabase schema change introduced by the recovery itself.
- Purpose: establish a protected, reproducible starting point for the next 0.25 development work without modifying the certified 0.24.5 baseline.

## Engineering Hardening 0.28.7 — Calendar Error UX Expansion
- Estesa al Calendario la foundation 0.28.6 per i messaggi utente dopo errori data-access.
- Coperti: creazione evento, modifica evento, eliminazione evento, import calendario stagione e cancellazione massiva.
- I messaggi raw Supabase/network non vengono più mostrati direttamente in questi flussi.
- Nessun retry aggiunto; CREATE, DELETE e BATCH restano fuori dalle policy automatiche salvo futura review di idempotenza.
- Nessuna modifica a schema, persistenza, workflow, permessi o collegamenti Match/Training.

## Engineering Hardening 0.28.8 — Calendar Read Resilience Completion
- Le letture canoniche Calendario `listCalendarEvents` e `getCalendarEvent` usano ora la policy condivisa `READ` con retry automatico limitato ai soli errori transitori.
- Il caricamento Calendario non espone più `Errore Supabase` o dettagli raw all’utente: usa il formatter centralizzato della 0.28.6.
- Nessun retry aggiunto a CREATE/UPDATE/DELETE/import/bulk; nessuna modifica a schema, persistenza o workflow.


## Engineering Hardening 0.28.9 — Raw Error Message Exposure Guard
- Audit mirato dei sink UI che mostravano direttamente `error.message` / `error?.message`.
- Residui migrati al formatter centralizzato in Staff, Player Profile, Training, Match e Calendario.
- Aggiunto guard permanente `check-raw-error-message-exposure` alla pipeline `npm run check`.
- Logging interno/console non rimosso; nessun retry, schema, persistenza, workflow o permesso modificato.

## Engineering Hardening 0.28.10 — Error UX Stage Fallback Centralization
- Centralizzati i fallback utente Error UX nella mappa canonica `stage -> fallback` di `dataAccessUserFeedback.js`.
- I flussi già migrati in Calendario, Staff, Rosa, Training e Match non duplicano più stringhe di fallback locali.
- Il fallback esplicito resta supportato per compatibilità legacy; `AppError.userMessage` e i messaggi classificati continuano ad avere precedenza.
- Aggiunto `check:error-ux-stage-fallbacks` alla pipeline per impedire nuova duplicazione dei fallback nei call-site staged.
- Nessuna modifica a retry, schema, persistenza, workflow, route o permessi.

## Engineering Hardening 0.28.11 — Error Diagnostics Foundation
- Aggiunta diagnostica tecnica centralizzata per gli errori trasformati in messaggi utente sicuri.
- Ogni passaggio attraverso `getDataAccessUserMessage` registra `stage`, classificazione, retryability, status/source code e messaggio tecnico limitato.
- Sink predefinito `console.error`, con logger iniettabile per una futura integrazione osservabilità senza modificare i moduli feature.
- La diagnostica non può interrompere il flusso utente e non modifica i messaggi Error UX introdotti nelle 0.28.6–0.28.10.
- Aggiunto `check:error-diagnostics-foundation` alla pipeline.
- Nessuna telemetria esterna, retry aggiuntivo, modifica a schema, persistenza, workflow, route, permessi o UI.
- Questa release chiude il tratto Engineering Hardening pianificato prima del ritorno alla UI/UX strutturale.

## UI/UX 0.29.1 — Match Workspace Shell Visual Hierarchy
- Ripresa ufficiale del polish MATCH dopo la baseline geometrica 0.29.0.
- Le sette sezioni Match continuano a usare un solo `matchWorkspaceShellHtml`; nessun workflow o route duplicato.
- Header Match trasformato in una superficie contestuale compatta con eyebrow, titolo, descrizione e ritorno partita chiaramente separati.
- Navigazione Match resa più densa e leggibile: step desktop più bassi, stato attivo con rail accent dedicato, tablet e mobile adattivi senza scroll orizzontale.
- Il Product UI condiviso conserva la geometria comune; il nuovo emphasis resta domain-scoped in `matchWorkspace.css`.
- Nessuna modifica a Nostra squadra, Avversario, Convocazioni, Analisi, Report o Post gara nel loro contenuto interno.
- Aggiunto `check:match-workspace-shell-polish` alla pipeline.


## UI/UX 0.29.2 — Match Direct Entry

- Match Library apre direttamente `Studio avversario` (step 01) dopo la selezione della gara.
- Lo stesso direct-entry vale per creazione/apertura partita dal form Match Library.
- La schermata `match-workspace` resta registrata solo per compatibilità interna; il restore di una vecchia sessione su quella route viene normalizzato allo step 01.
- Il controllo di ritorno delle sezioni porta alla Match Library e non alla landing intermedia.
- Nessuna modifica a dati, workflow dei sette step o persistenza Match.
- Guard dedicato: `check:match-direct-entry`.

## UI/UX 0.29.3 — Match Analysis Macroarea Cards

- Le quattro macroaree dell'Analysis Engine diventano card operative grandi in griglia 2x2 su desktop.
- La semantica `<details>` e tutta la logica esistente di snapshot/autosave restano invariate.
- Una macroarea aperta occupa l'intera larghezza dell'editor per mantenere leggibili nota generale e sottofasi.
- Stato hover/open reso più evidente senza introdurre una nuova palette o nuovi owner CSS.
- Su mobile le macroaree tornano a una singola colonna con hit-area ampia.
- Aggiunto `check:analysis-macroarea-card-grid` alla pipeline.

## UI/UX 0.29.4 — Match Squad Operational Composition
- `Nostra squadra` ripulita dal vecchio header interno duplicato: identità pagina e step restano responsabilità esclusiva del Match Workspace Shell.
- Toolbar formazione ricomposta in gruppi operativi: sistema, contenuto pedine, leadership e reset, senza cambiare field names o runtime.
- Campo reso protagonista ma con larghezza massima controllata per mantenere allineamento con undici iniziale e panchina.
- Undici iniziale compattato con ritmo costante; panchina resa superficie secondaria.
- Tablet e mobile mantengono composizione adattiva senza introdurre un secondo responsive owner.
- Nessuna modifica a drag, selezioni, capitano/vice, panchina, persistenza o workflow.
- Guard dedicato: `check:match-squad-operational-polish`.

## UI/UX 0.29.5 — Match Squad Structural Recomposition
- `Nostra squadra` ricomposta alla fonte dopo la review visuale della 0.29.4: niente catena di micro-fix sul layout precedente.
- La panchina esce dalla colonna destra nel DOM e diventa una sezione autonoma a tutta larghezza sotto il blocco operativo principale.
- Il corpo desktop segue il contratto `Campo | Undici iniziale` con priorità visiva circa 60/40 e altezza coerente tra le due aree.
- La fascia controlli formazione viene compressa mantenendo invariati nomi dei campi, hook runtime, leadership e reset.
- La panchina usa una griglia orizzontale 3 colonne desktop, 2 tablet, 1 mobile, eliminando il grande vuoto sotto il campo.
- Ridotte le surface annidate tramite bordi/background più leggeri, senza introdurre una nuova palette.
- Nessuna modifica a drag, selezione titolari, panchina, distinta, capitano/vice, persistenza o workflow Match.
- Guard dedicato: `check:match-squad-structural-recomposition`.

## UI/UX 0.29.6 — Match Squad Leadership Readability
- `Capitano` e `Vicecapitano` sono ora etichette esplicite e non comprimibili nella toolbar di Nostra squadra.
- Il gruppo leadership riceve una larghezza minima dedicata: i nomi selezionati non vengono sacrificati alla simmetria della command strip.
- A larghezze intermedie Capitano/Vicecapitano occupano una riga completa prima di comprimere i select; su mobile i due controlli si impilano.
- Nessuna modifica a hook runtime, selezione titolari, distinta, persistenza o dominio Match.

## UI/UX 0.29.7 — Match Squad Command Architecture
- La fascia superiore di `Nostra squadra` viene rifatta come componente strutturale, non come ulteriore micro-fix CSS.
- Il command strip separa esplicitamente configurazione formazione, contenuto pedine e leadership in gruppi DOM distinti.
- `Capitano` e `Vicecapitano` possiedono una riga dedicata con larghezze minime leggibili per label e nome selezionato.
- `Azzera posizioni` cambia owner: esce dal command strip e diventa azione contestuale del `pitch-panel`, nel relativo header.
- Il contratto `Campo | Undici iniziale` + panchina autonoma full-width della 0.29.5 resta invariato.
- Il blocco CSS finale 0.29.5/0.29.6 viene consolidato in un solo owner canonico 0.29.7, evitando una catena di override successivi.
- Nessuna modifica a field names, hook runtime, drag, selezione titolari, distinta, persistenza o dominio Match.
- Guard dedicato: `check:match-squad-command-architecture`.

## UI/UX 0.29.8–0.29.9 — Match Squad Canonical Isolation
- `Nostra squadra` ritira le classi toolbar legacy dal proprio markup e rende configurazione e leadership due righe strutturalmente separate.
- `matchSquad.css` diventa owner canonico del componente; gli owner globali/responsive concorrenti vengono ritirati dal perimetro nativo.
- `Azzera posizioni` resta azione contestuale del campo e il contratto `Campo | Undici iniziale` + panchina full-width viene preservato.
- La check suite passa a runner Node sequenziale per evitare il limite di lunghezza di `cmd.exe` su Windows; i contratti legacy leggono la nuova fonte `staffCheckSuite`.

## UI/UX 0.29.10 — Match Squad Visual System Rebuild
- Ricostruzione visiva stabile di `Nostra squadra` sopra l'architettura canonica: nessuna nuova generazione di override CSS.
- `matchSquad.css` possiede integralmente il campo nativo: prato, linee, aree, porte, pedine, label, drag/focus e stati leadership; `matchSheet.css` resta solo compatibility owner legacy.
- Leadership resa una surface premium integrata con label e nomi leggibili, mantenendo invariati i field name e gli hook runtime.
- `Undici iniziale` elimina i progressivi decorativi 01–11 dal markup; restano numero maglia e giocatore.
- Panchina semplificata a `A DISPOSIZIONE` + Distinta + nove slot, senza eyebrow/helper ridondanti.
- Guard dedicato: `check:match-squad-visual-system-rebuild`, incluso nella check suite canonica.
