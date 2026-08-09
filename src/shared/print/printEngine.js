const PRINT_PAYLOAD_PREFIX = 'staff-print-payload:'
const PRINT_PAGE_PATH = '/print.html'
const PRINT_MESSAGE_REQUEST = 'staff-print-request'
const PRINT_MESSAGE_PAYLOAD = 'staff-print-payload'

function createPrintToken() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function collectDocumentStyles(doc = document) {
  return [...doc.querySelectorAll('link[rel="stylesheet"], style')]
    .map((node) => node.outerHTML)
    .join('')
}

function normalizeExtraStyles(styles = '') {
  const raw = String(styles || '').trim()
  if (!raw) return ''
  const unwrapped = raw.replace(/^<style(?:\s[^>]*)?>/i, '').replace(/<\/style>$/i, '').trim()
  return unwrapped ? `<style data-print-engine-extra>${unwrapped}</style>` : ''
}

function assertPrintableElement(element) {
  if (!(element instanceof Element)) {
    throw new Error('Documento da stampare non disponibile')
  }

  const rect = element.getBoundingClientRect()
  if (!element.innerHTML.trim() || rect.width < 20 || rect.height < 20) {
    throw new Error('Il documento non è ancora pronto per la stampa')
  }
}

function savePrintPayload(token, payload) {
  try {
    localStorage.setItem(`${PRINT_PAYLOAD_PREFIX}${token}`, JSON.stringify(payload))
  } catch (error) {
    throw new Error('Il documento è troppo grande per essere preparato alla stampa', { cause: error })
  }
}

function removePrintPayload(token) {
  try { localStorage.removeItem(`${PRINT_PAYLOAD_PREFIX}${token}`) } catch {}
}

export function openPrintDocument(element, {
  title = 'Documento',
  bodyClass = '',
  pagePath = PRINT_PAGE_PATH,
  autoClose = true,
  extraStyles = '',
  includeDocumentStyles = true,
} = {}) {
  assertPrintableElement(element)

  const token = createPrintToken()
  const payload = {
    version: 2,
    createdAt: Date.now(),
    title,
    bodyClass,
    autoClose,
    baseHref: `${location.origin}/`,
    styles: `${includeDocumentStyles ? collectDocumentStyles() : ''}${normalizeExtraStyles(extraStyles)}`,
    content: element.outerHTML,
  }

  // Storage è il percorso primario e rimane compatibile con tutte le stampe esistenti.
  // L'handshake postMessage sotto evita che una nuova finestra resti senza payload
  // in browser che isolano/ritardano la sincronizzazione dello storage.
  savePrintPayload(token, payload)

  const printUrl = new URL(pagePath, location.origin)
  printUrl.searchParams.set('token', token)

  let printWindow = null
  const handlePrintMessage = (event) => {
    if (event.origin !== location.origin || event.source !== printWindow) return
    if (event.data?.type !== PRINT_MESSAGE_REQUEST || event.data?.token !== token) return
    printWindow?.postMessage({
      type: PRINT_MESSAGE_PAYLOAD,
      token,
      payload,
    }, location.origin)
  }
  window.addEventListener('message', handlePrintMessage)

  printWindow = window.open(printUrl.toString(), '_blank', 'width=1100,height=900')
  if (!printWindow) {
    window.removeEventListener('message', handlePrintMessage)
    removePrintPayload(token)
    throw new Error('Il browser ha bloccato la finestra di stampa')
  }

  // Pulizia differita: la pagina di stampa rimuove il payload appena lo consuma.
  // Questo timeout copre tab lente o sospese senza lasciare storage permanente.
  window.setTimeout(() => {
    window.removeEventListener('message', handlePrintMessage)
    removePrintPayload(token)
  }, 120_000)

  return printWindow
}

export function openPrintHtmlDocument({ title = 'Documento', html = '', className = '', styles = '' } = {}) {
  const host = document.createElement('div')
  host.className = className
  host.innerHTML = String(html)
  if (!host.innerHTML.trim()) throw new Error('Documento da stampare non disponibile')
  document.body.appendChild(host)
  try {
    return openPrintDocument(host, {
      title,
      bodyClass: className,
      extraStyles: styles,
      includeDocumentStyles: false,
    })
  } finally {
    host.remove()
  }
}
