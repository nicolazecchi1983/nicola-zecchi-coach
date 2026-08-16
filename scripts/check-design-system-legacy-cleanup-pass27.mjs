import fs from 'node:fs'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const style = fs.readFileSync('src/style.css', 'utf8')
const viewer = fs.readFileSync('src/shared/documentViewer/documentViewer.css', 'utf8')
const main = fs.readFileSync('src/main.js', 'utf8')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const checks = [
  ['global legacy marks document viewer migration', style.includes('shared document viewer ownership migrated to src/shared/documentViewer/documentViewer.css in 0.27.40')],
  ['global legacy no longer owns document viewer backdrop', !style.includes('.document-viewer-backdrop')],
  ['global legacy no longer owns document viewer shell', !style.includes('.document-viewer{')],
  ['global legacy no longer owns document viewer body lock', !style.includes('body.document-viewer-open')],
  ['document viewer owner exists', viewer.includes('Shared Document Viewer canonical owner')],
  ['document viewer owner retains backdrop contract', viewer.includes('.document-viewer-backdrop')],
  ['document viewer owner retains iframe and image contract', viewer.includes('.document-viewer-frame') && viewer.includes('.document-viewer-image')],
  ['document viewer owner retains mobile full-screen contract', viewer.includes('@media(max-width:720px)') && viewer.includes('height:100dvh')],
  ['drawer Training actions remain outside shared viewer owner', !viewer.includes('.drawer-ts-view-actions') && style.includes('.drawer-ts-view-actions')],
  ['shared viewer is imported after global legacy', main.indexOf("./shared/documentViewer/documentViewer.css") > main.indexOf("./style.css")],
  ['shared viewer is imported before later polish layers', main.indexOf("./shared/documentViewer/documentViewer.css") < main.indexOf("./design-system/polish.css")],
  ['Pass 27 is in aggregate gate', releaseGateIncludes(packageJson, 'check:design-system-legacy-cleanup-pass27')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (ok) passed += 1
}
console.log(`\nDS Legacy Cleanup Pass 27: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
