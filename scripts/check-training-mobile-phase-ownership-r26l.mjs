import fs from 'node:fs';

const responsive = fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const polish = fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');

const checks = [];
const add = (label, ok) => checks.push([label, Boolean(ok)]);

const marker = 'R2.6L — TRAINING MOBILE PHASE OWNERSHIP · CLUSTER 3';
const p0 = polish.indexOf(marker);
const p1 = polish.indexOf('R2.6J — TRAINING MOBILE OWNERSHIP CLEANUP', p0);
const owner = p0 >= 0 ? polish.slice(p0, p1 > p0 ? p1 : undefined) : '';

add('R2.6L Training phase owner exists', p0 >= 0);
add('global M1.3C owner is retired', !responsive.includes('M1.3C — TRAINING MOBILE COMMAND ROW + PHASE WIDTH'));
add('global responsive no longer owns phase editor width', !responsive.includes('.ts-manual-editor .ts-phase-editor {\n    width: 100%;'));
add('global responsive no longer owns phase editor head geometry', !responsive.includes('.ts-manual-editor .ts-phase-editor-head {\n    gap: 8px;'));
add('Training domain owns phase card full width', owner.includes('.ts-manual-editor .ts-phase-editor') && owner.includes('width: 100%;') && owner.includes('max-width: none;'));
add('Training domain owns phase header geometry', owner.includes('.ts-manual-editor .ts-phase-editor-head') && owner.includes('gap: 8px;') && owner.includes('align-items: center;'));
add('Training domain owns split action compact geometry', owner.includes('.ts-manual-editor .ts-split-phase-button') && owner.includes('white-space: nowrap;'));
add('Training domain owns phase field width safety', owner.includes('.ts-manual-editor .ts-phase-title-field') && owner.includes('box-sizing: border-box;'));
add('migrated owner introduces no important escalation', !owner.includes('!important'));
add('Page Shell remains outside migrated owner', !owner.includes('#viewRoot') && !owner.includes('.product-page-shell'));

let failed = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`✓ ${label}`);
  else { console.error(`✗ ${label}`); failed++; }
}
console.log(`\nR2.6L Training Mobile Phase Ownership: ${checks.length-failed}/${checks.length}`);
if (failed) process.exit(1);
