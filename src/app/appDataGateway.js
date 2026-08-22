import { supabase } from '../supabase.js'
import { listCalendarEvents } from '../modules/calendar/calendarService.js'
import { parseMatchTitle } from '../modules/calendar/ui/calendarView.js'
import { readTrainingLibraryFeedback } from '../modules/training/trainingLibraryService.js'
import { withDataAccessRetry } from '../infrastructure/dataAccess/withDataAccessRetry.js'
import { DATA_OPERATION_KIND } from '../infrastructure/dataAccess/dataOperationPolicy.js'

export async function loadAccessProfile(user) {
  if (!user?.id) {
    return { profile: null, role: 'observer', accessRole: 'read_only' }
  }

  const { data, error } = await withDataAccessRetry(
    () => supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, app_role, active')
      .eq('id', user.id)
      .maybeSingle(),
    { kind: DATA_OPERATION_KIND.READ, stage: 'access-profile' },
  )

  if (error) {
    console.error('Errore caricamento profilo:', error.message)
    return { profile: null, role: 'observer', accessRole: 'read_only' }
  }

  if (data?.active === false) {
    await supabase.auth.signOut()
    throw new Error('Account disattivato')
  }

  const role = data?.role ?? 'observer'
  const accessRole = data?.app_role
    ?? (role === 'owner' ? 'owner' : role === 'read_only' ? 'read_only' : 'collaborator')

  return { profile: data ?? null, role, accessRole }
}

export async function loadMatchAnalysisEntries() {
  const { data, error } = await withDataAccessRetry(
    () => supabase
      .from('match_analysis')
      .select('*')
      .order('match_date', { ascending: false })
      .order('minute', { ascending: true }),
    { kind: DATA_OPERATION_KIND.READ, stage: 'match-analysis-list' },
  )

  if (error) {
    console.warn('Analisi gare non ancora collegata:', error.message)
    return []
  }

  return data ?? []
}


export async function loadCalendarEventModels() {
  const events = await listCalendarEvents()

  return events.map((event) => {
    const trainingSheetPath = event.training_sheet_path ?? null
    // Signed URLs are intentionally NOT created while listing Calendar events.
    // Private document URLs are short-lived capabilities and are resolved only
    // when the user explicitly opens the published Training Sheet.
    const trainingSheetUrl = null

    let parsedNotes = {}
    try { parsedNotes = JSON.parse(event.notes || '{}') } catch {}
    const titleMatchData = parseMatchTitle(event.title)

    return {
      id: event.id,
      day: new Date(event.start_at).getDate(),
      title: event.title,
      time: new Date(event.start_at).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      place: event.location || '',
      type: event.event_type || 'training',
      startAt: event.start_at,
      matchDay: (event.event_type === 'match' && parsedNotes?.type === 'match_event')
        ? (parsedNotes.competition_round ?? null)
        : (event.match_day ?? null),
      competitionRound: (event.event_type === 'match' && parsedNotes?.type === 'match_event')
        ? (parsedNotes.competition_round ?? null)
        : null,
      presentCount: event.present_count ?? null,
      squadTotal: event.squad_total ?? null,
      trainingSheetPath,
      trainingSheetUrl,
      editorData: parsedNotes?.type === 'training_sheet_editor' ? parsedNotes.data : null,
      matchType: event.match_type
        || (parsedNotes?.type === 'match_event' ? parsedNotes.match_type || null : null)
        || titleMatchData.matchType,
      opponent: event.opponent
        || (parsedNotes?.type === 'match_event' ? parsedNotes.opponent || '' : '')
        || titleMatchData.opponent,
      homeAway: parsedNotes?.type === 'match_event' ? parsedNotes.home_away || 'home' : 'home',
      rawNotes: event.notes || null,
      libraryFeedback: readTrainingLibraryFeedback(event.notes),
      matchReportData: parsedNotes?.type === 'match_event' ? parsedNotes.match_report || null : null,
      matchReportStatus: parsedNotes?.type === 'match_event' ? parsedNotes.report_status || null : null,
      restNote: parsedNotes?.type === 'rest_event' ? parsedNotes.rest_note || '' : '',
    }
  })
}
