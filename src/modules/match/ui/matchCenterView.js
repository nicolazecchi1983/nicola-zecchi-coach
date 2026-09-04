import { readMatchCenterFromEventNotes } from '../matchCenterModel.js'
import { readMatchSquadSnapshotFromEventNotes } from '../matchSquadSnapshotModel.js'
import {
  deriveMatchCenterOperationalState,
  formatMatchCenterMinute,
  matchCenterEventLabel,
  matchCenterPlayerOptions,
} from '../matchCenterOperationalModel.js'
import { matchWorkspaceShellHtml } from '../workspace/matchWorkspaceShell.js'

const STATUS_LABELS = Object.freeze({
  not_started: 'Da iniziare',
  in_progress: 'In corso',
  half_time: 'Intervallo',
  finished: 'Terminata',
})

const PERIOD_LABELS = Object.freeze({
  pre_match: 'Pre gara',
  first_half: '1° tempo',
  half_time: 'Intervallo',
  second_half: '2° tempo',
  extra_time_first: '1° supplementare',
  extra_time_break: 'Intervallo supplementari',
  extra_time_second: '2° supplementare',
  penalties: 'Rigori',
  full_time: 'Finale',
})

function selectOptions(values, current, labels, escapeHtml) {
  return values
    .map((value) => `<option value="${escapeHtml(value)}" ${value === current ? 'selected' : ''}>${escapeHtml(labels[value] || value)}</option>`)
    .join('')
}

function playerOptionHtml(player, escapeHtml) {
  const id = String(player.playerId || '')
  const name = String(player.name || '')
  const number = player.shirtNumber ? `${player.shirtNumber} · ` : ''
  return `<option value="${escapeHtml(id || name)}" data-player-id="${escapeHtml(id)}" data-player-name="${escapeHtml(name)}">${escapeHtml(number + name)}</option>`
}

function playerOptionsHtml(players, escapeHtml) {
  return players.map((player) => playerOptionHtml(player, escapeHtml)).join('')
}

function eventDescription(event, escapeHtml) {
  if (event.type === 'goal') {
    const scorer = event.scorer?.name ? ` · ${escapeHtml(event.scorer.name)}` : ''
    const assist = event.assist?.name ? ` · Assist ${escapeHtml(event.assist.name)}` : ''
    return `${event.side === 'opponent' ? 'Avversario' : 'Noi'}${scorer}${assist}`
  }
  if (event.type === 'substitution') {
    return `${escapeHtml(event.out?.name || '—')} → ${escapeHtml(event.in?.name || '—')}${event.reason ? ` · ${escapeHtml(event.reason)}` : ''}`
  }
  if (event.type === 'sanction') {
    return `${event.side === 'opponent' ? 'Avversario' : 'Noi'}${event.player?.name ? ` · ${escapeHtml(event.player.name)}` : ''}`
  }
  if (event.type === 'formation_change') {
    return `${event.side === 'opponent' ? 'Avversario' : 'Noi'} · ${escapeHtml(event.customFormation || event.formation || 'Sistema da definire')}`
  }
  return ''
}

function dateLabel(value) {
  const date = String(value || '').slice(0, 10)
  if (!date) return 'Data da definire'
  try {
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
      .format(new Date(`${date}T12:00:00`))
  } catch {
    return date
  }
}

