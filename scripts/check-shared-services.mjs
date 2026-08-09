import { readFile } from 'node:fs/promises'

const files = [
  'src/app/appController.js',
  'src/modules/board/boardView.js',
  'src/modules/dashboard/dashboardView.js',
  'src/modules/match/ui/matchSquadView.js',
  'src/shared/documentViewer/documentViewer.js',
]

const violations = []
for (const file of files) {
  const source = await readFile(file, 'utf8')
  if (/function\s+escapeHtml\s*\(/.test(source)) violations.push(`${file}: escapeHtml locale ancora presente`)
}

const appController = await readFile('src/app/appController.js', 'utf8')
if (/function\s+readLocalJson\s*\(/.test(appController)) violations.push('appController.js: readLocalJson locale ancora presente')
if (/function\s+formationOptionsHtml\s*\(/.test(appController)) violations.push('appController.js: formationOptionsHtml locale ancora presente')
if (/function\s+playerKey\s*\(/.test(appController)) violations.push('appController.js: playerKey locale ancora presente')

if (violations.length) {
  console.error('\nSHARED SERVICES CHECK: FAILED\n')
  violations.forEach((item) => console.error(`- ${item}`))
  process.exit(1)
}
console.log('SHARED SERVICES CHECK: OK')
