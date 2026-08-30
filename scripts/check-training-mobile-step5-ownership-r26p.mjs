import fs from 'node:fs';
const responsive=fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const polish=fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');
const checks=[];const add=(l,o)=>checks.push([l,Boolean(o)]);
const marker='R2.6P — TRAINING MOBILE STEP 5 OWNERSHIP · CLUSTER 7';
const s=polish.indexOf(marker);
const e=polish.indexOf('R2.6O — TRAINING MOBILE STEP 3 OWNERSHIP',s);
const owner=s>=0?polish.slice(s,e>s?e:undefined):'';

add('R2.6P Step 5 owner exists',s>=0);
add('global responsive no longer owns Step 5 pillars',!responsive.includes('.ts-step[data-ts-step="5"] .ts-pillars'));
add('global responsive no longer owns Step 5 analysis fields',!responsive.includes('.ts-step[data-ts-step="5"] .ts-analysis-fields'));
add('global responsive no longer owns pillars collapse',!responsive.includes('.ts-manual-editor .ts-pillars'));
add('global responsive no longer owns pillar touch target',!responsive.includes('.ts-manual-editor .ts-pillar span'));
add('global responsive no longer owns Training AI button',!responsive.includes('.ts-manual-editor .ts-ai-button'));
add('global responsive no longer owns Training AI note',!responsive.includes('.ts-manual-editor .ts-ai-note'));
add('Training domain preserves Step 5 full width',owner.includes('width: 100%;')&&owner.includes('max-width: none;'));
add('Training domain preserves Step 5 inline padding',owner.includes('padding-inline: var(--staff-space-3);'));
add('Training domain preserves analysis one-column collapse',owner.includes('.ts-analysis-fields')&&owner.includes('grid-template-columns: 1fr;'));
add('Training domain preserves pillars one-column collapse',owner.includes('.ts-pillars')&&owner.includes('grid-template-columns: 1fr;'));
add('Training domain preserves pillar touch target',owner.includes('.ts-pillar span')&&owner.includes('min-height: var(--staff-touch-target);'));
add('Training domain preserves AI button full width',owner.includes('.ts-ai-button')&&owner.includes('width: 100%;'));
add('Training domain preserves AI note spacing',owner.includes('.ts-ai-note')&&owner.includes('calc(var(--staff-space-2) * -1)'));
add('migrated Step 5 owner adds no important escalation',!owner.includes('!important'));
add('Page Shell remains outside Step 5 owner',!owner.includes('#viewRoot')&&!owner.includes('.product-page-shell'));

let failed=0;
for(const [l,o] of checks){if(o)console.log(`✓ ${l}`);else{console.error(`✗ ${l}`);failed++;}}
console.log(`\nR2.6P Training Mobile Step 5 Ownership: ${checks.length-failed}/${checks.length}`);
if(failed)process.exit(1);
