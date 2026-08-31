
import fs from 'node:fs';

const responsive=fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const editor=fs.readFileSync('src/design-system/training-editor.css','utf8').replace(/\r\n/g,'\n');
const polish=fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');
const view=fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8').replace(/\r\n/g,'\n');

const marker='R2.7C — MATCH DAY SINGLE OWNER · CLUSTER 11';
const r26o='R2.6O — TRAINING MOBILE STEP 3 OWNERSHIP · CLUSTER 6';
const s=polish.indexOf(r26o);
const e=polish.indexOf('R2.6N — TRAINING MOBILE ROSTER OWNERSHIP',s);
const owner=s>=0?polish.slice(s,e>s?e:undefined):'';
const checks=[]; const add=(l,o)=>checks.push([l,Boolean(o)]);

add('R2.7C marker exists',polish.includes(marker));
add('runtime Match Day exists in Training editor view',view.includes('ts-match-day-block')&&view.includes('ts-md-selector'));
add('runtime Match Day is Step 3 content',view.includes('data-ts-step="3"')&&view.includes('data-ts-md-selector'));
add('global responsive Match Day block retired',!responsive.includes('.ts-match-day-block'));
add('global responsive MD selector retired',!responsive.includes('.ts-md-selector'));
add('legacy max760 four-column important override retired',!editor.includes('repeat(4, minmax(0, 1fr)) !important'));
add('legacy max900 horizontal MD override retired',!editor.includes('repeat(9,minmax(82px,1fr))!important'));
add('R2.6O owner still exists',s>=0);
add('domain owner preserves Match Day full width',owner.includes('.ts-match-day-block')&&owner.includes('width: 100%;')&&owner.includes('max-width: none;'));
add('domain owner preserves Match Day 14px mobile block padding',owner.includes('padding-block: 14px;'));
add('domain owner preserves MD display grid',owner.includes('.ts-manual-editor .ts-md-selector')&&owner.includes('display: grid;'));
add('domain owner preserves MD three columns',owner.includes('grid-template-columns: repeat(3, minmax(0, 1fr));'));
add('domain owner preserves MD 7px gap',owner.includes('gap: 7px;'));
add('domain owner preserves MD visible overflow',owner.includes('overflow: visible;'));
add('domain owner preserves MD full width',owner.includes('width: 100%;'));
add('domain owner preserves MD touch target',owner.includes('min-height: var(--staff-touch-target);'));
add('domain owner preserves MD button full width',owner.includes('.ts-manual-editor .ts-md-selector button')&&owner.includes('width: 100%;'));
add('domain owner preserves MD button compact inline padding',owner.includes('padding-inline: 5px;'));
add('domain owner preserves MD button mobile font size',owner.includes('font-size: .66rem;'));
add('domain owner adds no important escalation',!owner.includes('!important'));
add('legacy editor base desktop Match Day contract remains',editor.includes('.ts-md-selector')&&editor.includes('.ts-match-day-block'));
add('responsive final layer remains free of Training Match Day ownership',!responsive.includes('TRAINING: Match Day wraps'));

let fail=0;
for(const [l,o] of checks){if(o)console.log(`✓ ${l}`);else{console.error(`✗ ${l}`);fail++;}}
console.log(`\nR2.7C Match Day Single Owner: ${checks.length-fail}/${checks.length}`);
if(fail)process.exit(1);
