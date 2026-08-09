import fs from 'node:fs'

const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const store = fs.readFileSync('src/app/appStateStore.js', 'utf8')

const requiredStateKeys = [
  'calendarEvents',
  'currentUserRole',
  'currentUser',
  'currentUserProfile',
  'staffProfiles',
  'analysisEntries',
  'playerProfiles',
  'staffFlashMessage',
  'currentCalendarDate',
]

const failures = []

if (!controller.includes("import { appState } from './appStateStore.js'")) {
  failures.push('appController non usa lo store applicativo')
}

for (const key of requiredStateKeys) {
  if (!store.includes(`${key}:`)) {
    failures.push(`chiave mancante nello store: ${key}`)
  }
  const legacyDeclaration = new RegExp(`\\b(?:let|var)\\s+${key}\\b`)
  if (legacyDeclaration.test(controller)) {
    failures.push(`stato legacy ancora dichiarato nel controller: ${key}`)
  }
}

if (!store.includes('export function resetAppSessionState')) {
  failures.push('resetAppSessionState mancante')
}

if (failures.length) {
  console.error('\nSTATE ISOLATION CHECK: FAILED\n')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('STATE ISOLATION CHECK: OK (stato shell/session estratto dal controller)')
