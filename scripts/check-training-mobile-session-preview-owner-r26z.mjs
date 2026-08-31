import fs from 'node:fs';

const responsive=fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const polish=fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');
const pass23=fs.readFileSync('scripts/check-design-system-legacy-cleanup-pass23.mjs','utf8').replace(/\r\n/g,'\n');
const marker='R2.6Z — TRAINING MOBILE SESSION + PREVIEW OWNERSHIP · CLUSTER 10';
const s=polish.indexOf(marker);
const e=polish.indexOf('R2.6W — TRAINING MOBILE PHASE SINGLE OWNER · CLUSTER 9',s);
const owner=s>=0?polish.slice(s,e>s?e:undefined):'';
const checks=[];const add=(label,ok)=>checks.push([label,Boolean(ok)]);

add('R2.6Z owner exists before R2.6W',s>=0&&e>s);
add('domain owns mobile session full width',owner.includes('.ts-manual-editor .ts-session-grid')&&owner.includes('width: 100%;')&&owner.includes('max-width: none;'));
add('domain preserves session one-column collapse',owner.includes('grid-template-columns: 1fr;'));
add('domain preserves session inline padding',owner.includes('padding-inline: var(--staff-space-3);'));
add('domain owns preview stage mobile width',owner.includes('.ts-manual-editor .ts-preview-stage')&&owner.includes('width: 100%;'));
add('domain owns summary head mobile width',owner.includes('.ts-manual-editor .ts-summary-head')&&owner.includes('width: 100%;'));
add('global responsive no longer owns session grid',!responsive.includes('.ts-manual-editor .ts-session-grid'));
add('global responsive no longer owns preview stage',!responsive.includes('.ts-manual-editor .ts-preview-stage'));
add('global responsive no longer owns summary head',!responsive.includes('.ts-manual-editor .ts-summary-head'));
add('retired DS2.3 Training mobile marker is gone',!responsive.includes('DS2.3 — TRAINING POLISH MOBILE ADAPTATION'));
add('owner introduces no important escalation',!owner.includes('!important'));
add('owner does not absorb Match Day',!owner.includes('.ts-match-day-block')&&!owner.includes('.ts-md-selector'));
add('owner does not absorb phase geometry',!owner.includes('.ts-phase-editor')&&!owner.includes('.ts-phases-editor'));
add('global legacy Match Day owner is retired',!responsive.includes('.ts-match-day-block')&&!responsive.includes('.ts-md-selector'));
add('Match Day ownership moved forward to R2.7C domain owner',polish.includes('R2.7C — MATCH DAY SINGLE OWNER · CLUSTER 11'));
add('R2.6W phase marker remains after Cluster 10',polish.indexOf('R2.6W — TRAINING MOBILE PHASE SINGLE OWNER · CLUSTER 9')>s);
add('Pass23 no longer requires Training selectors in responsive',!pass23.includes("responsive.includes('.ts-manual-editor') || responsive.includes('.ts-editor-actions')"));
add('Pass23 now verifies real final responsive load order',pass23.includes('responsive remains final adaptive layer')&&pass23.includes('trainingCommandBar.css')&&pass23.includes('responsive.css'));

let failed=0;
for(const [label,ok] of checks){if(ok)console.log(`✓ ${label}`);else{console.error(`✗ ${label}`);failed++;}}
console.log(`\nR2.6Z V2 Training Session + Preview Single Owner: ${checks.length-failed}/${checks.length}`);
if(failed)process.exit(1);
