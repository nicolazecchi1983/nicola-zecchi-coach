import fs from 'node:fs'
import { normalizeMatchPostMatch } from '../src/modules/match/matchPostMatchModel.js'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const model = fs.readFileSync('src/modules/match/matchPostMatchModel.js', 'utf8')
const view = fs.readFileSync('src/modules/match/ui/matchPostMatchView.js', 'utf8')
const events = fs.readFileSync('src/modules/match/events/matchPostMatchSectionsEvents.js', 'utf8')
const workspaceEvents = fs.readFileSync('src/modules/match/events/matchWorkspaceEvents.js', 'utf8')
const css = fs.readFileSync('src/modules/match/ui/matchPostMatch.css', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const legacy = normalizeMatchPostMatch({ debrief: 'Storico', positives: 'Conferma' })
const debrief = legacy.sections.find((section) => section.id === 'debrief')
const positives = legacy.sections.find((section) => section.id === 'positives')

const checks = [
  ['Post-gara usa schema v2', model.includes('MATCH_POST_MATCH_SCHEMA_VERSION = 2')],
  ['Sezioni hanno identità stabile indipendente dal titolo', model.includes('id: \'debrief\'') && model.includes('cleanSectionId')],
  ['Storici migrano nei nuovi sections[]', debrief?.content === 'Storico' && positives?.content === 'Conferma'],
  ['Campi canonici restano mirror compatibili', model.includes('Compatibility mirrors for Report / historic consumers') && legacy.debrief === 'Storico'],
  ['Card sono chiuse di default', view.includes('data-post-match-section-toggle aria-expanded="false"') && view.includes('data-post-match-section-body hidden')],
  ['Helper compare solo nel body espanso', view.includes('post-match-section-helper') && !view.includes('post-match-card header p')],
  ['Menu sezione espone rinomina ed elimina', view.includes('data-post-match-section-rename') && view.includes('data-post-match-section-delete')],
  ['Aggiunta sezione ha un solo comando in fondo', view.includes('data-post-match-add-section')],
  ['Event owner dedicato gestisce toggle rename delete add', ['data-post-match-section-toggle','data-post-match-section-rename','data-post-match-section-delete','data-post-match-add-section'].every((token) => events.includes(token))],
  ['Eliminazione protegge sezioni con contenuto', events.includes('Questa sezione contiene dati. Eliminarla?')],
  ['Workspace salva sections raccolte dal componente', workspaceEvents.includes('collectPostMatchSections(postMatchForm)') && workspaceEvents.includes('wirePostMatchSectionsEvents')],
  ['Accordion ha un solo owner CSS domain-local', css.includes('Post-Match Sections Foundation') && css.includes('.post-match-section-toggle') && css.includes('.post-match-section-menu')],
  ['CSS responsive resta nel medesimo owner', css.includes('@media(max-width:760px)')],
  ['Foundation entra nel release gate', releaseGateIncludes(pkg, 'check:post-match-sections-foundation')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nPost-Match Sections Foundation: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
