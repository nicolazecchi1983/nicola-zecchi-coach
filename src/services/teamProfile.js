import { supabase } from '../supabase.js'

export const DEFAULT_TEAM_PROFILE = Object.freeze({
  id: null,
  ownerId: null,
  name: 'La tua squadra',
  shortName: 'Squadra',
  season: '2026/27',
  category: '',
  competitionGroup: '',
  logo: '',
  primaryColor: '#07194f',
  secondaryColor: '#1f93e5',
  kitPattern: 'solid',
  rosterInitialized: true,
})

const LOCAL_KEY_PREFIX = 'nz-team-profile-v3'
let cachedProfile = null
let activeUserId = null

function localKey(userId = activeUserId) {
  return userId ? `${LOCAL_KEY_PREFIX}:${userId}` : LOCAL_KEY_PREFIX
}

function normalize(row = {}) {
  return {
    ...DEFAULT_TEAM_PROFILE,
    id: row.id ?? null,
    ownerId: row.ownerId ?? row.owner_id ?? null,
    name: row.name ?? row.full_name ?? DEFAULT_TEAM_PROFILE.name,
    shortName: row.shortName ?? row.short_name ?? DEFAULT_TEAM_PROFILE.shortName,
    season: row.season ?? DEFAULT_TEAM_PROFILE.season,
    category: row.category ?? DEFAULT_TEAM_PROFILE.category,
    competitionGroup: row.competitionGroup ?? row.competition_group ?? DEFAULT_TEAM_PROFILE.competitionGroup,
    logo: row.logo ?? row.logo_url ?? '',
    primaryColor: row.primaryColor ?? row.primary_color ?? DEFAULT_TEAM_PROFILE.primaryColor,
    secondaryColor: row.secondaryColor ?? row.secondary_color ?? DEFAULT_TEAM_PROFILE.secondaryColor,
    kitPattern: row.kitPattern ?? row.kit_pattern ?? DEFAULT_TEAM_PROFILE.kitPattern,
    rosterInitialized: row.rosterInitialized ?? row.roster_initialized ?? DEFAULT_TEAM_PROFILE.rosterInitialized,
  }
}

function readLocal(userId = activeUserId) {
  try {
    const value = JSON.parse(localStorage.getItem(localKey(userId)) || 'null')
    return value && typeof value === 'object' ? normalize(value) : null
  } catch {
    return null
  }
}

function writeLocal(profile, userId = activeUserId) {
  try { localStorage.setItem(localKey(userId), JSON.stringify(normalize(profile))) } catch {}
}

export function getTeamProfile() {
  if (!cachedProfile) cachedProfile = readLocal() || { ...DEFAULT_TEAM_PROFILE }
  return { ...cachedProfile }
}

export async function loadTeamProfile(user) {
  activeUserId = user?.id || null
  const local = readLocal(activeUserId)
  cachedProfile = local || { ...DEFAULT_TEAM_PROFILE }
  if (!supabase || !user?.id) return getTeamProfile()

  try {
    const membership = await supabase
      .from('team_members')
      .select('team_id, teams(*)')
      .eq('user_id', user.id)
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (membership.error) throw membership.error

    let row = membership.data?.teams || null
    if (!row) {
      const owned = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (owned.error) throw owned.error
      row = owned.data || null
    }

    if (row) {
      const remote = normalize(row)
      // Se il record remoto è stato creato prima del caricamento del logo,
      // conserva temporaneamente il logo locale finché non viene sincronizzato.
      cachedProfile = normalize({ ...local, ...remote, logo: remote.logo || local?.logo || '' })
      writeLocal(cachedProfile, activeUserId)
    }
  } catch (error) {
    console.warn('Configurazione squadra non disponibile:', error?.message || error)
  }
  return getTeamProfile()
}

async function ensureTeam(user, profile) {
  if (profile.id) return profile.id
  const { data, error } = await supabase.rpc('ensure_my_team', {
    p_name: profile.name,
    p_short_name: profile.shortName,
    p_season: profile.season || null,
    p_category: profile.category || null,
    p_primary_color: profile.primaryColor,
    p_secondary_color: profile.secondaryColor,
    p_kit_pattern: profile.kitPattern,
  })
  if (error) throw new Error(`Impossibile inizializzare la squadra: ${error.message}`)
  if (!data) throw new Error('Supabase non ha restituito l’identificativo della squadra.')
  return data
}

async function uploadLogo(teamId, file) {
  if (!(file instanceof File) || !file.size) return null
  if (file.size > 2 * 1024 * 1024) throw new Error('Il logo supera il limite di 2 MB.')
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Formato logo non supportato.')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
  // Non sovrascrivere l'asset attualmente referenziato dal profilo:
  // se il successivo UPDATE del team fallisce, il vecchio logo deve restare valido.
  const path = `${teamId}/logos/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('team-assets').upload(path, file, { upsert: false, cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from('team-assets').getPublicUrl(path)
  return data.publicUrl
}

export async function saveTeamProfile(profile, { user, logoFile, removeLogo = false } = {}) {
  activeUserId = user?.id || activeUserId
  const previous = getTeamProfile()
  const next = normalize({ ...previous, ...profile })

  // Modalità locale esplicita: senza backend/sessione non esiste una conferma remota
  // da attendere, quindi il profilo resta salvabile nella cache locale.
  if (!supabase || !user?.id) {
    cachedProfile = next
    writeLocal(cachedProfile, activeUserId)
    return getTeamProfile()
  }

  const teamId = await ensureTeam(user, next)
  let logoUrl = removeLogo ? null : next.logo || null
  if (logoFile instanceof File && logoFile.size) logoUrl = await uploadLogo(teamId, logoFile)

  const payload = {
    name: next.name,
    short_name: next.shortName,
    season: next.season || null,
    category: next.category || null,
    competition_group: next.competitionGroup || null,
    logo_url: logoUrl,
    primary_color: next.primaryColor,
    secondary_color: next.secondaryColor,
    kit_pattern: next.kitPattern,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('teams')
    .update(payload)
    .eq('id', teamId)
    .select('*')
    .single()

  if (error) throw error

  // Solo la risposta confermata da Supabase diventa lo stato canonico locale.
  cachedProfile = normalize(data)
  writeLocal(cachedProfile, activeUserId)
  return getTeamProfile()
}
