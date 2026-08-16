import fs from 'node:fs'
import path from 'node:path'
import { releaseGateIncludes } from './release-gate-contract.mjs'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const matchTest = read('tests/domain/matchAnalysisSchema.test.js')
const trainingTest = read('tests/domain/trainingSheetParser.test.js')
const pkg = JSON.parse(read('package.json'))

const checks = [
  ['Match Analysis Schema test presente', fs.existsSync(path.join(root, 'tests/domain/matchAnalysisSchema.test.js'))],
  ['Training Sheet Parser test presente', fs.existsSync(path.join(root, 'tests/domain/trainingSheetParser.test.js'))],
  ['Match test importa il modulo reale', matchTest.includes("from '../../src/modules/match/matchAnalysisSchema.js'")],
  ['Training test importa il parser reale', trainingTest.includes("from '../../src/services/trainingSheetParser.js'")],
  ['Match copre template canonico', matchTest.includes('crea il template STAFF canonico')],
  ['Match copre migrazione legacy', matchTest.includes('migra uno schema legacy v1')],
  ['Match copre serializzazione e note', matchTest.includes('serializza sempre una versione normalizzata')],
  ['Training copre estrazione dati e fasi', trainingTest.includes('estrae i dati principali e costruisce le fasi')],
  ['Training copre orari fuori range', trainingTest.includes('rifiuta orari fuori range')],
  ['Training copre Rosa/assenze', trainingTest.includes('usando i nomi della Rosa')],
  ['Training copre campi obbligatori mancanti', trainingTest.includes('campi obbligatori mancanti')],
  ['Expansion guard incluso nel release gate', releaseGateIncludes(pkg, 'check:domain-tests-expansion')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed += 1
}
console.log(`\n0.28.2 Domain Tests Expansion: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
