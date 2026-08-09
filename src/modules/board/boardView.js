import { getTeamProfile } from '../../services/teamProfile.js'
import { escapeHtml } from '../../shared/html/escapeHtml.js'
import { formationOptionsHtml } from '../../shared/pitch/formationOptions.js'

export function renderBoardView() {
  const team = getTeamProfile()
  const makeTokens = (side) => Array.from({ length: 11 }, (_, index) => `
    <button type="button" class="board-token board-token--${side}" data-board-token="${side}-${index}" style="--x:50;--y:${88-index*7}">
      <b>${index + 1}</b><small>${side === 'home' ? escapeHtml(team.shortName) : 'Avversari'}</small>
    </button>
    <input type="hidden" name="${side}_x_${index}" value="50">
    <input type="hidden" name="${side}_y_${index}" value="${88-index*7}">
  `).join('')
  return `<section class="view page-view board-view" data-board-view>
    <div class="page-head"><div><h1>Board</h1><p><span>LAVAGNA TATTICA</span><b>•</b>Due squadre, pedine libere e sistemi modificabili</p></div><button type="button" class="ghost-button" data-board-reset>Reset board</button></div>
    <div class="board-toolbar">
      <label><span>${escapeHtml(team.shortName)}</span><select name="board_home_formation">${formationOptionsHtml('4-3-3')}</select></label>
      <label><span>Avversari</span><select name="board_away_formation">${formationOptionsHtml('4-4-2')}</select></label>
      <div class="board-color-controls">
        <label><span>Colore nostri</span><input type="color" name="board_home_color" value="${escapeHtml(team.primaryColor)}"></label>
        <label><span>Colore avversari</span><input type="color" name="board_away_color" value="#9f1239"></label>
      </div>
    </div>
    <div class="board-pitch" data-board-pitch>
      <div class="pitch-markings"><span class="pitch-goal pitch-goal-top"></span><span class="pitch-goal pitch-goal-bottom"></span></div>
      ${makeTokens('home')}${makeTokens('away')}
    </div>
    <p class="board-help">Trascina liberamente le pedine con mouse o dito. Le posizioni vengono salvate su questo dispositivo.</p>
  </section>`
}
