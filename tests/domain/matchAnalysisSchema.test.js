import { describe, expect, it } from 'vitest'
import {
  MATCH_ANALYSIS_PHASES,
  MATCH_ANALYSIS_SCHEMA_VERSION,
  MATCH_ANALYSIS_SET_PIECE_SITUATIONS,
  analysisSchemaHasNotes,
  createAnalysisTemplateDefinition,
  createMatchAnalysisSchema,
  createStaffAnalysisTemplateSchema,
  matchAnalysisSchemaEntries,
  parseMatchAnalysisSchema,
  serializeMatchAnalysisSchema,
} from '../../src/modules/match/matchAnalysisSchema.js'

describe('matchAnalysisSchema', () => {
  it('crea il template STAFF canonico con quattro macroaree e sottofasi predefinite', () => {
    const schema = createStaffAnalysisTemplateSchema()

    expect(schema.version).toBe(MATCH_ANALYSIS_SCHEMA_VERSION)
    expect(schema.phases.map(({ key, title }) => ({ key, title }))).toEqual(MATCH_ANALYSIS_PHASES)
    expect(schema.phases.every((phase) => phase.subsections.length > 0)).toBe(true)
    expect(schema.phases.every((phase) => phase.note === '')).toBe(true)
  })

  it('normalizza schema v2, testi e identificatori custom senza perdere la struttura', () => {
    const schema = createMatchAnalysisSchema({
      version: 2,
      phases: [{
        key: '  Costruzione Èlite  ',
        title: '  Costruzione alta  ',
        note: '  Nota generale  ',
        subsections: [{ id: '  Zona 14 / Centro  ', title: '  Rifinitura  ', note: '  Attaccare dentro  ' }],
      }],
    })

    expect(schema).toEqual({
      version: MATCH_ANALYSIS_SCHEMA_VERSION,
      phases: [{
        key: 'costruzione-elite',
        title: 'Costruzione alta',
        note: 'Nota generale',
        subsections: [{ id: 'zona-14-centro', title: 'Rifinitura', note: 'Attaccare dentro' }],
      }],
    })
  })

  it('migra uno schema legacy v1 alle quattro macroaree canoniche preservando le note disponibili', () => {
    const schema = createMatchAnalysisSchema({
      version: 1,
      phases: [{ key: 'possession', title: 'Possesso legacy', note: 'Uscita 3+2', subsections: [] }],
    })

    expect(schema.version).toBe(MATCH_ANALYSIS_SCHEMA_VERSION)
    expect(schema.phases).toHaveLength(4)
    expect(schema.phases[0].key).toBe('possession')
    expect(schema.phases[0].title).toBe('Possesso legacy')
    expect(schema.phases[0].note).toBe('Uscita 3+2')
    expect(schema.phases[0].subsections.length).toBeGreaterThan(0)
    expect(schema.phases[1].key).toBe('non-possession')
  })

  it('usa i campi legacy quando non esiste uno schema valido', () => {
    const schema = parseMatchAnalysisSchema('{ json non valido', {
      possession: '  Costruzione bassa  ',
      nonPossession: 'Blocco medio',
    })

    expect(schema.phases.find((phase) => phase.key === 'possession')?.note).toBe('Costruzione bassa')
    expect(schema.phases.find((phase) => phase.key === 'non-possession')?.note).toBe('Blocco medio')
    expect(schema.phases.find((phase) => phase.key === 'transitions')?.note).toBe('')
  })

  it('serializza sempre una versione normalizzata e rileva note sia di fase sia di sottofase', () => {
    const source = {
      version: 2,
      phases: [{
        key: 'possession',
        title: 'Possesso',
        note: '',
        subsections: [{ id: 'build', title: 'Build-up', note: '  Uscire sul lato debole  ' }],
      }],
    }

    const serialized = serializeMatchAnalysisSchema(source)
    const parsed = JSON.parse(serialized)

    expect(parsed.version).toBe(MATCH_ANALYSIS_SCHEMA_VERSION)
    expect(parsed.phases[0].subsections[0].note).toBe('Uscire sul lato debole')
    expect(analysisSchemaHasNotes(source)).toBe(true)
    expect(analysisSchemaHasNotes({ version: 2, phases: [] })).toBe(false)
  })

  it('crea definizioni template senza note e produce entries solo per contenuti compilati', () => {
    const source = {
      version: 2,
      phases: [{
        key: 'transitions',
        title: 'Transizioni',
        note: 'Nota generale',
        subsections: [
          { id: 'positive', title: 'Positiva', note: 'Attacco spazio' },
          { id: 'negative', title: 'Negativa', note: '' },
        ],
      }],
    }

    const template = createAnalysisTemplateDefinition(source)
    expect(template.phases[0].note).toBe('')
    expect(template.phases[0].subsections.map((item) => item.note)).toEqual(['', ''])

    const entries = matchAnalysisSchemaEntries(source)[0].entries
    expect(entries).toEqual([
      { id: 'transitions-general', title: 'Nota generale', note: 'Nota generale' },
      { id: 'positive', title: 'Positiva', note: 'Attacco spazio' },
    ])
  })

  it('divide le palle inattive STAFF in sei situazioni a favore e sei contro', () => {
    const setPieces = createStaffAnalysisTemplateSchema().phases.find((phase) => phase.key === 'set-pieces')
    const forItems = setPieces.subsections.filter((item) => item.direction === 'for')
    const againstItems = setPieces.subsections.filter((item) => item.direction === 'against')

    expect(setPieces.subsections).toHaveLength(12)
    expect(forItems.map((item) => item.title)).toEqual(MATCH_ANALYSIS_SET_PIECE_SITUATIONS)
    expect(againstItems.map((item) => item.title)).toEqual(MATCH_ANALYSIS_SET_PIECE_SITUATIONS)
  })

  it('migra il vecchio set-pieces v2 canonico vuoto nella nuova struttura direzionale', () => {
    const schema = createMatchAnalysisSchema({
      version: 2,
      phases: [{
        key: 'set-pieces',
        title: 'Palle inattive',
        note: '',
        subsections: MATCH_ANALYSIS_SET_PIECE_SITUATIONS.map((title, index) => ({
          id: `set-pieces-${index + 1}`,
          title,
          note: '',
        })),
      }],
    })
    const setPieces = schema.phases[0]

    expect(schema.version).toBe(MATCH_ANALYSIS_SCHEMA_VERSION)
    expect(setPieces.subsections).toHaveLength(12)
    expect(setPieces.subsections.filter((item) => item.direction === 'for')).toHaveLength(6)
    expect(setPieces.subsections.filter((item) => item.direction === 'against')).toHaveLength(6)
  })

  it('non indovina la direzione delle vecchie note v2 e le preserva da classificare', () => {
    const legacy = MATCH_ANALYSIS_SET_PIECE_SITUATIONS.map((title, index) => ({
      id: `set-pieces-${index + 1}`,
      title,
      note: index === 0 ? 'Battuta corta sul primo palo' : '',
    }))
    const schema = createMatchAnalysisSchema({
      version: 2,
      phases: [{ key: 'set-pieces', title: 'Palle inattive', note: '', subsections: legacy }],
    })

    expect(schema.phases[0].subsections).toHaveLength(6)
    expect(schema.phases[0].subsections[0].note).toBe('Battuta corta sul primo palo')
    expect(schema.phases[0].subsections.every((item) => item.direction == null)).toBe(true)
  })

  it('preserva snapshot v2 ridotti senza ricreare macroaree eliminate', () => {
    const schema = parseMatchAnalysisSchema({
      version: 2,
      phases: [{ key: 'possession', title: 'Possesso', note: '', subsections: [] }],
    })
    const empty = parseMatchAnalysisSchema({ version: 2, phases: [] })

    expect(schema.version).toBe(MATCH_ANALYSIS_SCHEMA_VERSION)
    expect(schema.phases.map((phase) => phase.key)).toEqual(['possession'])
    expect(empty.phases).toEqual([])
  })

  it('preserva direction nei template, nella serializzazione e nelle entries di report', () => {
    const source = {
      version: MATCH_ANALYSIS_SCHEMA_VERSION,
      phases: [{
        key: 'set-pieces',
        title: 'Palle inattive',
        note: '',
        subsections: [{ id: 'corner-for', title: "Calci d'angolo", note: 'Attacco primo palo', direction: 'for' }],
      }],
    }
    const template = createAnalysisTemplateDefinition(source)
    const serialized = JSON.parse(serializeMatchAnalysisSchema(source))
    const entry = matchAnalysisSchemaEntries(source)[0].entries[0]

    expect(template.phases[0].subsections[0]).toMatchObject({ direction: 'for', note: '' })
    expect(serialized.phases[0].subsections[0].direction).toBe('for')
    expect(entry.direction).toBe('for')
  })

})
