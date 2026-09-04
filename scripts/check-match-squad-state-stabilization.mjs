import fs from 'node:fs'

const app = fs.readFileSync('src/app/appController.js','utf8')
const legacy = fs.readFileSync('src/modules/match/events/legacyMatchEditorEvents.js','utf8')
const view = fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const css = fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')

const checks = [
  ['Distinta keeps structural 20-player cap',
    legacy.includes('const benchSelects = Array.from({ length: 9 }') &&
    legacy.includes('const total = currentLineupSelections().starters.filter(Boolean).length + selectedBench') &&
    legacy.includes('Distinta: ${total}/20') &&
    !legacy.includes('finalSave.disabled = total > 20')],
  ['Bench exposes exactly nine fixed slots',
    view.includes('Array.from({ length: 9 }') &&
    view.includes('name="bench_${index}"') &&
    view.includes('data-bench-select="${index}"')],
  ['Fixed bench positions are labelled P1 through P9',
    view.includes('>P${index + 1}</span>') &&
    view.includes('aria-label="Panchina P${index + 1}"')],
  ['Bench match-number defaults are 12 through 20',
    view.includes('<b data-bench-shirt-number="${index}">${index + 12}</b>')],
  ['Bench keeps starters visible and marks reuse instead of hiding',
    !legacy.includes('!starters.has(player.canonicalName)') &&
    legacy.includes('— già utilizzato')],
  ['Bench permits temporary duplicates but exposes invalid state',
    !legacy.includes('!usedElsewhere.has(player.canonicalName)') &&
    legacy.includes('duplicateLineupPlayers') &&
    legacy.includes("aria-invalid")],
  ['Bench selection survives refresh when still valid',
    legacy.includes('const currentBench = benchSelects.map') &&
    legacy.includes('if (ownValue && roster.some((player) => player.canonicalName === ownValue)) select.value = ownValue')],
  ['Bench selection mutations refresh report and persistence',
    legacy.includes("select.addEventListener('change', () => { updateAutomaticBench(); renderReport(); save() })")],
  ['Bench fixed-slot visual contract exists',
    css.includes('.bench-grid--slots') && css.includes('.bench-slot-number') && css.includes('.bench-slot select')],
  ['Starter jersey numbers remain independent', view.includes('name="starter_number_${index}"')],
  ['Captain and vice restoration is deferred until starter options exist',
    legacy.includes("if (k === 'captain' || k === 'vice_captain') return") &&
    legacy.includes('restoredLeadership = {') &&
    legacy.includes('refreshLeadershipSelects()')],
  ['Captain persists immediately', legacy.includes('const assignLeadershipRole = (role, playerIndex) =>') && legacy.includes('save()')],
  ['Captain and vice cannot be same player', legacy.includes("if (index && otherField?.value === index) otherField.value = ''")],
  ['Formation/pitch behavior remains untouched', legacy.includes('applyFormation(formationSelect.value)') && legacy.includes('bindTokenDragging()')],
  ['Match section orchestration remains untouched', app.includes('wireMatchWorkspaceEvents({')],
]
let passed=0
for (const [label,ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\nMatch Squad State Stabilization: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
