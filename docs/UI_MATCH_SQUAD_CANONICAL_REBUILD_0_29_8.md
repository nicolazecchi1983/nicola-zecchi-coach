# STAFF 0.29.8 — Match Squad Canonical Rebuild

## Scope
Rebuild strutturale della UI `Nostra squadra` senza modifiche a dominio, persistenza o runtime Match.

## Owner canonico
`src/modules/match/ui/matchSquad.css` è l'unico owner della composizione del componente.
Le vecchie geometrie concorrenti in `src/style.css` e `src/design-system/responsive.css` sono state ritirate.

## Struttura
1. Command area: configurazione formazione + contenuto pedine.
2. Leadership row: Capitano + Vicecapitano con larghezza leggibile.
3. Core row: Campo di gioco + Undici iniziale.
4. Field action: `Azzera posizioni` nel header del campo.
5. Panchina autonoma full-width sotto il core.

## Vincoli preservati
- campo verticale 68/105;
- starter slots 11;
- bench slots 12–20;
- drag posizioni;
- reset formazione;
- captain/vice runtime hooks;
- token identity squadra;
- report/statistiche;
- responsive Match contract.

## Regression guard
`check-match-squad-canonical-rebuild.mjs` impedisce la reintroduzione di owner concorrenti e protegge la struttura Command → Core → Bench.
