import {
  matchContextBackButtonHtml,
  matchContextNavigationHtml,
} from '../../../design-system/uiComponents.js'

function attributesHtml(attributes = {}) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== false && value != null)
    .map(([name, value]) => value === true ? name : `${name}="${String(value).replaceAll('"', '&quot;')}"`)
    .join(' ')
}

/**
 * Canonical structural shell for every Match Workspace section.
 * Page views provide content only; width, header, navigation and vertical rhythm live here.
 * Descriptive subtitles are intentionally not part of the canonical Match header: the title + stepper own context.
 */
export function matchWorkspaceShellHtml({
  activeSection = '',
  teamName = '',
  titleHtml = '',
  contentHtml = '',
  className = '',
  attributes = {},
} = {}) {
  const classes = ['view', 'page-view', 'product-page-shell', 'match-workspace-shell', className].filter(Boolean).join(' ')
  const attrs = attributesHtml({ class: classes, ...attributes })

  return `<section ${attrs}>
    <div class="page-head product-page-header match-context-page-head match-workspace-shell__header">
      <div class="match-workspace-shell__intro">
        <span class="match-workspace-shell__eyebrow">MATCH WORKSPACE</span>
        <h1>${titleHtml}</h1>
      </div>
      ${matchContextBackButtonHtml()}
    </div>
    ${matchContextNavigationHtml(activeSection, { teamName })}
    <main class="match-workspace-shell__content product-content-stack" data-match-workspace-content>
      ${contentHtml}
    </main>
  </section>`
}
