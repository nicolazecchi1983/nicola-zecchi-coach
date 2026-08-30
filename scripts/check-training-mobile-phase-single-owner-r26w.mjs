
import fs from 'node:fs';

const responsive=fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const polish=fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');
const marker='R2.6W — TRAINING MOBILE PHASE SINGLE OWNER · CLUSTER 9';
const start=polish.indexOf(marker);
const owner=start>=0?polish.slice(start):'';
const checks=[]; const add=(label,ok)=>checks.push([label,Boolean(ok)]);

add('R2.6W phase single-owner marker exists',start>=0);
add('Training domain owns phases editor full mobile width',owner.includes('.ts-manual-editor .ts-phases-editor')&&owner.includes('width: 100%;')&&owner.includes('max-width: none;'));
add('Training domain preserves phase card inline padding',owner.includes('.ts-manual-editor .ts-phase-editor')&&owner.includes('padding-inline: var(--staff-space-3);'));
add('Training domain preserves phase card block padding',owner.includes('padding-block: var(--staff-space-3);'));
add('Training domain preserves phase action touch target',owner.includes('.ts-add-phase,')&&owner.includes('.ts-split-phase-button,')&&owner.includes('.ts-remove-phase-button')&&owner.includes('min-height: var(--staff-touch-target);'));
add('Training domain preserves phase header geometry',owner.includes('.ts-phase-editor-head')&&owner.includes('align-items: center;')&&owner.includes('gap: var(--staff-space-2);'));
add('Training domain preserves phase action alignment',owner.includes('.ts-phase-editor-actions')&&owner.includes('margin-left: auto;'));
add('Training domain preserves one-column mobile phase metadata',owner.includes('.ts-phase-meta-fields')&&owner.includes('grid-template-columns: 1fr;'));
add('global responsive no longer owns phases editor',!responsive.includes('.ts-manual-editor .ts-phases-editor'));
add('global responsive no longer owns phase editor',!responsive.includes('.ts-manual-editor .ts-phase-editor'));
add('global responsive no longer owns phase actions',!responsive.includes('.ts-manual-editor .ts-add-phase')&&!responsive.includes('.ts-manual-editor .ts-split-phase-button')&&!responsive.includes('.ts-manual-editor .ts-remove-phase-button'));
add('global responsive no longer owns phase metadata',!responsive.includes('.ts-manual-editor .ts-phase-meta-fields'));
add('global responsive still preserves session-grid mobile adaptation',responsive.includes('.ts-manual-editor .ts-session-grid')&&responsive.includes('grid-template-columns: 1fr;')&&responsive.includes('padding-inline: var(--staff-space-3);'));
add('phase owner introduces no important escalation',!owner.includes('!important'));
add('phase owner does not absorb session-grid ownership',!owner.includes('.ts-session-grid'));
add('phase owner does not absorb preview-summary ownership',!owner.includes('.ts-preview-stage')&&!owner.includes('.ts-summary-head'));

let failed=0;
for(const [label,ok] of checks){
  if(ok) console.log(`✓ ${label}`);
  else { console.error(`✗ ${label}`); failed++; }
}
console.log(`\nR2.6W Training Mobile Phase Single Owner: ${checks.length-failed}/${checks.length}`);
if(failed) process.exit(1);
