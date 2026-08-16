# STAFF — UI Component Design Protocol

Questo protocollo serve a evitare che un componente complesso venga corretto per tentativi successivi.

## Sequenza obbligatoria

**Mock approvato → contratto di geometria → owner unico → responsive → polish**

1. **Mock approvato**
   - definire prima la composizione completa del componente;
   - approvare gerarchia, proporzioni e priorità visive prima di scrivere CSS.

2. **Contratto di geometria**
   - dichiarare colonne, righe, larghezze, altezze, gap e breakpoint;
   - distinguere ciò che deve restare simmetrico da ciò che può adattarsi;
   - definire esplicitamente il comportamento desktop, tablet e mobile.

3. **Owner unico**
   - un solo stylesheet/componente possiede la geometria;
   - i layer legacy non possono ridefinire quel componente;
   - non aggiungere una nuova generazione di override per correggere quella precedente.

4. **Responsive prima del polish**
   - validare la struttura a tutte le larghezze importanti;
   - nessun testo essenziale deve essere troncato per preservare una simmetria arbitraria;
   - il layout deve degradare per regola, non per collisione.

5. **Polish finale**
   - solo dopo la stabilità strutturale: colori, ombre, bordi, micro-spacing, hover e dettagli premium.

## Gate di review

Un componente non è considerato chiuso finché non supera:
- contratto strutturale automatico;
- regression check del dominio;
- verifica desktop/tablet/mobile;
- confronto visivo con il mock approvato;
- controllo degli owner CSS caricati prima e dopo il componente.

## MATCH section spacing contract

For native MATCH pages, spacing between first-level operational surfaces is a shared shell concern, not a domain-local margin. Use `--match-section-gap` on desktop and `--match-section-gap-mobile` on compact layouts. Domain components may own only internal spacing inside their surfaces. Do not recreate external rhythm with `margin-top` / `margin-bottom` compensation.
