import fs from 'node:fs'
const style=fs.readFileSync('src/style.css','utf8')
const owner=fs.readFileSync('src/modules/calendar/calendarEventPresentation.css','utf8')
const main=fs.readFileSync('src/main.js','utf8')
const forbidden=['.new-event-form','.training-sheet-preview','.drawer-sheet-link','.drawer-delete-button','.event-type-badge','.event-location-line','.drawer-event-date','.drawer-event-time','.event-md-line','[data-match-fields]','[data-custom-location]']
const checks=[
 ['Calendar event presentation has dedicated owner',owner.includes('Calendar event form/details canonical owner')],
 ['main imports calendar event presentation owner',main.includes("import './modules/calendar/calendarEventPresentation.css'")],
 ['event presentation loads before calendar polish',main.indexOf('calendarEventPresentation.css')<main.indexOf('calendarPolish.css')],
 ['legacy style no longer owns calendar event presentation',forbidden.every(s=>!style.includes(s))],
 ['event form owned by canonical file',owner.includes('.new-event-form')],
 ['drawer sheet link owned by canonical file',owner.includes('.drawer-sheet-link')],
 ['event type badges owned by canonical file',owner.includes('.event-type-badge')],
 ['drawer event date/time owned by canonical file',owner.includes('.drawer-event-date')&&owner.includes('.drawer-event-time')],
 ['match conditional form fields owned by canonical file',owner.includes('[data-match-fields]')],
 ['custom location form owned by canonical file',owner.includes('[data-custom-location]')],
 ['mobile event form rules remain with owner',owner.includes('@media')&&owner.includes('max-width: 640px')],
 ['legacy monolith is below 3900 lines after pass 15',style.split(/\r?\n/).length<3900],
]
let p=0; for(const [l,ok] of checks){console.log(`${ok?'✓':'✗'} ${l}`); if(ok)p++}
console.log(`\nDS Legacy Cleanup Pass 15: ${p}/${checks.length}`); if(p!==checks.length)process.exit(1)
