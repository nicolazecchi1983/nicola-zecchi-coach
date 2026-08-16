# Engineering Hardening 0.26.5 — UI / HTML Code Health

## Scope

Questa release chiude i warning strutturali emersi durante il Runtime Bug Hunt senza avviare ancora il redesign estetico.

## Interventi

- Tutti gli `input`, `select` e `textarea` renderizzati dai moduli applicativi dichiarano ora almeno `name` o `id`.
- Il documento principale dichiara `lang="it"`.
- Il caricamento di Inter è stato spostato dal vecchio `@import` di `style.css` al `<head>` del documento, evitando che il bundling Vite collochi un `@import` dopo altre regole CSS.
- Il ciclo di vita della preview PDF resta invariato e continua a creare e revocare l'Object URL. Il warning Chrome relativo ai Blob URL partizionati viene monitorato ma non viene aggirato con soluzioni peggiori finché il flusso PDF è funzionalmente corretto.

## Guardrail

`npm run check:ui-code-health` verifica che:

1. la lingua del documento sia italiana;
2. il font venga caricato nel document head;
3. non restino `@import` Google Fonts nel CSS legacy;
4. non esistano controlli form senza `id`/`name` nel markup generato dai moduli;
5. la preview PDF continui a revocare l'Object URL creato.

Il check è incluso nella release gate `npm run check`.

## Confine della release

Nessun redesign, nessun cambio di workflow, nessuna modifica a Supabase o al dominio. Il Design System v1 resta la fase successiva alla stabilizzazione tecnica.
