# Match Workspace Foundation — 0.21.0

## Regola architetturale

Le sette sezioni del Match Workspace condividono una sola struttura: `matchWorkspaceShellHtml`.

Lo shell possiede:
- larghezza e padding pagina;
- header e pulsante di ritorno;
- navigazione delle sette sezioni;
- distanza tra navigazione e contenuto;
- content root.

Le viste di sezione forniscono soltanto il contenuto specifico.

## Surface contract

`workspace-surface` è la superficie strutturale canonica. Colori, bordo, raggio e padding derivano dai token definiti in `matchWorkspace.css`.

## Compatibilità Mezzolara / Avversario

La logica del vecchio editor è temporaneamente riusata dentro `match-native-legacy-host`, ma il legacy host non può più possedere:
- max-width;
- margini pagina;
- header;
- navigazione;
- footer;
- geometria del workspace.

Il passo futuro corretto è estrarre progressivamente componenti funzionali dal legacy editor, senza reintrodurre una seconda page shell.

## Vincoli

1. Nessuna sezione può renderizzare direttamente `matchContextNavigationHtml`.
2. Nessuna sezione può definire una propria larghezza pagina.
3. Nessun tab può avere larghezza specifica per etichetta.
4. Post gara non può introdurre un secondo tema chiaro.
5. Desktop/tablet/mobile usano i breakpoint dello shell condiviso.
