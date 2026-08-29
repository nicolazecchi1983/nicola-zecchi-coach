import fs from 'node:fs';
const responsive=fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const polish=fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');
const checks=[];const add=(l,o)=>checks.push([l,Boolean(o)]);
const marker='R2.6N — TRAINING MOBILE ROSTER OWNERSHIP · CLUSTER 5';
const s=polish.indexOf(marker);
const e=polish.indexOf('R2.6M — TRAINING MOBILE FOOTER OWNERSHIP',s);
const owner=s>=0?polish.slice(s,e>s?e:undefined):'';

add('R2.6N Training roster owner exists',s>=0);
add('global responsive no longer owns step2 roster summary width',!responsive.includes('.ts-step[data-ts-step="2"] .ts-roster-summary'));
add('global responsive no longer owns step2 roster grid width',!responsive.includes('.ts-step[data-ts-step="2"] .ts-roster-grid'));
add('global responsive no longer owns present-count geometry',!responsive.includes('.ts-manual-editor .ts-present-count'));
add('global responsive no longer owns roster four-column collapse',!responsive.includes('.ts-manual-editor .ts-roster-grid--four'));
add('global responsive no longer owns Training multiselect touch target',!responsive.includes('.ts-manual-editor .ts-multiselect summary'));
add('Training domain preserves roster full width',owner.includes('width: 100%;')&&owner.includes('max-width: none;'));
add('Training domain preserves roster inline padding',owner.includes('padding-inline: var(--staff-space-3);'));
add('Training domain preserves present count 76px metric cell',owner.includes('minmax(0, 1fr) 76px'));
add('Training domain preserves single-column roster collapse',owner.includes('.ts-roster-grid--four')&&owner.includes('grid-template-columns: 1fr;'));
add('Training domain preserves touch target',owner.includes('min-height: var(--staff-touch-target);'));
add('migrated roster owner adds no important escalation',!owner.includes('!important'));
add('Page Shell remains outside roster owner',!owner.includes('#viewRoot')&&!owner.includes('.product-page-shell'));

let failed=0;
for(const [l,o] of checks){if(o)console.log(`✓ ${l}`);else{console.error(`✗ ${l}`);failed++;}}
console.log(`\nR2.6N Training Mobile Roster Ownership: ${checks.length-failed}/${checks.length}`);
if(failed)process.exit(1);
