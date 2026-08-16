# DS2.3 — Training Command Bar Structural Consolidation

Versione: 0.27.10

## Perché

Il command row mobile del Training Editor era governato da più generazioni di regole responsive sovrapposte. Le patch M1.3B, M1.3C, M1.3D e DS2.3-R5/R6/R7 descrivevano geometrie diverse dello stesso componente. Il cascade decideva quale regola vincesse, ma width/min-width/grid precedenti restavano una fonte di regressioni e rendevano difficile prevedere il risultato reale a 390px.

## Decisione

- `src/modules/training/trainingCommandBar.css` è l'unico owner base desktop/tablet del blocco TS pubblicata.
- `src/design-system/responsive.css` contiene un solo owner mobile canonico per lo stesso blocco.
- Mobile usa una griglia strutturale `minmax(0, 1fr) 44px 44px`.
- Il select riceve tutto lo spazio residuo; Apri TS e More restano target fissi da 44px.
- Lo stato Bozza è separato in una seconda riga e non compete con le azioni.
- Le vecchie patch responsive del command row sono rimosse, non sovrascritte.

## Fuori scope

Nessuna modifica a dominio Training, stato applicativo, servizi, Supabase, pubblicazione, PDF, calendario o workflow.

## Guardrail

`check:training-command-bar-structure` verifica owner, import order, geometria mobile, touch target, assenza delle vecchie ownership e inclusione nella release gate.
