import { escapeHtml } from '../../../shared/html/escapeHtml.js'

const TS_DEPARTMENT_ORDER = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']

function toItalianTitleCase(value = '') {
  return String(value)
    .toLocaleLowerCase('it-IT')
    .replace(/(^|[\s'’-])([a-zà-ÿ])/g, (_, prefix, letter) => prefix + letter.toLocaleUpperCase('it-IT'))
}

export function createTrainingPresentationBuilders({ activePlayers }) {
  function getTrainingSheetRosterPlayers() {
    return activePlayers()
      .map((player) => {
        const canonicalName = toItalianTitleCase(player.name)
        const parts = canonicalName.trim().split(/\s+/)
        const surname = parts.pop() || ''
        const firstName = parts.join(' ')
        return {
          ...player,
          canonicalName,
          displayName: `${surname} ${firstName}`.trim(),
          surname,
          department: TS_DEPARTMENT_ORDER.includes(player.role) ? player.role : 'Difensore',
        }
      })
      .sort((a, b) => a.surname.localeCompare(b.surname, 'it', { sensitivity: 'base' }))
  }

  function trainingSheetResultHtml(result) {
    const data = result.data
    const absenceRows = [
      ...data.absences.injured.map(name => `<span class="ts-person-chip is-injured">${escapeHtml(name)}</span>`),
      ...data.absences.absent.map(name => `<span class="ts-person-chip">${escapeHtml(name)}</span>`),
    ].join('') || '<span class="ts-muted">Nessun assente riconosciuto</span>'

    const phases = data.phases.map((phase, index) => `
      <article class="ts-phase-card">
        <div class="ts-phase-title"><span>${index + 1}</span><input name="phase_${index}_title" value="${escapeHtml(phase.title)}"></div>
        <div class="ts-phase-fields">
          <label><span>Durata</span><input name="phase_${index}_duration" type="number" min="1" value="${phase.duration_minutes ?? ''}"></label>
          <label><span>Portieri</span><select name="phase_${index}_goalkeepers"><option value="false" ${phase.goalkeepers ? '' : 'selected'}>No</option><option value="true" ${phase.goalkeepers ? 'selected' : ''}>Sì</option></select></label>
        </div>
        <label><span>Descrizione</span><textarea name="phase_${index}_description">${escapeHtml(phase.description)}</textarea></label>
        <label><span>Contenitori</span><input name="phase_${index}_containers" value="${escapeHtml(phase.containers.join(' · '))}"></label>
        ${phase.exercises?.length ? `<div class="ts-exercise-list">${phase.exercises.map(ex => `<div><strong>${escapeHtml(ex.title)}</strong><span>${ex.duration_minutes ?? '—'}'</span></div>`).join('')}</div>` : ''}
      </article>
    `).join('')

    const missing = result.missing_fields.length
      ? `<div class="ts-checks is-warning"><strong>Da completare</strong>${result.missing_fields.map(item => `<span>• ${escapeHtml(item)}</span>`).join('')}</div>`
      : '<div class="ts-checks is-ready"><strong>Seduta completa</strong><span>Tutti i controlli obbligatori sono superati.</span></div>'

    return `
      <div class="ts-summary-grid">
        <label><span>Data</span><input name="date" type="date" value="${data.date ?? ''}"></label>
        <label><span>Orario</span><input name="time" type="time" value="${data.time ?? ''}"></label>
        <label><span>Campo</span><input name="location" value="${escapeHtml(data.location ?? '')}"></label>
        <label><span>Focus fisico</span><input name="focus_physical" value="${escapeHtml(data.focus_physical ?? '')}"></label>
        <label><span>Intensità</span><input name="intensity" type="number" min="1" max="5" value="${data.intensity ?? ''}"></label>
        <label><span>Volume</span><input name="volume" type="number" min="1" max="5" value="${data.volume ?? ''}"></label>
      </div>
      <div class="ts-section-block"><h3>Assenti riconosciuti</h3><div class="ts-person-list">${absenceRows}</div></div>
      <div class="ts-section-block"><div class="ts-section-title"><h3>Fasi</h3><strong>${data.total_duration_minutes ?? '—'} minuti</strong></div><div class="ts-phases">${phases}</div></div>
      <div class="ts-section-block ts-bottom-fields">
        <label><span>Obiettivo della seduta</span><textarea name="objective">${escapeHtml(data.objective ?? '')}</textarea></label>
        <label><span>Principi di gioco</span><input name="principles" value="${escapeHtml(data.principles.join(' · '))}"></label>
      </div>
      ${missing}
      <div class="ts-autosave-row" aria-live="polite"><span class="ts-autosave-dot"></span><span data-ts-save-message>Bozza non ancora sincronizzata.</span></div>
    `
  }

  function trainingSheetPreviewHtml(event) {
    if (!event.trainingSheetUrl) {
      return '<small>Nessuna Training Sheet collegata.</small>'
    }

    const lowerPath = String(event.trainingSheetPath ?? '').toLowerCase()

    if (lowerPath.endsWith('.pdf')) {
      return `
        <iframe
          class="training-sheet-preview training-sheet-preview--pdf"
          src="${event.trainingSheetUrl}#toolbar=0&navpanes=0&scrollbar=1"
          title="Anteprima Training Sheet"
        ></iframe>
      `
    }

    return `
      <img
        class="training-sheet-preview"
        src="${event.trainingSheetUrl}"
        alt="Anteprima Training Sheet"
      >
    `
  }

  function trainingSheetStructuredHtml(event) {
    const data = event.editorData
    if (!data) return ''
    const phases = Array.isArray(data.phases) ? data.phases : []
    return `
      <section class="drawer-ts-readable">
        <div class="drawer-ts-summary">
          <span><small>Codice</small><b>ALL_${String(data.progressive || '---').padStart(3,'0')}</b></span>
          <span><small>Focus</small><b>${escapeHtml(data.focus || '—')}</b></span>
          <span><small>Presenti</small><b>${escapeHtml(data.present ?? event.presentCount ?? '—')}</b></span>
        </div>
        ${data.pillars?.length ? `<div class="drawer-ts-pillars">${data.pillars.map((pillar)=>`<span>${escapeHtml(pillar)}</span>`).join('')}</div>` : ''}
        <div class="drawer-ts-text"><small>OBIETTIVO</small><p>${escapeHtml(data.objective || 'Da definire')}</p></div>
        <div class="drawer-ts-text"><small>PRINCIPI</small><p>${escapeHtml(data.principles || 'Da definire')}</p></div>
        <div class="drawer-ts-phases">${phases.map((phase,index)=>`<article><header><b>FASE ${index+1}</b><span>${escapeHtml(phase.duration || '—')}'</span></header><strong>${escapeHtml(phase.title || 'Senza titolo')}</strong><p>${escapeHtml(phase.description || '')}</p><small>Portieri: ${phase.goalkeepers==='yes'?'Sì':phase.goalkeepers==='separate'?'Separati':'No'}</small></article>`).join('')}</div>
      </section>`
  }

  return {
    getTrainingSheetRosterPlayers,
    trainingSheetResultHtml,
    trainingSheetPreviewHtml,
    trainingSheetStructuredHtml,
  }
}
