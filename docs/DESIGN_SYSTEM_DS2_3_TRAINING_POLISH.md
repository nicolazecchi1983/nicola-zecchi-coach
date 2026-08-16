# DS2.3 — Training Polish

## A. Diagnosi
Training aveva già un buon workflow a sei sezioni, ma la superficie visuale portava ancora molte stratificazioni legacy: pannelli con colori raw, controlli MD/rating trattati come mini-card separate, quattro colori decorativi diversi sui pilastri, header utility più pesante del necessario e numerose regole mobile sovrapposte. Il flusso era funzionale ma non ancora governato dalla stessa grammatica pulita di Dashboard e Calendario.

## B. Priorità
- P1: rendere Training un workbench guidato, non una sequenza di pannelli indipendenti.
- P1: ridurre colore decorativo e far emergere soltanto selezione/stato.
- P1: mantenere le azioni Avanti/Indietro raggiungibili durante la compilazione.
- P1: rendere mobile realmente operativo per uso a bordo campo con controlli full-width e disclosure.
- P2: alleggerire header utility, preview chrome e microgerarchie.

## C. Benchmark
- Apple HIG Layout / Disclosure Controls: progressive disclosure riduce complessità e mantiene visibili prima le informazioni più comuni; applicato alla Rosa e alle opzioni avanzate delle fasi.
- web.dev Responsive Design / Forms: layout e controlli devono adattarsi al dispositivo e i touch target principali devono restare sufficientemente grandi; applicato ai controlli Training mobile e al footer operativo.
- STAFF Design System v1: il dominio compone Foundation/Primitives/Product UI senza introdurre palette o primitive parallele.

## D. Proposta STAFF
Training resta un flusso a sei sezioni. Ogni step mostra una sola area operativa principale, con superfici calme e controlli che acquistano enfasi soltanto quando selezionati. Le card restano solo dove hanno semantica reale: una fase allenamento è un oggetto editabile; un singolo campo o pulsante non lo è.

## E. Desktop
Header a due zone: contesto/obiettivo a sinistra, comando per Training Sheet pubblicate a destra. Step 1-3 usano superfici operative fino a 1180px per migliorare leggibilità. Rosa usa disclosure; Match Day e rating diventano segmented controls coerenti. Fasi restano card editabili. Preview centrata e con chrome quieto. Footer step sticky ma dentro il flusso pagina.

## F. Mobile
Contesto d'uso primario: allenatore a bordo campo con smartphone in una mano. Controlli principali >= 48px, form a colonna singola, Rosa in disclosure verticali, MD su tre colonne senza scroll orizzontale, metriche a cinque target equivalenti, fasi full-width, footer Avanti/Indietro sempre raggiungibile. Tablet/spogliatoio mantiene densità maggiore dove lo spazio lo consente.

## G. Design System
Riutilizza esclusivamente token STAFF esistenti per palette, spacing, typography, radius, control height, motion, focus e content width. Nessun token parallelo. Selected state dei Pilastri converge sull'accent STAFF invece di quattro colori decorativi.

## H. Implementazione
Owner desktop/base: `src/modules/training/trainingPolish.css`.
Owner adattamento mobile finale: sezione DS2.3 in `src/design-system/responsive.css`, che rimane l'ultimo layer responsive canonico.
Markup, hook `data-*`, dominio, stato, servizi, Supabase, PDF e workflow restano invariati.

Fuori scope: nessuna modifica a pubblicazione TS, Calendario, PDF/stampa, autosave, parser voce, logica Rosa, statistiche o persistenza.

## I. Regression checklist
Training desktop/notebook/tablet/mobile; apertura TS pubblicata; step 1-6; Rosa e ricerca; Aggregati; Match Day; intensità/volume; aggiunta/rimozione/split fasi; lavori paralleli; pilastri; analisi esercitazioni; textarea; preview; PDF; Avanti/Indietro; reset; focus tastiera; touch target; nessuno scroll orizzontale involontario.

## Visual debt budget
La fase non introduce nuovi `!important`, colori HEX locali, breakpoint arbitrari o primitive visive parallele. I breakpoint nuovi del domain owner sono solo canonici; il mobile finale resta nel responsive owner esistente.
