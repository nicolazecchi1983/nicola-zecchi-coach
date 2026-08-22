import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8')
const pdfRuntime = readFileSync(resolve(root, 'src/modules/training/trainingSheetPdf.js'), 'utf8')
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const pdfService = readFileSync(resolve(root, 'src/modules/training/trainingSheetService.js'), 'utf8')

const checks = [
  ['index no longer eagerly loads html2canvas', !/<script[^>]+html2canvas/i.test(indexHtml)],
  ['index no longer eagerly loads jsPDF', !/<script[^>]+jspdf/i.test(indexHtml)],
  ['html2canvas runtime version remains pinned', pdfRuntime.includes('html2canvas@1.4.1/dist/html2canvas.min.js')],
  ['jsPDF runtime version remains pinned', pdfRuntime.includes('jspdf@2.5.2/dist/jspdf.umd.min.js')],
  ['PDF runtime has a single-flight promise', /let\s+pdfRuntimePromise\s*=\s*null/.test(pdfRuntime) && /if\s*\(pdfRuntimePromise\)\s*return\s+pdfRuntimePromise/.test(pdfRuntime)],
  ['successful runtime load also clears transient single-flight state', /\.then\(\(\)\s*=>\s*\{[\s\S]*assertPdfDependencies\(\)[\s\S]*pdfRuntimePromise\s*=\s*null/.test(pdfRuntime)],
  ['failed runtime load resets single-flight state', /\.catch\(\(error\)\s*=>\s*\{[\s\S]*pdfRuntimePromise\s*=\s*null[\s\S]*throw\s+error/.test(pdfRuntime)],
  ['runtime scripts are loaded only through DOM injection', /document\.createElement\(['"]script['"]\)/.test(pdfRuntime) && /document\.head\.appendChild\(script\)/.test(pdfRuntime)],
  ['runtime load has bounded timeout', /PDF_RUNTIME_TIMEOUT_MS\s*=\s*15000/.test(pdfRuntime) && /setTimeout\(/.test(pdfRuntime)],
  ['failed STAFF runtime scripts are removable for retry', pdfRuntime.includes('removeFailedRuntimeScript(script)')],
  ['PDF generation explicitly awaits lazy runtime', /generateTrainingSheetPdf[\s\S]*await\s+ensureTrainingPdfRuntime\(\)/.test(pdfRuntime)],
  ['PDF generation failure copy mentions connection and preview', pdfService.includes('Verifica la connessione e l’anteprima, poi riprova.')],
  ['PDF runtime gate is registered in package scripts', packageJson.scripts?.['check:pdf-lazy-runtime'] === 'node scripts/check-pdf-lazy-runtime.mjs'],
  ['PDF runtime gate is part of canonical check suite', packageJson.staffCheckSuite?.includes('check:pdf-lazy-runtime')],
]

let failed = 0
for (const [label, ok] of checks) {
  if (ok) console.log(`PASS ${label}`)
  else {
    failed += 1
    console.error(`FAIL ${label}`)
  }
}

if (failed) {
  console.error(`\nR2.1C PDF Lazy Runtime: ${checks.length - failed}/${checks.length} checks passed.`)
  process.exit(1)
}

console.log(`\nR2.1C PDF Lazy Runtime: ${checks.length}/${checks.length} checks passed.`)
