import { describe, expect, it } from 'vitest'
import {
  buildMatchGpsSaveRows,
  matchGpsRowsToRoster,
  parseMatchGpsWorksheetRows,
} from '../../src/modules/match/matchGpsModel.js'
import { renderMatchGpsView } from '../../src/modules/match/ui/matchGpsView.js'

function matrix() {
  return [
    [],
    ['MEZZOLARA 2026-2027'],
    [],
    [
      '',
      'Cognome/ nome',
      'Data di nascita',
      'CARDIO RIP.',
      'CARDIO MAX.',
      'VEL MAX m/s',
      'Dist. Max vel. KM',
      'VEL media',
      'ACC m/s2',
      'n. ACC',
      'n. DECELL',
      'KM',
      'minuti giocati',
    ],
    [],
    [1,'Musiani Manuel','29/02/00',52,null,8.85,1.98,6.78,6.82,291,245,11.98,90],
    [2,'Fabbri Filippo','07/01/02',52,null,8.20,0.80,5.44,5.47,210,197,6.93,58],
    [3,'Nistor Tommaso','06/11/06',53,null,null,null,null,null,null,null,null,32],
  ]
}

const roster = [
  { id:'p1', name:'Manuel Musiani', year:'' },
  { id:'p2', name:'Filippo Fabbri', year:'' },
  { id:'p3', name:'Tommaso Nistor', year:'' },
]

describe('match GPS minutes + per-90 normalization', () => {
  it('legge minuti giocati senza considerarli da soli attività GPS', () => {
    const parsed = parseMatchGpsWorksheetRows(matrix())

    expect(parsed.rows[0].minutesPlayed).toBe(90)
    expect(parsed.rows[1].minutesPlayed).toBe(58)

    const minutesOnly = parsed.rows.find((row) => row.sourcePlayerName === 'Nistor Tommaso')
    expect(minutesOnly.minutesPlayed).toBe(32)
    expect(minutesOnly.included).toBe(false)
  })

  it('mantiene il minutaggio nel payload canonico di salvataggio', () => {
    const parsed = parseMatchGpsWorksheetRows(matrix())
    const matched = matchGpsRowsToRoster(parsed.rows, roster)
    const rows = buildMatchGpsSaveRows(matched, roster)

    expect(rows[0].minutesPlayed).toBe(90)
    expect(rows[1].minutesPlayed).toBe(58)
  })

  it('mostra minuti reali e normalizzazione per 90 nelle metriche cumulative', () => {
    const parsed = parseMatchGpsWorksheetRows(matrix())
    const matched = matchGpsRowsToRoster(parsed.rows, roster)
    const rows = buildMatchGpsSaveRows(matched, roster)

    const html = renderMatchGpsView({
      match: { id:'match-1', opponent:'Sant Agostino' },
      team: { name:'Mezzolara' },
      roster,
      canImport: true,
      saved: {
        sourceFileName:'gps.xlsx',
        sourceSheetName:'Foglio1',
        importedAt:'2026-09-15T20:00:00.000Z',
        rows,
      },
    })

    expect(html).toContain('MIN')
    expect(html).toContain("58'")
    expect(html).toContain('10,75 /90&#39;')

    expect(html).toContain('data-match-gps-normalized="distanceKm"')
    expect(html).toContain('data-match-gps-normalized="distanceMaxSpeedKm"')
    expect(html).toContain('data-match-gps-normalized="accelerationCount"')
    expect(html).toContain('data-match-gps-normalized="decelerationCount"')

    expect(html).not.toContain('data-match-gps-normalized="maxSpeedMs"')
    expect(html).not.toContain('data-match-gps-normalized="averageSpeed"')
    expect(html).not.toContain('data-match-gps-normalized="accelerationMs2"')
  })

  it('non trasforma minuti mancanti in zero e non calcola il per-90 senza esposizione', () => {
    const html = renderMatchGpsView({
      match: { id:'match-1', opponent:'Sant Agostino' },
      team: { name:'Mezzolara' },
      roster,
      saved: {
        sourceFileName:'gps.xlsx',
        sourceSheetName:'Foglio1',
        importedAt:'2026-09-15T20:00:00.000Z',
        rows: [{
          playerId:'p1',
          sourcePlayerName:'Musiani Manuel',
          sourceBirthDate:'2000-02-29',
          minutesPlayed:null,
          metrics:{
            distanceKm:9,
          },
        }],
      },
    })

    expect(html).toContain('<td class="match-gps-minutes-column">\u2014</td>')

    const normalizedStart = html.indexOf('data-match-gps-normalized="distanceKm"')
    expect(normalizedStart).toBeGreaterThan(-1)

    const normalizedCell = html.slice(normalizedStart, normalizedStart + 300)
    expect(normalizedCell).toContain('\u2014 /90&#39;')
    expect(html).not.toContain('<td class="match-gps-minutes-column">0&#39;</td>')
  })

  it('riordina la vista per-90 usando il valore normalizzato e non il totale', () => {
    const html = renderMatchGpsView({
      match: { id:'match-1', opponent:'Sant Agostino' },
      team: { name:'Mezzolara' },
      roster,
      saved: {
        sourceFileName:'gps.xlsx',
        sourceSheetName:'Foglio1',
        importedAt:'2026-09-15T20:00:00.000Z',
        rows: [
          {
            playerId:'p1',
            sourcePlayerName:'Musiani Manuel',
            minutesPlayed:90,
            metrics:{ distanceMaxSpeedKm:2 },
          },
          {
            playerId:'p2',
            sourcePlayerName:'Fabbri Filippo',
            minutesPlayed:45,
            metrics:{ distanceMaxSpeedKm:1.5 },
          },
        ],
      },
    })

    const chartStart = html.indexOf('data-match-gps-chart="distanceMaxSpeedKm"')
    expect(chartStart).toBeGreaterThan(-1)

    const chartEnd = html.indexOf('</details>', chartStart)
    const chartHtml = html.slice(chartStart, chartEnd)

    const totalStart = chartHtml.indexOf('match-gps-chart-mode__panel--total')
    const normalizedStart = chartHtml.indexOf('match-gps-chart-mode__panel--normalized')

    expect(totalStart).toBeGreaterThan(-1)
    expect(normalizedStart).toBeGreaterThan(totalStart)

    const totalHtml = chartHtml.slice(totalStart, normalizedStart)
    const normalizedHtml = chartHtml.slice(normalizedStart)

    expect(totalHtml.indexOf('Manuel Musiani'))
      .toBeLessThan(totalHtml.indexOf('Filippo Fabbri'))

    expect(normalizedHtml.indexOf('Filippo Fabbri'))
      .toBeLessThan(normalizedHtml.indexOf('Manuel Musiani'))
  })})