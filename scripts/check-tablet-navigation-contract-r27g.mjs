
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const app=read('src/design-system/appShell.css');
const r=read('src/design-system/responsive.css');
const main=read('src/main.js');
const shellView=read('src/app/appShellView.js');
const shellEvents=read('src/app/events/globalShellEvents.js');

const marker='R2.7G — TABLET NAVIGATION SHELL CONTRACT';
const s=r.indexOf(marker);
const e=r.indexOf('M1.3A — MOBILE NAVIGATION DRAWER',s);
const c=s>=0?r.slice(s,e>s?e:undefined):'';
const checks=[];const add=(l,o)=>checks.push([l,Boolean(o)]);

add('R2.7G tablet owner exists',s>=0&&e>s);
add('compact 761-1100 sidebar owner retired',!app.includes('@media (max-width: 1100px) and (min-width: 761px)'));
add('desktop canonical 232px sidebar remains',app.includes('grid-template-columns: 232px minmax(0, 1fr)'));
add('tablet contract bounded exactly 761-1100',c.includes('@media (max-width: 1100px) and (min-width: 761px)'));
add('tablet app shell becomes single-column',c.includes('.app-shell {\n    display: block;'));
add('tablet hides desktop sidebar',c.includes('.sidebar {\n    display: none;'));
add('tablet workspace width is canonical',c.includes('.workspace {\n    width: 100%;')&&c.includes('min-width: 0;'));
add('tablet topbar reserves trigger column',c.includes('grid-template-columns: var(--staff-touch-target) minmax(0, 1fr) auto;'));
add('tablet trigger meets touch target',c.includes('.mobile-menu-trigger {\n    display: grid;')&&c.includes('min-width: var(--staff-touch-target);'));
add('tablet drawer shell is fixed viewport layer',c.includes('.mobile-drawer-shell {\n    position: fixed;')&&c.includes('inset: 0;'));
add('tablet closed drawer is non-interactive',c.includes('visibility: hidden;')&&c.includes('pointer-events: none;'));
add('tablet open drawer is interactive',c.includes('.mobile-drawer-shell.is-open')&&c.includes('pointer-events: auto;'));
add('tablet drawer width is bounded',c.includes('width: min(42vw, 360px);')&&c.includes('max-width: calc(100vw - 44px);'));
add('tablet drawer labels remain visible',c.includes('.mobile-drawer-item__label')&&c.includes('display: block;'));
add('candidate adds no overflow masking',!c.includes('overflow-x'));
add('candidate adds no important escalation',!c.includes('!important'));
add('phone M1.2 contract remains at 760',r.includes('M1.2 — MOBILE SHELL & NAVIGATION CONTRACT')&&r.includes('@media (max-width: 760px)'));
add('phone M1.3A contract remains at 760',r.slice(r.indexOf('M1.3A — MOBILE NAVIGATION DRAWER')).includes('@media (max-width: 760px)'));
add('drawer DOM stays unconditional',shellView.includes('renderMobileNavigation({ identity, team, renderTeamLogo, escapeHtml })')&&shellView.includes('data-mobile-drawer-open'));
add('drawer events stay viewport-independent',!shellEvents.includes('matchMedia')&&!shellEvents.includes('innerWidth')&&!shellEvents.includes('visualViewport'));
add('responsive remains after appShell in load order',main.indexOf('appShell.css')<main.indexOf('responsive.css'));
add('runtime code unchanged by ownership contract',shellEvents.includes('toggleMobileDrawer')&&shellView.includes('mobile-menu-trigger'));

let fail=0;
for(const [l,o] of checks){if(o)console.log(`✓ ${l}`);else{console.error(`✗ ${l}`);fail++;}}
console.log(`\nR2.7G V2 Tablet Navigation Contract: ${checks.length-fail}/${checks.length}`);
if(fail)process.exit(1);
