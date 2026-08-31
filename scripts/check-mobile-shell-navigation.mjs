
import fs from 'node:fs';

const main = fs.readFileSync('src/main.js','utf8').replace(/\r\n/g,'\n');
const nav = fs.readFileSync('src/app/appNavigation.js','utf8').replace(/\r\n/g,'\n');
const shell = fs.readFileSync('src/app/appShellView.js','utf8').replace(/\r\n/g,'\n');
const globalShellEvents = fs.readFileSync('src/app/events/globalShellEvents.js','utf8').replace(/\r\n/g,'\n');
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8').replace(/\r\n/g,'\n');
const contract = fs.readFileSync('docs/STAFF_MOBILE_RESPONSIVE_CONTRACT.md','utf8').replace(/\r\n/g,'\n');

const sharedMarker='R2.7J — SHARED DRAWER COMPONENT OWNER';
const activationMarker='R2.7J — DRAWER NAVIGATION MODE ACTIVATION';
const tabletMarker='R2.7G — TABLET NAVIGATION SHELL CONTRACT';
const phoneMarker='M1.3A — MOBILE NAVIGATION DRAWER';

const sharedStart=responsive.indexOf(sharedMarker);
const activationStart=responsive.indexOf(activationMarker, sharedStart);
const tabletStart=responsive.indexOf(tabletMarker, activationStart);
const phoneStart=responsive.indexOf(phoneMarker, tabletStart);

if(sharedStart<0||activationStart<0||tabletStart<0||phoneStart<0) {
  console.error('✗ R2.7J drawer ownership markers missing');
  process.exit(1);
}

const sharedDrawer=responsive.slice(sharedStart,activationStart);
const activation=responsive.slice(activationStart,tabletStart);
const phone=responsive.slice(phoneStart);

const checks = [
  ['Responsive layer is loaded last', main.trim().split('\n').filter(line => line.startsWith("import './")).at(-1)?.includes('responsive.css')],
  ['Dedicated mobile navigation renderer exists', nav.includes('export function renderMobileNavigation(')],
  ['Mobile shell renders drawer with identity context', shell.includes('renderMobileNavigation({ identity, team, renderTeamLogo, escapeHtml })')],
  ['Global mobile hamburger exists', shell.includes('data-mobile-drawer-open')],
  ['Desktop sidebar is hidden on mobile', responsive.includes('.sidebar {\n    display: none;')],
  ['Bottom navigation retired', phone.includes('.mobile-navigation') && phone.includes('display: none;')],
  ['Drawer has full text labels', nav.includes('mobile-drawer-item__label') && nav.includes('Training Library') && nav.includes('Rosa') && nav.includes('Impostazioni') && !nav.includes("['methodology', 'Metodologia'") && !nav.includes("['board', 'Board'")],
  ['Drawer is grouped by product meaning', ['Principale','Training','Match','Squadra','Sistema'].every(label => nav.includes(`label: '${label}'`))],
  ['Drawer respects safe area', sharedDrawer.includes('var(--staff-safe-top)') && sharedDrawer.includes('var(--staff-safe-bottom)')],
  ['Drawer has backdrop and vertical overflow', sharedDrawer.includes('.mobile-drawer-backdrop') && sharedDrawer.includes('overflow-y: auto')],
  ['Drawer activation is bounded to phone + tablet', activation.includes('@media (max-width: 1100px)') && activation.includes('.mobile-menu-trigger') && activation.includes('.mobile-drawer-shell')],
  ['Drawer controller has open/close/toggle', globalShellEvents.includes('openMobileDrawer') && globalShellEvents.includes('closeMobileDrawer') && globalShellEvents.includes('toggleMobileDrawer')],
  ['Navigation closes drawer after route change', globalShellEvents.includes('closeMobileDrawer()')],
  ['Escape closes drawer', globalShellEvents.includes("event.key === 'Escape'") && globalShellEvents.includes('closeMobileDrawer()')],
  ['Contract documents desktop sidebar + mobile drawer', contract.includes('mobile uses a left navigation drawer')],
  ['Shell navigation does not alter domain persistence', !nav.includes('supabase') && !shell.includes('supabase')],
];

let passed=0;
for(const [label,ok] of checks){
  if(ok){console.log(`✓ ${label}`);passed++;}
  else console.error(`✗ ${label}`);
}
console.log(`\nR2.7J Mobile + Tablet Drawer Navigation: ${passed}/${checks.length}`);
if(passed!==checks.length)process.exit(1);
