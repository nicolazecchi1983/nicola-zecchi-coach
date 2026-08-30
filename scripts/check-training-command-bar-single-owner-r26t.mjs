
import fs from 'node:fs';
const responsive=fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const owner=fs.readFileSync('src/modules/training/trainingCommandBar.css','utf8').replace(/\r\n/g,'\n');
const checks=[];const add=(l,o)=>checks.push([l,Boolean(o)]);
const marker='R2.6T — TRAINING COMMAND BAR SINGLE OWNER · CLUSTER 8';
const start=owner.indexOf(marker);
const mobile=start>=0?owner.slice(start):'';
add('R2.6T single-owner marker exists',start>=0);
add('global responsive command marker retired',!responsive.includes('TRAINING COMMAND BAR · CANONICAL MOBILE OWNER'));
add('global responsive no editor-actions wrapper owner',!responsive.includes('.ts-manual-editor .ts-editor-actions-wrap'));
add('global responsive no command-actions owner',!responsive.includes('.ts-manual-editor .ts-command-actions'));
add('global responsive no open-sheet owner',!responsive.includes('.ts-manual-editor .ts-open-sheet'));
add('command owner owns mobile elastic grid',mobile.includes('grid-template-columns: minmax(0, 1fr) auto'));
add('command owner preserves 44px + 24px row geometry',mobile.includes('grid-template-rows: 44px 24px'));
add('command owner preserves mobile 6px gap',mobile.includes('column-gap: 6px'));
add('command owner preserves compact 5px gap',mobile.includes('@media (max-width: 390px)')&&mobile.includes('column-gap: 5px'));
add('command owner preserves icon-only mobile open action',mobile.includes('.ts-open-button-label { display: none; }')&&mobile.includes('.ts-open-button-icon'));
add('command owner preserves 44px Open action',mobile.includes('max-width: 44px')&&mobile.includes('height: 44px'));
add('command owner preserves More 44px geometry',mobile.includes('.ts-more-menu,')&&mobile.includes('.ts-more-button'));
add('command owner preserves draft second row',mobile.includes('.ts-draft-state--compact')&&mobile.includes('grid-row: 2;')&&mobile.includes('transform: none;'));
add('command owner adds no important escalation',!owner.includes('!important'));
add('command owner does not absorb phase geometry',!mobile.includes('.ts-phase-editor')&&!mobile.includes('.ts-session-grid'));
add('responsive global remains free of command-bar ownership',!responsive.includes('ts-command-actions')&&!responsive.includes('ts-open-button'));
let failed=0;for(const [l,o] of checks){if(o)console.log(`✓ ${l}`);else{console.error(`✗ ${l}`);failed++;}}
console.log(`\nR2.6T V2 Training Command Bar Single Owner: ${checks.length-failed}/${checks.length}`);
if(failed)process.exit(1);
