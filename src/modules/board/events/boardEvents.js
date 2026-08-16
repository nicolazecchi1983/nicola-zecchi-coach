export function wireBoardEvents({
  root,
  readLocalJson,
  storage = globalThis.localStorage,
  cssEscape = globalThis.CSS?.escape,
  createPitchState,
  pitchPositionMode,
  createPitchController,
  getTeamProfile,
  bindPitchTokenDragging,
}) {
    const board = root.querySelector('[data-board-view]')
    if (board) {
      const pitch = board.querySelector('[data-board-pitch]')
      const saved = readLocalJson('nz-board-v1', {})
      const saveBoard = () => {
        const data = {}
        board.querySelectorAll('input[name], select[name]').forEach((field) => { data[field.name] = field.value })
        storage?.setItem('nz-board-v1', JSON.stringify(data))
      }
      const createSideController = (side, defaultFormation, mirrored) => {
        const formationField = board.querySelector(`[name="board_${side}_formation"]`)
        const savedPositions = Array.from({ length: 11 }, (_, index) => {
          const x = Number(saved[`${side}_x_${index}`])
          const y = Number(saved[`${side}_y_${index}`])
          return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null
        })
        const hasSavedPositions = savedPositions.every(Boolean)
        const state = createPitchState({
          formation: saved[`board_${side}_formation`] || defaultFormation,
          positions: hasSavedPositions ? savedPositions : null,
          mode: hasSavedPositions ? pitchPositionMode.CUSTOM : pitchPositionMode.AUTOMATIC,
          mirrored,
        })
        return createPitchController({
          state,
          render(snapshot) {
            formationField.value = snapshot.formation
            snapshot.positions.forEach(([x, y], index) => {
              const token = board.querySelector(`[data-board-token="${side}-${index}"]`)
              if (!token) return
              token.style.setProperty('--x', x.toFixed(2))
              token.style.setProperty('--y', y.toFixed(2))
              board.querySelector(`[name="${side}_x_${index}"]`).value = x.toFixed(2)
              board.querySelector(`[name="${side}_y_${index}"]`).value = y.toFixed(2)
            })
            board.dataset[`${side}PositionMode`] = snapshot.mode
          },
          persist: saveBoard,
        })
      }
      if (Object.keys(saved).length) {
        Object.entries(saved).forEach(([key, value]) => {
          const field = board.querySelector(`[name="${cssEscape ? cssEscape(key) : key}"]`)
          if (field) field.value = value
        })
      }
      board.style.setProperty('--board-home', saved.board_home_color || getTeamProfile().primaryColor)
      board.style.setProperty('--board-away', saved.board_away_color || '#9f1239')
      const controllers = {
        home: createSideController('home', '4-3-3', false),
        away: createSideController('away', '4-4-2', true),
      }
      controllers.home.initialize()
      controllers.away.initialize()
      for (const side of ['home', 'away']) {
        board.querySelector(`[name="board_${side}_formation"]`)?.addEventListener('change', (event) => {
          controllers[side].applyFormation(event.currentTarget.value)
        })
      }
      board.querySelectorAll('input[type="color"]').forEach((input) => {
        const applyBoardColor = () => {
          const side = input.name.includes('home') ? 'home' : 'away'
          board.style.setProperty(`--board-${side}`, input.value)
          saveBoard()
        }
        input.addEventListener('input', applyBoardColor)
        input.addEventListener('change', applyBoardColor)
      })
      bindPitchTokenDragging({
        pitch,
        tokens: [...board.querySelectorAll('[data-board-token]')],
        getIndex: (token) => Number(token.dataset.boardToken.split('-')[1]),
        onMove: (index, x, y, token) => {
          const side = token.dataset.boardToken.startsWith('away-') ? 'away' : 'home'
          controllers[side].moveToken(index, x, y, false)
        },
        onCommit: () => saveBoard(),
      })
      board.querySelector('[data-board-reset]')?.addEventListener('click', () => {
        controllers.home.applyFormation(board.querySelector('[name="board_home_formation"]').value, false)
        controllers.away.applyFormation(board.querySelector('[name="board_away_formation"]').value, false)
        saveBoard()
      })
    }
}
