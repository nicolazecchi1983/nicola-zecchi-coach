import fs from 'node:fs';

const responsive = fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const polish = fs.readFileSync('src/modules/training/trainingPolish.css','utf8').replace(/\r\n/g,'\n');

const checks=[];
const add=(label,ok)=>checks.push([label,Boolean(ok)]);
const marker='R2.6M — TRAINING MOBILE FOOTER OWNERSHIP · CLUSTER 4';
const s=polish.indexOf(marker);
const e=polish.indexOf('R2.6L — TRAINING MOBILE PHASE OWNERSHIP',s);
const owner=s>=0?polish.slice(s,e>s?e:undefined):'';

add('R2.6M Training footer owner exists', s>=0);
add('global responsive no longer owns footer bottom geometry', !responsive.includes('.ts-manual-editor .ts-step-footer {\n    bottom: var(--staff-space-1);'));
add('global responsive no longer hides footer status', !responsive.includes('.ts-manual-editor .ts-step-footer > span {\n    display: none;'));
add('Training domain owns footer two-column mobile grid', owner.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'));
add('Training domain preserves footer margin and padding', owner.includes('margin-top: var(--staff-space-3);') && owner.includes('padding: var(--staff-space-2);'));
add('Training domain preserves footer radius', owner.includes('border-radius: var(--staff-radius-medium);'));
add('Training domain hides compact status text', owner.includes('.ts-step-footer > span') && owner.includes('display: none;'));
add('Training domain preserves touch target', owner.includes('.ts-step-footer button') && owner.includes('min-height: var(--staff-touch-target);'));
add('migrated footer owner adds no important escalation', !owner.includes('!important'));
add('Page Shell remains outside footer owner', !owner.includes('#viewRoot') && !owner.includes('.product-page-shell'));

let failed=0;
for(const [label,ok] of checks){
 if(ok) console.log(`✓ ${label}`);
 else { console.error(`✗ ${label}`); failed++; }
}
console.log(`\nR2.6M Training Mobile Footer Ownership: ${checks.length-failed}/${checks.length}`);
if(failed) process.exit(1);
