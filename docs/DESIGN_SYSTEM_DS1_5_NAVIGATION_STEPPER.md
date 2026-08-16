# DS1.5 — Navigation & Stepper

STAFF 0.27.4 consolida la gerarchia di navigazione senza modificare route, workflow o dati.

## Decisioni

- Sidebar desktop: superficie neutra, categorie secondarie, stato attivo con un solo accento cyan sottile.
- Training e Match: un unico `product-section-nav`, più compatto (64px desktop), senza effetto card dominante.
- Stato attivo contestuale: superficie raised + indicatore inferiore cyan; nessuna ombra decorativa.
- Mobile: due colonne contestuali, altezza 60px, drawer globale coerente con la sidebar desktop.
- Nessun nuovo breakpoint, nessuna nuova palette e nessun nuovo owner di navigazione.

## Principio

La navigazione deve rispondere prima di tutto a “dove sono?” senza competere con il contenuto o con l'azione primaria della pagina.
