function rowHtml(row, index, escapeHtml) {
  const status = row.importStatus === 'duplicate' ? 'Già presente' : 'Nuova'
  return `<tr data-season-import-row="${index}">
    <td><input name="matchDay" value="${escapeHtml(row.matchDay)}" placeholder="1"></td>
    <td><input name="date" type="date" value="${escapeHtml(row.date)}"></td>
    <td><input name="time" type="time" value="${escapeHtml(row.time)}"></td>
    <td><input name="opponent" value="${escapeHtml(row.opponent)}"></td>
    <td><select name="homeAway"><option value="home" ${row.homeAway==='home'?'selected':''}>Casa</option><option value="away" ${row.homeAway==='away'?'selected':''}>Trasferta</option><option value="neutral" ${row.homeAway==='neutral'?'selected':''}>Neutro</option></select></td>
    <td><select name="competition"><option ${row.competition==='Campionato'?'selected':''}>Campionato</option><option ${row.competition==='Coppa'?'selected':''}>Coppa</option><option ${row.competition==='Amichevole'?'selected':''}>Amichevole</option></select></td>
    <td><span class="season-import-status is-${row.importStatus}">${status}</span></td>
  </tr>`
}

export function renderSeasonCalendarImportModal({ rows = [], escapeHtml }) {
  const hasRows = rows.length > 0
  return `<div class="new-event-modal-backdrop season-import-backdrop" data-close-season-import>
    <section class="new-event-modal season-import-modal" role="dialog" aria-modal="true" aria-label="Importa calendario stagione">
      <div class="new-event-modal__head"><div><span>CALENDARIO</span><h2>Importa calendario stagione</h2></div><button type="button" class="new-event-modal__close" data-close-season-import aria-label="Chiudi">×</button></div>
      <div class="season-import-intro"><strong>Una sola fonte dati.</strong><p>Le partite confermate vengono create nel Calendario e compariranno automaticamente nella Match Library.</p></div>
      ${!hasRows ? `<div class="season-import-source">
        <label class="season-import-drop"><input type="file" accept=".csv,text/csv,application/pdf,image/png,image/jpeg,image/webp" data-season-import-file><strong>Carica calendario stagione</strong><span>PDF, immagine oppure CSV. Prima di creare le partite STAFF mostra sempre l’anteprima da verificare.</span><small>PDF/immagine: collegamento estrattore documentale in preparazione · CSV già operativo</small></label>
        <details><summary>Formato CSV supportato</summary><code>giornata,data,ora,avversario,casa_trasferta,competizione<br>1,2026-09-06,15:30,Imolese,casa,Campionato</code></details>
      </div>` : `<form data-season-import-form>
        <div class="season-import-table-wrap"><table class="season-import-table"><thead><tr><th>G.</th><th>Data</th><th>Ora</th><th>Avversario</th><th>Campo</th><th>Competizione</th><th>Stato</th></tr></thead><tbody>${rows.map((row,index)=>rowHtml(row,index,escapeHtml)).join('')}</tbody></table></div>
        <div class="season-import-actions"><span data-season-import-message></span><button type="button" class="button" data-season-import-reset>Cambia file</button><button type="submit" class="primary-action">Importa ${rows.filter(r=>r.importStatus==='new').length} partite</button></div>
      </form>`}
    </section>
  </div>`
}

export function parseSeasonCalendarCsv(text = '') {
  const lines=String(text).replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim())
  if (lines.length < 2) return []
  const split=(line)=>line.split(/[;,]/).map(v=>v.trim().replace(/^"|"$/g,''))
  return lines.slice(1).map((line)=> {
    const [matchDay,date,time,opponent,homeAwayRaw,competition='Campionato',location='']=split(line)
    const h=String(homeAwayRaw||'').toLowerCase()
    const homeAway=h.includes('tras')||h==='away'?'away':h.includes('neutr')?'neutral':'home'
    return {matchDay,date,time:time||'15:30',opponent,homeAway,competition,location}
  })
}
