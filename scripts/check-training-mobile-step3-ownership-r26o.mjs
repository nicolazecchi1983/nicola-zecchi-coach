import fs from 'node:fs';
const responsive=fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const polish=fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');
const checks=[];const add=(l,o)=>checks.push([l,Boolean(o)]);
const marker='R2.6O — TRAINING MOBILE STEP 3 OWNERSHIP · CLUSTER 6';
const s=polish.indexOf(marker);
const e=polish.indexOf('R2.6N — TRAINING MOBILE ROSTER OWNERSHIP',s);
const owner=s>=0?polish.slice(s,e>s?e:undefined):'';

add('R2.6O Step 3 owner exists',s>=0);
add('global responsive no longer owns Match Day width',!responsive.includes('.ts-step[data-ts-step="3"] .ts-match-day-block'));
add('global responsive no longer owns load-grid width',!responsive.includes('.ts-step[data-ts-step="3"] .ts-load-grid'));
add('global responsive no longer owns MD selector',!responsive.includes('.ts-manual-editor .ts-md-selector'));
add('global responsive no longer owns rating geometry',!responsive.includes('.ts-manual-editor .ts-rating'));
add('Training domain preserves Step 3 full width',owner.includes('width: 100%;')&&owner.includes('max-width: none;'));
add('Training domain preserves Step 3 inline padding',owner.includes('padding-inline: var(--staff-space-3);'));
add('Training domain preserves load one-column collapse',owner.includes('.ts-load-grid')&&owner.includes('grid-template-columns: 1fr;'));
add('Training domain preserves MD 3-column layout',owner.includes('repeat(3, minmax(0, 1fr))'));
add('Training domain preserves rating 5-column layout',owner.includes('repeat(5, minmax(0, 1fr))'));
add('Training domain preserves MD/rating touch target',owner.includes('min-height: var(--staff-touch-target);'));
add('migrated Step 3 owner adds no important escalation',!owner.includes('!important'));
add('Page Shell remains outside Step 3 owner',!owner.includes('#viewRoot')&&!owner.includes('.product-page-shell'));

let failed=0;
for(const [l,o] of checks){if(o)console.log(`✓ ${l}`);else{console.error(`✗ ${l}`);failed++;}}
console.log(`\nR2.6O Training Mobile Step 3 Ownership: ${checks.length-failed}/${checks.length}`);
if(failed)process.exit(1);
