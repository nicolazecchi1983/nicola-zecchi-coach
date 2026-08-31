
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const r=read('src/design-system/responsive.css');
const view=read('src/app/appShellView.js');
const nav=read('src/app/appNavigation.js');
const events=read('src/app/events/globalShellEvents.js');
const app=read('src/design-system/appShell.css');
const main=read('src/main.js');

const sharedM='R2.7J — SHARED DRAWER COMPONENT OWNER';
const actM='R2.7J — DRAWER NAVIGATION MODE ACTIVATION';
const tabM='R2.7G — TABLET NAVIGATION SHELL CONTRACT';
const phoneM='M1.3A — MOBILE NAVIGATION DRAWER';
const hide=`.mobile-drawer-shell,
.mobile-menu-trigger {
  display: none;
}`;

const s=r.indexOf(sharedM),h=r.indexOf(hide,s),a=r.indexOf(actM,s);
const am=r.indexOf('@media (max-width: 1100px)',a);
const tm=r.indexOf(tabM,am),t=r.indexOf('@media (max-width: 1100px) and (min-width: 761px)',tm);
const pm=r.indexOf(phoneM,t),p=r.indexOf('@media (max-width: 760px)',pm);
const shared=s>=0&&a>s?r.slice(s,a):'';
const activation=a>=0&&tm>a?r.slice(a,tm):'';
const tablet=t>=0&&pm>t?r.slice(t,pm):'';
const phone=p>=0?r.slice(p):'';

const C=[];const add=(l,o)=>C.push([l,Boolean(o)]);
add('shared owner once',(r.match(/R2\.7J — SHARED DRAWER COMPONENT OWNER/g)||[]).length===1);
add('activation owner once',(r.match(/R2\.7J — DRAWER NAVIGATION MODE ACTIVATION/g)||[]).length===1);
add('canonical order shared-hide-activation-tablet-phone',s>=0&&s<h&&h<a&&a<am&&am<t&&t<p);
add('default hidden baseline once',(r.split(hide).length-1)===1);
add('desktop compact sidebar remains retired',!app.includes('@media (max-width: 1100px) and (min-width: 761px)'));
add('desktop 232px sidebar remains',app.includes('grid-template-columns: 232px minmax(0, 1fr)'));

add('activation bounded exactly max1100',activation.includes('@media (max-width: 1100px)'));
add('activation shows trigger',activation.includes('.mobile-menu-trigger')&&activation.includes('display: grid;'));
add('activation shows drawer shell',activation.includes('.mobile-drawer-shell')&&activation.includes('display: block;'));
add('scroll lock bounded to activation',activation.includes('html.mobile-drawer-open')&&activation.includes('overflow: hidden;'));
add('scroll lock is not global shared state',!shared.includes('html.mobile-drawer-open'));
add('tablet no longer duplicates drawer activation',!tablet.includes('.mobile-menu-trigger')&&!tablet.includes('.mobile-drawer-shell'));
add('phone no longer duplicates drawer activation',!phone.includes('.mobile-menu-trigger')&&!phone.includes('.mobile-drawer-shell'));

add('tablet app shell becomes single-column',tablet.includes('.app-shell {\n    display: block;'));
add('tablet hides desktop sidebar',tablet.includes('.sidebar {\n    display: none;'));
add('tablet workspace width canonical',tablet.includes('.workspace {\n    width: 100%;')&&tablet.includes('min-width: 0;'));
add('tablet topbar reserves trigger column',tablet.includes('grid-template-columns: var(--staff-touch-target) minmax(0, 1fr) auto;'));

add('shared trigger owns touch geometry',shared.includes('.mobile-menu-trigger')&&shared.includes('var(--staff-touch-target)'));
add('shared trigger owns visuals',shared.includes('.mobile-menu-trigger:hover')&&shared.includes('.mobile-menu-trigger svg'));
add('shared shell owns overlay geometry',shared.includes('.mobile-drawer-shell')&&shared.includes('position: fixed')&&shared.includes('visibility: hidden'));
add('shared open shell owns interactivity',shared.includes('.mobile-drawer-shell.is-open')&&shared.includes('pointer-events: auto'));
add('shared safe-area contract complete',shared.includes('var(--staff-safe-top)')&&shared.includes('var(--staff-safe-bottom)'));
add('shared backdrop and vertical overflow complete',shared.includes('.mobile-drawer-backdrop')&&shared.includes('overflow-y: auto'));
add('shared backdrop transition complete',shared.includes('opacity: 0')&&shared.includes('transition: opacity')&&shared.includes('.mobile-drawer-shell.is-open .mobile-drawer-backdrop')&&shared.includes('opacity: 1'));
add('shared drawer uses canonical width',shared.includes('--staff-mobile-drawer-width: min(86vw, 360px)')&&shared.includes('width: var(--staff-mobile-drawer-width)'));
add('tablet 42vw retired',!r.includes('min(42vw, 360px)'));
add('shared drawer visual shell complete',shared.includes('background: #05080c')&&shared.includes('box-shadow: 24px 0 60px')&&shared.includes('transform: translateX(-102%)'));
add('shared head-brand-close complete',shared.includes('.mobile-drawer-head')&&shared.includes('.mobile-drawer-brand')&&shared.includes('.mobile-drawer-close'));
add('shared nav-group-item complete',shared.includes('.mobile-drawer-nav')&&shared.includes('.mobile-drawer-group')&&shared.includes('.mobile-drawer-item.nav-item'));
add('shared profile complete',shared.includes('.mobile-drawer-profile')&&shared.includes('.mobile-drawer-profile__settings'));
add('shared drawer labels explicit',shared.includes('.mobile-drawer-item__label')&&shared.includes('display: block'));

add('trigger markup unconditional in shell view',view.includes('class="mobile-menu-trigger"')&&view.includes('data-mobile-drawer-open'));
add('drawer markup unconditional in app navigation',nav.includes('class="mobile-drawer-shell"')&&nav.includes('data-mobile-drawer-shell')&&nav.includes('class="mobile-drawer-head"'));
add('runtime viewport independent',!events.includes('matchMedia')&&!events.includes('innerWidth')&&!events.includes('visualViewport'));
add('no overflow-x masking introduced',!shared.includes('overflow-x')&&!activation.includes('overflow-x')&&!tablet.includes('overflow-x'));
add('no important escalation',!shared.includes('!important')&&!activation.includes('!important')&&!tablet.includes('!important'));
add('responsive remains final shell layer',main.indexOf("import './design-system/responsive.css'")>main.indexOf("import './design-system/appShell.css'"));

let f=0;for(const [l,o] of C){if(o)console.log(`✓ ${l}`);else{console.error(`✗ ${l}`);f++;}}
console.log(`\nR2.7J-P6 V3 Shared Drawer Contract: ${C.length-f}/${C.length}`);
if(f)process.exit(1);
