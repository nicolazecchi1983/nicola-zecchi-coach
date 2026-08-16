# DS2.1 — Dashboard Polish

## A. Diagnosi
La Dashboard aveva tre problemi principali: gerarchia debole tra prossime partite e allenamenti, troppe mini-card annidate, calendario settimanale mobile compresso in sette colonne con perdita di titolo e metadata.

## B. Priorità
- P1: calendario mobile non realmente adattivo.
- P1: prossima partita non abbastanza dominante rispetto ai contenuti secondari.
- P1: training history trattata come stack di card anziché lista operativa.
- P2: gradienti, sollevamenti hover e badge decorativi residui.

## C. Benchmark
- Apple HIG Layout: allineamento e struttura devono migliorare scansione e gerarchia.
- Material 3 Cards: una card deve rappresentare un soggetto/contenitore con uno scopo chiaro, non ogni riga di dati.
- web.dev Responsive Design: il layout deve cambiare in funzione dello spazio, non limitarsi a comprimersi.

## D. Proposta STAFF
La Dashboard diventa una overview operativa: prossime partite e allenamenti sono i due blocchi primari; il calendario settimanale è una superficie di scansione più leggera.

## E. Desktop
Due colonne primarie con maggiore peso alle partite. Calendario settimanale a 7 colonne sotto, senza card pesante esterna.

## F. Mobile
Blocchi primari in colonna. Il calendario diventa agenda verticale giorno/eventi, mantenendo titolo e metadata leggibili.

## G. Design System
Usa solo token STAFF per surface, border, typography, spacing, motion e semantic colors. Nessun nuovo breakpoint, colore raw o !important.

## H. Implementazione
Owner: `src/modules/dashboard/dashboardPolish.css`. La view e gli event hook restano invariati.

## I. Regression checklist
Dashboard desktop/tablet/mobile; apertura evento; apertura Calendario; oggi; match types; allenamenti senza TS; empty states; nessuno scroll orizzontale mobile.
