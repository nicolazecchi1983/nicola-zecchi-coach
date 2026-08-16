# STAFF 0.29.11 — Match Squad v2 · Player Number & Soccer Board Foundation

## Decisioni canoniche

### Numero di maglia
- `team_players.shirt_number` è il numero stagionale opzionale del giocatore.
- Un giocatore dilettante può non avere alcun numero stagionale.
- Il numero non è identità: l'identità persistente della Rosa resta `team_players.id`.
- Quando presente, il numero stagionale deve essere 1–99 e non può essere assegnato a due giocatori attivi tramite il flusso applicativo.

### Numero gara
- Ogni slot dell'Undici iniziale parte con fallback 1–11.
- Se viene selezionato un giocatore con numero stagionale, il numero gara adotta quel valore.
- Se viene selezionato un numero che appartiene in modo univoco a un giocatore, STAFF seleziona quel giocatore.
- Se il numero non è assegnato o è ambiguo, rimane un numero gara e non modifica la Rosa.
- La panchina mostra il numero stagionale quando presente, altrimenti mantiene fallback 12–20.

### Header Match Workspace
- Eyebrow + titolo + stepper sono sufficienti a fornire contesto.
- I subtitle descrittivi statici non fanno parte del canonical Match header.
- Le descrizioni possono restare metadata di dominio, ma non vengono renderizzate nell'header.

### Nostra squadra UI
- Riga 1: Sistema di gioco / Sistema personalizzato / Contenuto pedine.
- Riga 2: Capitano / Vicecapitano, come normali field premium della stessa famiglia dei controlli.
- Core: Campo di gioco | Undici iniziale.
- Panchina: A DISPOSIZIONE + Distinta, senza copy ridondante.
- `matchSquad.css` possiede campo nativo, pedine, lineup e responsive del componente.
- Il campo nativo converge visivamente verso Soccer Board senza dipendere dal Match Sheet legacy.
