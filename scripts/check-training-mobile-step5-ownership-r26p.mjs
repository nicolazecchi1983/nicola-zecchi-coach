import fs from 'node:fs';
const responsive=fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const polish=fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');
const page=fs.readFileSync('src/modules/training/ui/trainingSheetEditorPageView.js','utf8').replace(/\r\n/g,'\n');
const runtime=fs.readFileSync('src/modules/training/events/trainingEditorEvents.js','utf8').replace(/\r\n/g,'\n');
const base=fs.readFileSync('src/design-system/training-editor.css','utf8').replace(/\r\n/g,'\n');
const checks=[];const add=(l,o)=>checks.push([l,Boolean(o)]);
// Encoding-agnostic owner boundaries.
// Use plain ASCII ticket ids so nested template escaping cannot corrupt the gate.
const s=polish.indexOf('R2.6P');
const e=polish.indexOf('R2.6O',s>=0?s+5:0);
const owner=s>=0?polish.slice(s,e>s?e:undefined):'';

add('R2.6P Step 5 owner exists',s>=0);
add('global responsive no longer owns Step 5 pillars',!responsive.includes('.ts-step[data-ts-step="5"] .ts-pillars'));
add('global responsive no longer owns Step 5 analysis fields',!responsive.includes('.ts-step[data-ts-step="5"] .ts-analysis-fields'));
add('global responsive no longer owns pillars collapse',!responsive.includes('.ts-manual-editor .ts-pillars'));
add('global responsive no longer owns pillar touch target',!responsive.includes('.ts-manual-editor .ts-pillar span'));
add('retired AI selectors stay absent from global responsive',!responsive.includes('.ts-ai-button')&&!responsive.includes('.ts-ai-note'));
add('retired AI selectors stay absent from base Training owner',!base.includes('.ts-ai-button')&&!base.includes('.ts-ai-note'));
add('Training domain preserves Step 5 full width',owner.includes('width: 100%;')&&owner.includes('max-width: none;'));
add('Training domain preserves Step 5 inline padding',owner.includes('padding-inline: var(--staff-space-3);'));
add('Training domain preserves manual fields one-column collapse',owner.includes('.ts-analysis-fields')&&owner.includes('grid-template-columns: 1fr;'));
add('Training domain keeps pillars compact at two mobile columns',owner.includes('.ts-pillars')&&owner.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'));
add('Training domain preserves pillar touch target',owner.includes('.ts-pillar span')&&owner.includes('min-height: var(--staff-touch-target);'));
add('Training domain contains no AI button owner',!owner.includes('.ts-ai-button'));
add('Training domain contains no AI note owner',!owner.includes('.ts-ai-note'));
add('Step 05 navigation is concise',page.includes("'Fasi allenamento','Obiettivo','Riepilogo'")&&!page.includes("'Fasi allenamento','Obiettivo e principi','Riepilogo'"));
add('Step 05 keeps canonical pillar values with concise labels',page.includes("['create','Creare il vantaggio','Creare'")&&page.includes("['keep','Conservare il vantaggio','Conservare'")&&page.includes("['exploit','Sfruttare il vantaggio','Sfruttare'")&&page.includes("['defend','Difendere il vantaggio','Difendere'"));
add('Step 05 keeps canonical manual fields',page.includes('name="objective"')&&page.includes('name="principles"'));
add('pseudo-AI action is retired',!page.includes('data-analyze-exercises')&&!runtime.includes('data-analyze-exercises'));
add('pseudo-AI fallbacks are retired',!runtime.includes('sviluppare i comportamenti collettivi previsti dalla seduta')&&!runtime.includes('Distanze funzionali, comunicazione'));
add('Step 05 owner adds no important escalation',!owner.includes('!important'));
add('Page Shell remains outside Step 5 owner',!owner.includes('#viewRoot')&&!owner.includes('.product-page-shell'));

let failed=0;
for(const [l,o] of checks){if(o)console.log(`✓ ${l}`);else{console.error(`✗ ${l}`);failed++;}}
console.log(`\nR2.6P / Training Step 05 Simplification: ${checks.length-failed}/${checks.length}`);
if(failed)process.exit(1);
