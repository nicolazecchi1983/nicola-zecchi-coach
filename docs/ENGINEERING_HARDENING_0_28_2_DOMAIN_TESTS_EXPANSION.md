# STAFF 0.28.2 — Domain Tests Expansion

## Scope

Release di hardening senza modifiche runtime. Estende la suite Vitest comportamentale ai due moduli parser/validator ad alta criticità rimasti fuori dalla Test Foundation 0.26.1.

## Nuova copertura

### Match Analysis Schema
`tests/domain/matchAnalysisSchema.test.js`

Protegge:
- template STAFF canonico;
- normalizzazione schema v2;
- migrazione legacy v1;
- fallback dai campi legacy;
- serializzazione e rilevamento note;
- definizione template e flattening entries.

### Training Sheet Parser
`tests/domain/trainingSheetParser.test.js`

Protegge:
- estrazione data/ora/campo/focus/carico;
- costruzione e durata delle fasi;
- orario parlato e input fuori range;
- riconoscimento assenze/infortuni dalla Rosa;
- campi obbligatori mancanti;
- formato esercitazione da confermare.

## Guardrail

`check:test-foundation` ora richiede esplicitamente entrambi i file e verifica che importino i moduli di dominio reali.

## Architecture review

Nessuna logica applicativa è stata modificata per far passare i test. I test descrivono il comportamento attuale e rendono visibili future modifiche semantiche dei parser.


## Finding emerso dai test

La prima stesura del test combinava nello stesso testo le sezioni `assenti per infortunio` e `assenti per altri motivi`. Il parser attuale può far proseguire la prima sezione nella seconda, classificando quindi un assente anche come infortunato. La 0.28.2 non modifica runtime: il caso è registrato come debito/bug da correggere in una release dedicata con test rosso→verde.
