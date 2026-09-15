import { describe, expect, it } from 'vitest'
import { MATCH_GPS_METRIC_COLUMNS } from '../../src/modules/match/matchGpsModel.js'
import { renderMatchGpsView } from '../../src/modules/match/ui/matchGpsView.js'

const metrics = Object.fromEntries(
  MATCH_GPS_METRIC_COLUMNS.map((column, index) => [column.key, index + 1]),
)

const base = {
  match: { id: 'match-1', opponent: 'Sant Agostino' },
  team: { name: 'Mezzolara' },
  roster: [
    { id: 'p1', name: 'Filippo Fabbri', year: '' },
    { id: 'p2', name: 'Manuel Musiani', year: '' },
  ],
  canImport: true,
}

describe('matchGpsView premium visualization', () => {
  it('mantiene l anteprima compatta senza riga Excel e senza duplicare un nome equivalente', () => {
    const html = renderMatchGpsView({
      ...base,
      preview: {
        source: { fileName: 'gps.xlsx', sheetName: 'Foglio1', headerRow: 3 },
        rows: [{
          included: true,
          sourceRow: 4,
          sourcePlayerName: 'Fabbri Filippo',
          sourceBirthDate: '2002-01-07',
          playerId: 'p1',
          invalidFields: [],
          metrics,
        }],
      },
    })

    expect(html).not.toContain('Riga Excel')
    expect(html).not.toContain('<strong>Fabbri Filippo</strong>')
    expect(html).toContain('Filippo Fabbri')
  })

  it('espone tutte le metriche salvate e un comparatore apribile per ciascuna metrica', () => {
    const html = renderMatchGpsView({
      ...base,
      preview: null,
      saved: {
        sourceFileName: 'gps.xlsx',
        sourceSheetName: 'Foglio1',
        importedAt: '2026-09-14T18:00:00.000Z',
        rows: [
          { playerId: 'p1', sourcePlayerName: 'Fabbri Filippo', metrics },
          { playerId: 'p2', sourcePlayerName: 'Musiani Manuel', metrics },
        ],
      },
    })

    expect(html).toContain('data-match-gps-analysis')

    const visibleColumns = MATCH_GPS_METRIC_COLUMNS.filter(
      ({ key }) => key !== 'restingHeartRate' && key !== 'maxHeartRate',
    )

    for (const column of visibleColumns) {
      expect(html).toContain(column.label)
      expect(html).toContain(`data-match-gps-chart="${column.key}"`)
    }

    expect(html).not.toContain('CARDIO RIP.')
    expect(html).not.toContain('CARDIO MAX.')
    expect(html).toContain('match-gps-player-column')
  })
})