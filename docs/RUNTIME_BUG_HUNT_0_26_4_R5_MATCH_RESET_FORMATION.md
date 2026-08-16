# 0.26.4-R5 — Match Reset Formation Runtime

## Bug
In Match Library → Nostra squadra, il comando "Azzera posizioni" poteva non produrre alcun effetto visibile/runtime.

## Correzione
- Il reset è ora gestito dal binding core delegato del Legacy Match runtime.
- Le 11 coordinate vengono riscritte dalla geometria canonica del sistema selezionato.
- Per sistemi personalizzati non validi viene applicato un fallback sicuro 4-4-2 invece di lasciare il comando in no-op.
- Il reset aggiorna il report e persiste immediatamente il nuovo stato.
- Il binding viene registrato prima dei widget Match opzionali, così errori secondari non possono disattivare il comando.

## Regressione
Nuovo gate: `check:match-reset-formation-runtime` (8/8).
