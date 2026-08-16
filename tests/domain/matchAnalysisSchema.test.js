import { describe, expect, it } from 'vitest'
import {
  MATCH_ANALYSIS_PHASES,
  MATCH_ANALYSIS_SCHEMA_VERSION,
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
      version: 2,
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

    expect(schema.version).toBe(2)
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

    expect(parsed.version).toBe(2)
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
})
