import fs from 'node:fs'
import assert from 'node:assert/strict'

const controls = fs.readFileSync('src/design-system/controls.css', 'utf8')
const polish = fs.readFileSync('src/modules/training/trainingPolish.css', 'utf8')
const command = fs.readFileSync('src/modules/training/trainingCommandBar.css', 'utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css', 'utf8')
const ts = fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js', 'utf8')
const tl = fs.readFileSync('src/modules/training/ui/trainingLibraryView.js', 'utf8')
const ml = fs.readFileSync('src/modules/match/ui/matchLibraryView.js', 'utf8')

const checks = [
  ['shared toolbar owner exists', controls.includes('R36.2B — CANONICAL LIBRARY TOOLBAR') && controls.includes('.product-library-toolbar {')],
  ['TL uses shared toolbar/search/filter anatomy', tl.includes('class="product-library-toolbar"') && tl.includes('class="product-library-search"') && tl.includes('class="product-library-filter"')],
  ['ML uses shared toolbar/search/filter anatomy', ml.includes('class="product-library-toolbar"') && ml.includes('class="product-library-search"') && ml.includes('class="product-library-filter"')],
  ['both Libraries expose the same visible search placeholder', tl.includes('placeholder="Cerca nella Library"') && ml.includes('placeholder="Cerca nella Library"')],
  ['TL domain filters preserved', tl.includes('data-library-md-filter') && tl.includes('data-library-feedback-filter')],
  ['ML domain filters preserved', ml.includes('data-match-library-competition') && ml.includes('data-match-library-location') && ml.includes('data-match-library-outcome')],
  ['ML direct visible select toolbar retired', !ml.includes('class="match-library-toolbar"') && !ml.includes('class="match-library-search"')],
  ['TL legacy active toolbar/search classes retired', !tl.includes('library-toolbar--compact') && !tl.includes('library-search-wrap') && !tl.includes('library-filter-menu')],
  ['shared search icon reserves input space', controls.includes('.product-library-search__icon {') && controls.includes('padding: 0 42px 0 44px;')],
  ['shared toolbar mobile touch floor preserved', controls.includes('@media (max-width: 760px)') && controls.includes('min-height: 44px;')],
  ['shared filter panel is desktop anchored and mobile bounded', controls.includes('position: absolute;') && controls.includes('position: fixed;') && controls.includes('left: 16px;') && controls.includes('right: 16px;')],
  ['shared R36.2B block has no important', !controls.split('R36.2B — CANONICAL LIBRARY TOOLBAR')[1].includes('!important')],
  ['shared R36.2B block uses canonical color tokens', !/#[0-9a-fA-F]{3,8}/.test(controls.split('R36.2B — CANONICAL LIBRARY TOOLBAR')[1]) && controls.includes('var(--staff-control-border)') && controls.includes('var(--staff-control-bg)')],
  ['shared R36.2B icon centering avoids translateY', !controls.split('R36.2B — CANONICAL LIBRARY TOOLBAR')[1].includes('translateY(') && controls.includes('margin-block: auto;')],
  ['TS keeps canonical title/meta markup', ts.includes('<h1>Training Sheet Editor</h1>') && ts.includes('class="ts-editor-meta"')],
  ['TS mobile header is two-column title + overflow', polish.includes('R36.2B — MOBILE HEADER ROW ALIGNMENT') && polish.includes('grid-template-columns: minmax(0, 1fr) auto;')],
  ['TS More is fixed to mobile title row', command.includes('R36.2B — MOBILE OVERFLOW IN TITLE ROW') && command.includes('grid-column: 2;') && command.includes('grid-row: 1;')],
  ['TS mobile title no longer overrides shared scale', !polish.includes('--staff-mobile-page-title-size:') && responsive.includes('var(--staff-mobile-page-title-size, clamp(1.82rem, 8.8vw, 2.35rem))')],
]

let passed = 0
for (const [label, ok] of checks) {
  try {
    assert.equal(Boolean(ok), true)
    console.log('PASS', label)
    passed += 1
  } catch {
    console.error('FAIL', label)
  }
}

console.log(`R36.2B Library Toolbar + Mobile Header: ${passed}/${checks.length}`)
if (passed !== checks.length) process.exit(1)
