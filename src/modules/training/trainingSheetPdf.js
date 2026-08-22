const CAPTURE_WIDTH = 794
const PDF_RUNTIME_TIMEOUT_MS = 15000
const PDF_RUNTIME_SCRIPT_ATTRIBUTE = 'data-staff-pdf-runtime'

const PDF_RUNTIME_SCRIPTS = Object.freeze([
  Object.freeze({
    id: 'html2canvas',
    src: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    isReady: () => typeof window !== 'undefined' && typeof window.html2canvas === 'function',
  }),
  Object.freeze({
    id: 'jspdf',
    src: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
    isReady: () => typeof window !== 'undefined' && typeof window.jspdf?.jsPDF === 'function',
  }),
])

let pdfRuntimePromise = null

function removeFailedRuntimeScript(script) {
  try {
    if (script?.parentNode && script.getAttribute?.(PDF_RUNTIME_SCRIPT_ATTRIBUTE)) {
      script.parentNode.removeChild(script)
    }
  } catch (_) {}
}

function waitForRuntimeScript({ id, src, isReady }) {
  if (isReady()) return Promise.resolve()

  const selector = `script[${PDF_RUNTIME_SCRIPT_ATTRIBUTE}="${id}"]`
  const existingScript = document.querySelector(selector)

  return new Promise((resolve, reject) => {
    let settled = false
    let timeoutId = null
    const script = existingScript || document.createElement('script')
    const shouldAppend = !existingScript

    const cleanup = () => {
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
      if (timeoutId) clearTimeout(timeoutId)
    }

    const succeed = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }

    const fail = (message) => {
      if (settled) return
      settled = true
      cleanup()
      removeFailedRuntimeScript(script)
      reject(new Error(message))
    }

    const onLoad = () => {
      if (isReady()) succeed()
      else fail(`Runtime PDF ${id} caricato ma non disponibile.`)
    }

    const onError = () => fail(`Impossibile caricare il runtime PDF ${id}.`)

    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })

    if (isReady()) {
      succeed()
      return
    }

    timeoutId = setTimeout(() => {
      fail(`Timeout durante il caricamento del runtime PDF ${id}.`)
    }, PDF_RUNTIME_TIMEOUT_MS)

    if (shouldAppend) {
      script.src = src
      script.async = true
      script.crossOrigin = 'anonymous'
      script.setAttribute(PDF_RUNTIME_SCRIPT_ATTRIBUTE, id)
      document.head.appendChild(script)
    }
  })
}

function assertBrowserPdfEnvironment() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.head) {
    throw new Error('Runtime browser PDF non disponibile.')
  }
}

function assertPdfDependencies() {
  if (typeof window.html2canvas !== 'function' || typeof window.jspdf?.jsPDF !== 'function') {
    throw new Error('Generatore PDF non disponibile. Controlla la connessione e riprova.')
  }
}

export async function ensureTrainingPdfRuntime() {
  assertBrowserPdfEnvironment()
  if (PDF_RUNTIME_SCRIPTS.every(({ isReady }) => isReady())) return
  if (pdfRuntimePromise) return pdfRuntimePromise

  pdfRuntimePromise = Promise.all(PDF_RUNTIME_SCRIPTS.map(waitForRuntimeScript))
    .then(() => {
      assertPdfDependencies()
      pdfRuntimePromise = null
    })
    .catch((error) => {
      pdfRuntimePromise = null
      throw error
    })

  return pdfRuntimePromise
}

async function captureTrainingSheet(previewElement) {
  if (!previewElement) throw new Error('Anteprima Training Sheet non disponibile.')
  const captureRoot = document.createElement('div')
  captureRoot.className = 'ts-capture-root'
  const capturePaper = previewElement.cloneNode(true)
  capturePaper.classList.add('ts-paper--capture')
  Object.assign(capturePaper.style, {
    width: `${CAPTURE_WIDTH}px`,
    minWidth: `${CAPTURE_WIDTH}px`,
    maxWidth: `${CAPTURE_WIDTH}px`,
    transform: 'none',
    margin: '0',
  })
  captureRoot.appendChild(capturePaper)
  document.body.appendChild(captureRoot)
  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return await window.html2canvas(capturePaper, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: CAPTURE_WIDTH,
      height: capturePaper.scrollHeight,
      windowWidth: 1280,
    })
  } finally {
    captureRoot.remove()
  }
}

export async function generateTrainingSheetPdf(previewElement) {
  await ensureTrainingPdfRuntime()
  const canvas = await captureTrainingSheet(previewElement)
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const pageWidth = 210
  const pageHeight = 297
  const margin = 5
  const imageWidth = pageWidth - margin * 2
  const imageHeight = canvas.height * imageWidth / canvas.width
  const scale = Math.min(1, (pageHeight - margin * 2) / imageHeight)
  const finalWidth = imageWidth * scale
  const finalHeight = imageHeight * scale
  pdf.addImage(
    canvas.toDataURL('image/jpeg', 0.96),
    'JPEG',
    (pageWidth - finalWidth) / 2,
    margin,
    finalWidth,
    finalHeight,
    undefined,
    'FAST',
  )
  return { pdf, blob: pdf.output('blob') }
}