export function createMatchCenterView({
  storage = globalThis.localStorage,
  getCalendarEvents,
  getTeamProfile,
  canEdit = () => true,
  escapeHtml,
}) {
  return function matchCenterView() {
    let active = null
    try { active = JSON.parse(storage?.getItem('staff-active-match') || 'null') } catch {}

    const calendarEvents = typeof getCalendarEvents === 'function' ? getCalendarEvents() : []
    const eventModel = Array.isArray(calendarEvents)
      ? calendarEvents.find((event) => String(event?.id || '') === String(active?.id || ''))
      : null
    const team = getTeamProfile()
    const teamName = team?.shortName || team?.name || 'Noi'

    if (!active?.id || !eventModel) {
      return matchWorkspaceShellHtml({
        activeSection: 'match-center',
        teamName,
        titleHtml: 'Match Center',
        className: 'match-center-view',
        attributes: { 'data-match-workspace': true, 'data-match-center': true },
        contentHtml: `<section class="product-surface product-empty-state">
          <h2>Partita non disponibile</h2>
          <p>Apri una gara dalla Match Library prima di entrare nel Match Center.</p>
        </section>`,
      })
    }

    const opponent = eventModel.opponent || active.opponent || 'Avversario'
    const center = readMatchCenterFromEventNotes(eventModel.rawNotes || '')
    const snapshot = readMatchSquadSnapshotFromEventNotes(eventModel.rawNotes || '')
    const operational = deriveMatchCenterOperationalState(snapshot, center)
    const allPlayerOptions = matchCenterPlayerOptions(snapshot, center)
    const editable = Boolean(canEdit())
    const disabled = editable ? '' : 'disabled'
    const allOptionsHtml = playerOptionsHtml(allPlayerOptions, escapeHtml)
    const starterOptionsHtml = playerOptionsHtml(operational.currentStarters, escapeHtml)
    const benchOptionsHtml = playerOptionsHtml(operational.currentBench, escapeHtml)

    const homeAway = eventModel.homeAway || 'home'
    const homeTeam = homeAway === 'away' ? opponent : teamName
    const awayTeam = homeAway === 'away' ? teamName : opponent
    const homeScore = homeAway === 'away' ? operational.score.opponent : operational.score.our
    const awayScore = homeAway === 'away' ? operational.score.our : operational.score.opponent

    const currentXiHtml = operational.snapshotPersisted
      ? operational.starters.map((player, index) => `<div class="match-center-player ${player.name || player.playerId ? '' : 'is-empty'}">
          <b>${escapeHtml(String(player.shirtNumber || '—'))}</b>
          <span>${escapeHtml(player.name || `Slot ${index + 1}`)}</span>
        </div>`).join('')
      : `<div class="match-center-lineup-empty">
          <p>Formazione iniziale non ancora disponibile.</p>
          <button type="button" class="button button--secondary" data-workspace-action="our-team">Apri Nostra squadra</button>
        </div>`

    const timelineHtml = operational.timeline.length
      ? [...operational.timeline].reverse().map((event) => `<article class="match-center-timeline__event">
          <time>${escapeHtml(formatMatchCenterMinute(event))}</time>
          <div>
            <strong>${escapeHtml(matchCenterEventLabel(event))}</strong>
            <span>${eventDescription(event, escapeHtml)}</span>
          </div>
          ${editable ? `<button type="button" class="match-center-event-remove" data-match-center-remove="${escapeHtml(event.id)}" aria-label="Rimuovi evento">×</button>` : ''}
        </article>`).join('')
      : '<p class="match-center-empty-copy">Nessun evento registrato.</p>'

    const contentHtml = `
      <section class="match-center-scoreboard product-surface">
        <div class="match-center-fixture">
          <span>${escapeHtml(eventModel.competition || 'Partita')}${eventModel.matchDay ? ` · Giornata ${escapeHtml(String(eventModel.matchDay))}` : ''}</span>
          <h2>${escapeHtml(homeTeam)} <b>${escapeHtml(String(homeScore))} – ${escapeHtml(String(awayScore))}</b> ${escapeHtml(awayTeam)}</h2>
          <p>${escapeHtml(dateLabel(eventModel.date || active.date))}${eventModel.time ? ` · ${escapeHtml(eventModel.time)}` : ''}</p>
        </div>
        <div class="match-center-state-badges">
          <span>${escapeHtml(STATUS_LABELS[operational.status] || operational.status)}</span>
          <span>${escapeHtml(PERIOD_LABELS[operational.period] || operational.period)}</span>
        </div>
      </section>

      <form class="match-center-state-form product-surface" data-match-center-state-form autocomplete="off">
        <div class="match-center-section-head">
          <div><span>STATO GARA</span><h2>Controllo partita</h2></div>
          <small>${center.persisted ? 'Sincronizzato' : 'Non ancora salvato'}</small>
        </div>
        <div class="match-center-state-grid">
          <label><span>Stato</span><select name="match_center_status" autocomplete="off" ${disabled}>${selectOptions(['not_started','in_progress','half_time','finished'], operational.status, STATUS_LABELS, escapeHtml)}</select></label>
          <label><span>Periodo</span><select name="match_center_period" autocomplete="off" ${disabled}>${selectOptions(['pre_match','first_half','half_time','second_half','extra_time_first','extra_time_break','extra_time_second','penalties','full_time'], operational.period, PERIOD_LABELS, escapeHtml)}</select></label>
          <label><span>${escapeHtml(teamName)}</span><input type="number" name="match_center_score_our" autocomplete="off" min="0" max="99" value="${escapeHtml(String(operational.score.our))}" ${disabled}></label>
          <label><span>${escapeHtml(opponent)}</span><input type="number" name="match_center_score_opponent" autocomplete="off" min="0" max="99" value="${escapeHtml(String(operational.score.opponent))}" ${disabled}></label>
        </div>
        <div class="match-center-form-footer">
          <span data-match-center-message></span>
          ${editable ? '<button type="submit" class="button button--primary">Aggiorna stato</button>' : '<small>Modalità sola lettura</small>'}
        </div>
      </form>

      <div class="match-center-operational-grid">
        <section class="product-surface match-center-lineup">
          <div class="match-center-section-head">
            <div><span>XI CORRENTE</span><h2>${escapeHtml(operational.customFormation || operational.formation || 'Sistema')}</h2></div>
            <small>${operational.currentStarters.length}/11 · derivato da PRE + eventi</small>
          </div>
          <div class="match-center-player-list">${currentXiHtml}</div>
        </section>

        <section class="product-surface match-center-timeline">
          <div class="match-center-section-head">
            <div><span>TIMELINE</span><h2>Eventi partita</h2></div>
            <small>${operational.timeline.length} eventi</small>
          </div>
          <div class="match-center-timeline__list">${timelineHtml}</div>
        </section>
      </div>

      ${editable ? `<section class="product-surface match-center-event-console">
        <div class="match-center-section-head">
          <div><span>REGISTRA EVENTO</span><h2>Console operativa</h2></div>
          <small>I fatti alimentano il POST</small>
        </div>
        <div class="match-center-event-grid">
          <form data-match-center-event-form="goal">
            <h3>Gol</h3>
            <div class="match-center-minute-row">
              <label><span>Minuto</span><input type="number" name="minute" min="0" max="130" required></label>
              <label><span>Rec.</span><input type="number" name="added_minute" min="0" max="30" value="0"></label>
            </div>
            <label><span>Squadra</span><select name="side"><option value="our">${escapeHtml(teamName)}</option><option value="opponent">${escapeHtml(opponent)}</option></select></label>
            <label><span>Marcatore nostro</span><select name="scorer"><option value="">—</option>${allOptionsHtml}</select></label>
            <label><span>Assist</span><select name="assist"><option value="">—</option>${allOptionsHtml}</select></label>
            <button type="submit" class="button button--secondary">Aggiungi gol</button>
          </form>

          <form data-match-center-event-form="substitution">
            <h3>Sostituzione</h3>
            <div class="match-center-minute-row">
              <label><span>Minuto</span><input type="number" name="minute" min="0" max="130" required></label>
              <label><span>Rec.</span><input type="number" name="added_minute" min="0" max="30" value="0"></label>
            </div>
            <label><span>Esce</span><select name="out" required><option value="">Seleziona</option>${starterOptionsHtml}</select></label>
            <label><span>Entra</span><select name="in" required><option value="">Seleziona</option>${benchOptionsHtml}</select></label>
            <label><span>Motivo</span><select name="reason"><option>Tattico</option><option>Tecnico</option><option>Fisico</option><option>Infortunio</option><option>Gestione</option></select></label>
            <button type="submit" class="button button--secondary">Registra cambio</button>
          </form>

          <form data-match-center-event-form="sanction">
            <h3>Sanzione</h3>
            <div class="match-center-minute-row">
              <label><span>Minuto</span><input type="number" name="minute" min="0" max="130" required></label>
              <label><span>Rec.</span><input type="number" name="added_minute" min="0" max="30" value="0"></label>
            </div>
            <label><span>Squadra</span><select name="side"><option value="our">${escapeHtml(teamName)}</option><option value="opponent">${escapeHtml(opponent)}</option></select></label>
            <label><span>Giocatore nostro</span><select name="player"><option value="">—</option>${allOptionsHtml}</select></label>
            <label><span>Tipo</span><select name="sanction"><option value="yellow">Ammonizione</option><option value="second_yellow">Doppia ammonizione</option><option value="red">Espulsione</option></select></label>
            <button type="submit" class="button button--secondary">Registra sanzione</button>
          </form>

          <form data-match-center-event-form="formation_change">
            <h3>Cambio sistema</h3>
            <div class="match-center-minute-row">
              <label><span>Minuto</span><input type="number" name="minute" min="0" max="130" required></label>
              <label><span>Rec.</span><input type="number" name="added_minute" min="0" max="30" value="0"></label>
            </div>
            <label><span>Squadra</span><select name="side"><option value="our">${escapeHtml(teamName)}</option><option value="opponent">${escapeHtml(opponent)}</option></select></label>
            <label><span>Sistema</span><input type="text" name="formation" placeholder="es. 4-3-3" required></label>
            <button type="submit" class="button button--secondary">Registra sistema</button>
          </form>
        </div>
        <div class="match-center-console-message" data-match-center-event-message></div>
      </section>` : ''}
    `

    return matchWorkspaceShellHtml({
      activeSection: 'match-center',
      teamName,
      titleHtml: 'Match Center',
      className: 'match-center-view',
      attributes: {
        'data-match-workspace': true,
        'data-match-center': true,
        'data-match-id': String(active.id),
      },
      contentHtml,
    })
  }
}
