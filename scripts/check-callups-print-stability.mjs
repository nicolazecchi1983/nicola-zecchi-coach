import fs from 'node:fs'

const controller = fs.readFileSync('src/app/appController.js', 'utf8')
const engine = fs.readFileSync('src/shared/print/printEngine.js', 'utf8')
const page = fs.readFileSync('public/print.html', 'utf8')

const checks = [
  ['Convocazioni genera HTML reale', controller.includes('class="callups-print"')],
  ['Convocazioni contiene almeno la lista selezionati', controller.includes('selected.length')],
  ['Convocazioni usa Print Engine condiviso', controller.includes('printHtmlDocument')],
  ['Print Engine mantiene payload storage', engine.includes('savePrintPayload(token, payload)')],
  ['Print Engine supporta handshake opener', engine.includes("staff-print-request") && engine.includes("staff-print-payload")],
  ['Pagina stampa richiede fallback payload', page.includes('requestPayloadFromOpener')],
  ['Pagina stampa attende immagini', page.includes('await waitForImages()')],
  ['Pagina stampa attende paint prima di stampare', page.includes('await shortPaintDelay()')],
  ['Pagina stampa rifiuta contenuto senza testo', page.includes("!printable.textContent.trim()")],
  ['Print shield forza root visibile', page.includes('#printRoot { display:block !important')],
]

let passed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`✗ ${label}`)
    process.exitCode = 1
  } else {
    console.log(`✓ ${label}`)
    passed += 1
  }
}
console.log(`\nCallups print stability: ${passed}/${checks.length} controlli superati.`)
if (passed !== checks.length) process.exit(1)
