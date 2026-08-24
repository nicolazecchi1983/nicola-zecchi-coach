import { mergeMatchSquadSnapshotIntoEventNotes, readMatchSquadSnapshotFromEventNotes } from './matchSquadSnapshotModel.js'
export function createMatchSquadSnapshotService({getEvent,updateEvent,reloadEvents}={}) {
  if(typeof getEvent!=='function'||typeof updateEvent!=='function') throw new Error('Formazione non configurata: accesso evento Calendario mancante.')
  return {
    loadFromEvent(eventOrNotes){const rawNotes=typeof eventOrNotes==='object'&&eventOrNotes!==null?(eventOrNotes.rawNotes??eventOrNotes.notes??''):eventOrNotes;return readMatchSquadSnapshotFromEventNotes(rawNotes)},
    async load(matchId){const event=await getEvent(matchId);if(!event?.id)throw new Error('Partita non disponibile nel Calendario.');return readMatchSquadSnapshotFromEventNotes(event.notes||'')},
    async save(matchId,snapshot){const event=await getEvent(matchId);if(!event?.id)throw new Error('Partita non disponibile nel Calendario.');const next={...snapshot,updatedAt:new Date().toISOString()};const notes=mergeMatchSquadSnapshotIntoEventNotes(event.notes,next);await updateEvent(event.id,{notes});if(typeof reloadEvents==='function')await reloadEvents();return readMatchSquadSnapshotFromEventNotes(notes)}
  }
}
