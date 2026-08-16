import {
  deleteAnalysisTemplateRow,
  insertAnalysisTemplateRow,
  listAnalysisTemplateRows,
  updateAnalysisTemplateRow,
} from '../../infrastructure/repositories/analysisTemplateRepository.js'
import {
  MATCH_ANALYSIS_SCHEMA_VERSION,
  createAnalysisTemplateDefinition,
  createMatchAnalysisSchema,
} from './matchAnalysisSchema.js'

function normalizeTemplate(row = {}) {
  return {
    id: String(row.id || ''),
    teamId: String(row.team_id || row.teamId || ''),
    ownerUserId: String(row.owner_user_id || row.ownerUserId || ''),
    name: String(row.name || '').trim(),
    schema: createMatchAnalysisSchema(row.schema_json || row.schema || {}),
    updatedAt: row.updated_at || row.updatedAt || null,
  }
}

export function createAnalysisTemplateService() {
  return {
    async list(teamId) {
      if (!teamId) return []
      const { data, error } = await listAnalysisTemplateRows(teamId)
      if (error) throw error
      return (data || []).map(normalizeTemplate)
    },

    async save({ id = '', teamId, userId, name, schema }) {
      const safeName = String(name || '').trim()
      if (!teamId) throw new Error('Squadra non disponibile.')
      if (!userId) throw new Error('Utente non disponibile.')
      if (!safeName) throw new Error('Dai un nome al template.')

      const payload = {
        team_id: teamId,
        owner_user_id: userId,
        name: safeName,
        schema_version: MATCH_ANALYSIS_SCHEMA_VERSION,
        schema_json: createAnalysisTemplateDefinition(schema),
        updated_at: new Date().toISOString(),
      }

      let targetId = id
      if (!targetId) {
        const { data: existingRows, error: listError } = await listAnalysisTemplateRows(teamId)
        if (listError) throw listError
        const existing = (existingRows || []).find((row) =>
          String(row.name || '').trim().toLocaleLowerCase('it-IT') === safeName.toLocaleLowerCase('it-IT'))
        targetId = existing?.id || ''
      }

      const result = targetId
        ? await updateAnalysisTemplateRow(targetId, payload)
        : await insertAnalysisTemplateRow(payload)

      if (result.error) throw result.error
      return normalizeTemplate(result.data)
    },

    async updateStructure({ id, teamId, userId, schema }) {
      if (!id) throw new Error('Seleziona un template personale.')
      if (!teamId) throw new Error('Squadra non disponibile.')
      if (!userId) throw new Error('Utente non disponibile.')

      const { data: rows, error: listError } = await listAnalysisTemplateRows(teamId)
      if (listError) throw listError
      const existing = (rows || []).find((row) => String(row.id) === String(id))
      if (!existing) throw new Error('Template personale non trovato.')
      if (String(existing.owner_user_id || '') !== String(userId)) {
        throw new Error('Puoi aggiornare solo i tuoi template.')
      }

      const { data, error } = await updateAnalysisTemplateRow(id, {
        schema_version: MATCH_ANALYSIS_SCHEMA_VERSION,
        schema_json: createAnalysisTemplateDefinition(schema),
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return normalizeTemplate(data)
    },

    async updateDefinition({ id, teamId, userId, name, schema }) {
      const safeName = String(name || '').trim()
      if (!id) throw new Error('Template personale non disponibile.')
      if (!teamId) throw new Error('Squadra non disponibile.')
      if (!userId) throw new Error('Utente non disponibile.')
      if (!safeName) throw new Error('Dai un nome al template.')

      const { data: rows, error: listError } = await listAnalysisTemplateRows(teamId)
      if (listError) throw listError
      const existing = (rows || []).find((row) => String(row.id) === String(id))
      if (!existing) throw new Error('Template personale non trovato.')
      if (String(existing.owner_user_id || '') !== String(userId)) {
        throw new Error('Puoi modificare solo i tuoi template.')
      }

      const duplicateName = (rows || []).find((row) =>
        String(row.id) !== String(id)
        && String(row.name || '').trim().toLocaleLowerCase('it-IT') === safeName.toLocaleLowerCase('it-IT'))
      if (duplicateName) throw new Error('Esiste già un template con questo nome.')

      const { data, error } = await updateAnalysisTemplateRow(id, {
        name: safeName,
        schema_version: MATCH_ANALYSIS_SCHEMA_VERSION,
        schema_json: createAnalysisTemplateDefinition(schema),
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return normalizeTemplate(data)
    },

    async remove(id) {
      if (!id) return
      const { error } = await deleteAnalysisTemplateRow(id)
      if (error) throw error
    },
  }
}
