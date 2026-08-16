# DS2.2 — Calendar Polish

## A. Diagnosi
Il Calendario desktop era ancora governato da molte regole legacy stratificate: celle compatte, eventi molto colorati, header mese ripetutamente sovrascritto e gerarchia debole tra data ed evento. Sul mobile la griglia mensile restava concettualmente desktop e comprimeva sette colonne, rendendo titoli e metadata difficili da leggere.

## B. Priorità
- P1: calendario mobile da rendere realmente adaptive, non compresso.
- P1: ridurre rumore cromatico e peso delle mini-card evento.
- P1: rendere il mese una superficie di pianificazione coerente col Design System.
- P2: rendere più calma la toolbar e più leggibile lo stato Oggi.

## C. Benchmark
- Material 3 Date Pickers: la rappresentazione data deve essere adatta al contesto in cui viene usata; STAFF non usa un date picker, ma adotta lo stesso principio di adattamento della rappresentazione.
- web.dev Responsive Design: il contenuto deve rientrare nel viewport senza scroll orizzontale involontario; quando la griglia non è più leggibile cambia struttura.
- Apple navigation guidance: pattern familiari e gerarchia chiara riducono confusione nei flussi complessi.

## D. Proposta STAFF
Desktop mantiene il mese a sette colonne come planning surface. Gli eventi diventano righe compatte, neutre e leggibili, con un solo rail laterale di categoria. Il colore non domina il contenuto. Mobile abbandona la griglia compressa e diventa agenda verticale data → eventi.

## E. Desktop
Toolbar mese centrata e quieta. Giorni con maggiore altezza utile. Oggi è indicato con accento sottile. Eventi con surface condivisa, bordi sottili, titolo e metadata leggibili.

## F. Mobile
I giorni del mese corrente diventano righe verticali con colonna data/weekday e colonna eventi. I filler del mese precedente/successivo non vengono mostrati. Titolo, orario, luogo e dettaglio evento restano visibili senza ellissi forzata. Nessuno scroll orizzontale.

Contesti verificati: allenatore a bordo campo con smartphone; collaboratore in spogliatoio con smartphone/tablet; analista/allenatore in ufficio con notebook/tablet.

## G. Design System
Riutilizza esclusivamente token STAFF già presenti per palette, spacing, radius, control height, typography, motion e focus. Nessun token parallelo, colore raw, `!important` o breakpoint locale.

## H. Implementazione
Owner: `src/modules/calendar/calendarPolish.css`. La view riceve solo markup presentazionale per weekday/date context; dominio, stato, servizi, Supabase e event hooks restano invariati.

Fuori scope: nessuna modifica a creazione/modifica/cancellazione eventi, import stagione, bulk management, Training/Match integration o persistenza.

## I. Regression checklist
Calendario desktop/notebook/tablet/mobile; prev/next mese; Oggi; menu Azioni; apertura evento; creazione da giorno; training/match/meeting/rest; valutazione Training; giorni muted; mese con molte attività; nessuno scroll orizzontale mobile; focus tastiera; touch target >= 44px.

## Visual debt budget
La fase non introduce nuovi `!important`, colori HEX locali, breakpoint arbitrari o primitive visive parallele. Il nuovo owner prevale per ordine di cascade e specificità normale.
