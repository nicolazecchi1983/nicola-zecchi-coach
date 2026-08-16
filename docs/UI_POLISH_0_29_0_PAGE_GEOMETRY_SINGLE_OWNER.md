# STAFF 0.29.0 — Page Geometry Single Owner

## Obiettivo
Aprire la nuova fase UI/UX eliminando la principale ambiguità strutturale rimasta nella geometria delle pagine.

## Finding
`pageShell.css` era dichiarato owner canonico di `#viewRoot`, ma `polish.css`, `training-editor.css`, `responsive.css` e `productUi.css` conservavano ancora regole concorrenti o padding annidati. Training e Match potevano quindi accumulare un secondo gutter dentro il page root, soprattutto tra desktop e mobile.

## Modifica
- `pageShell.css` resta l'unico owner dei gutter esterni e del ritmo verticale di pagina.
- Safe-area mobile integrata nel Page Shell.
- Rimosso il vecchio bottom reserve legato alla bottom navigation ormai ritirata.
- `product-page-shell` mantiene max-width e navigazione di dominio, ma non aggiunge un secondo padding esterno.
- Rimossi gli owner geometrici residui da `polish.css`, `training-editor.css` e `responsive.css`.
- Aggiunto guard `check-page-geometry-single-owner.mjs`.

## Non cambia
- nessun workflow;
- nessuna persistenza;
- nessun colore/branding;
- nessun contenuto;
- nessun comportamento Match/Training.

## Direzione UI
Questa release è una baseline strutturale: dalla prossima iterazione il polish può essere fatto pagina-per-pagina senza compensazioni di padding/gutter tra layer.
