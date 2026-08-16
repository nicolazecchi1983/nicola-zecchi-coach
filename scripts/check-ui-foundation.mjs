import { readFile, stat } from 'node:fs/promises'

const requiredFiles = [
  'src/design-system/tokens.css',
  'src/design-system/primitives.css',
  'src/modules/match/ui/matchSheet.css',
]

const requiredTokens = [
  '--staff-control-height',
  '--staff-radius-control',
  '--staff-color-primary',
  '--staff-space-3',
]

const requiredPrimitives = [
  '.staff-button',
  '.staff-button--primary',
  '.staff-button--secondary',
  '.staff-button--danger',
  '.staff-card',
  '.staff-toolbar',
]

const failures = []

for (const file of requiredFiles) {
  try { await stat(file) } catch { failures.push(`File UI Foundation mancante: ${file}`) }
}

const tokens = await readFile(requiredFiles[0], 'utf8')
const primitives = await readFile(requiredFiles[1], 'utf8')
const main = await readFile('src/main.js', 'utf8')

for (const token of requiredTokens) {
  if (!tokens.includes(token)) failures.push(`Token obbligatorio mancante: ${token}`)
}

for (const primitive of requiredPrimitives) {
  if (!primitives.includes(primitive)) failures.push(`Primitive obbligatoria mancante: ${primitive}`)
}


const appView = await readFile('src/modules/match/ui/legacyMatchCompatibilityView.js', 'utf8')
const workspaceEngine = await readFile('src/app/appWorkspaceEngine.js', 'utf8')
const matchSheetStyles = await readFile('src/modules/match/ui/matchSheet.css', 'utf8')
const uiComponents = await readFile('src/design-system/uiComponents.js', 'utf8')

for (const marker of ['staff-editor-template', 'staff-page-header', 'staff-stepper']) {
  if (!appView.includes(marker)) failures.push(`Match Sheet non migrata alla primitive: ${marker}`)
}
if (!appView.includes('editorFooterHtml({') || !uiComponents.includes('staff-editor-footer')) {
  failures.push('Match Sheet non migrata alla primitive: staff-editor-footer')
}

for (const token of ['var(--staff-control-height)', 'var(--staff-radius-control)', 'var(--staff-space-3)']) {
  if (!matchSheetStyles.includes(token)) failures.push(`Match Sheet non usa il token: ${token}`)
}


for (const marker of ['match-page-header__profile', 'match-page-header__actions']) {
  if (!appView.includes(marker)) failures.push(`Golden Match Sheet shell mancante: ${marker}`)
}
if (!workspaceEngine.includes('workspace--editor-focus')) failures.push('Golden Match Sheet shell mancante: workspace--editor-focus')

for (const marker of ['.workspace--editor-focus > .topbar', '.match-page-header__profile', '.match-page-header__avatar']) {
  if (!matchSheetStyles.includes(marker)) failures.push(`Golden Match Sheet style mancante: ${marker}`)
}

if (!main.includes("./design-system/tokens.css") || !main.includes("./design-system/primitives.css")) {
  failures.push('I fogli del Design System non sono importati dal bootstrap applicativo')
}

if (failures.length) {
  console.error('\nUI FOUNDATION CHECK: FAILED\n')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('UI FOUNDATION CHECK: OK (token e primitive verificati)')
