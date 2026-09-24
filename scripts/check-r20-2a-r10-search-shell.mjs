import fs from 'node:fs'
const shell = fs.readFileSync('src/app/appShellView.js','utf8')
const controller = fs.readFileSync('src/app/appController.js','utf8')
const trainingEditorEvents = fs.readFileSync('src/modules/training/events/trainingEditorEvents.js','utf8')
const runtime = `${controller}\n${trainingEditorEvents}`

const checks = [
  ['Topbar non duplica il nome squadra', !shell.includes('<span class="topbar-context-product">${escapeHtml(resolveSidebarTeamName(team))}</span>')],
  ['Topbar mantiene la stagione', shell.includes('topbar-context-season') && shell.includes('Stagione ${escapeHtml(team.season)}')],
  ['Ricerca usa handler delegato stabile', runtime.includes("manualEditor.addEventListener('input'") && runtime.includes('filterTrainingRoster')],
  ['Clear X usa handler delegato stabile', runtime.includes("manualEditor.addEventListener('click'") && runtime.includes('[data-clear-player-search]')],
  ['Clear X svuota il campo', runtime.includes("if (searchInput) searchInput.value = ''")],
  ['Clear X ripristina il filtro', runtime.includes('filterTrainingRoster()')],
  ['Filtro usa hidden semantico sulle righe', runtime.includes('row.hidden = !match')],
  ['Filtro aggiorna anche la visibilità dei reparti', runtime.includes("department.hidden = ![...department.querySelectorAll('[data-player-row]')]")],
  ['Filtro usa prefisso cognome', runtime.includes('surnameKey.startsWith(query)')],
  ['Filtro usa prefisso parole nome', runtime.includes('word.startsWith(query)')],
]
let passed=0
for(const [label,ok] of checks){ if(ok){console.log(`✓ ${label}`);passed++} else {console.error(`✗ ${label}`);process.exitCode=1} }
console.log(`\nR20.2A-R10 Search + Shell: ${passed}/${checks.length}`)
if(passed!==checks.length) process.exit(1)
