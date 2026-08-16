import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const srcRoot = path.join(root, 'src')
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const styleCss = fs.readFileSync(path.join(srcRoot, 'style.css'), 'utf8')
const trainingRuntime = fs.readFileSync(path.join(srcRoot, 'modules/training/events/trainingEditorEvents.js'), 'utf8')

const checks = []
const check = (label, condition) => {
  checks.push([label, Boolean(condition)])
  console.log(`${condition ? '✓' : '✗'} ${label}`)
}

check('document language is Italian', /<html\s+lang="it">/i.test(indexHtml))
check('Inter font is loaded from document head', /fonts\.googleapis\.com\/css2\?family=Inter/.test(indexHtml))
check('legacy CSS @import for Google Fonts is removed', !/@import\s+url\([^)]*fonts\.googleapis\.com/i.test(styleCss))

const htmlControlPattern = /<(input|select|textarea)\b[^>]*>/gis
const identityPattern = /\b(?:id|name)\s*=/i
const missing = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.isFile() && full.endsWith('.js')) {
      const source = fs.readFileSync(full, 'utf8')
      for (const match of source.matchAll(htmlControlPattern)) {
        if (!identityPattern.test(match[0])) {
          const line = source.slice(0, match.index).split('\n').length
          missing.push(`${path.relative(root, full)}:${line} ${match[0].replace(/\s+/g, ' ').slice(0, 140)}`)
        }
      }
    }
  }
}
walk(srcRoot)

check('rendered form controls declare id or name', missing.length === 0)
if (missing.length) missing.forEach((item) => console.log(`  - ${item}`))

check('PDF preview uses an object URL', trainingRuntime.includes('URL.createObjectURL(blob)'))
check('PDF preview revokes its object URL', trainingRuntime.includes('URL.revokeObjectURL(objectUrl)'))
check('PDF preview cleanup runs on cancellation/close path', /URL\.revokeObjectURL\(objectUrl\)/.test(trainingRuntime))

const passed = checks.filter(([, ok]) => ok).length
console.log(`\nUI / HTML Code Health: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
