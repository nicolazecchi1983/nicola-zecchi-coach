import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const pageShell = read('src/design-system/pageShell.css')
const product = read('src/design-system/productUi.css')
const polish = read('src/design-system/polish.css')
const training = read('src/design-system/training-editor.css')
const responsive = read('src/design-system/responsive.css')

const exactRootGeometry = (css) => {
  const blocks = [...css.matchAll(/(^|\n)#viewRoot\s*\{([^}]*)\}/g)].map((m) => m[2])
  return blocks.some((body) => /\b(?:padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|width|max-width|min-width)\s*:/.test(body))
}

const productShellBlock = product.match(/\.product-page-shell\s*\{([^}]*)\}/)?.[1] || ''

const checks = [
  ['pageShell owns canonical root geometry', pageShell.includes('#viewRoot {') && pageShell.includes('padding: var(--staff-page-top) var(--staff-page-inline) var(--staff-page-bottom)')],
  ['pageShell owns mobile safe-area gutters', pageShell.includes('var(--staff-safe-left, 0px)') && pageShell.includes('var(--staff-safe-right, 0px)')],
  ['mobile bottom spacing matches drawer navigation, not retired bottom nav', pageShell.includes('--staff-page-bottom: calc(28px + var(--staff-safe-bottom, 0px))')],
  ['Product UI shell no longer adds a second page gutter', productShellBlock.includes('padding:0') && !productShellBlock.includes('--product-page-inline')],
  ['Product UI has no obsolete outer-page gutter tokens', !product.includes('--product-page-inline') && !product.includes('--product-page-bottom')],
  ['polish layer no longer owns root geometry', !exactRootGeometry(polish)],
  ['Training editor no longer owns root geometry', !exactRootGeometry(training)],
  ['final responsive layer no longer owns root geometry', !exactRootGeometry(responsive)],
  ['responsive still owns mobile shell/navigation behavior', responsive.includes('.topbar {') && responsive.includes('.mobile-drawer-shell')],
  ['pageShell remains free of important escalation', !pageShell.includes('!important')],
]

let passed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (ok) passed++
}
console.log(`\nPage Geometry Single Owner: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
