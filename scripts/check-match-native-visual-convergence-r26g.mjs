import fs from "node:fs";

const squad = fs.readFileSync("src/modules/match/ui/matchSquad.css", "utf8").replace(/\r\n/g,"\n");
const opponent = fs.readFileSync("src/modules/match/ui/matchOpponent.css", "utf8").replace(/\r\n/g,"\n");
const view = fs.readFileSync("src/modules/match/ui/matchSquadView.js", "utf8").replace(/\r\n/g,"\n");
const checks = [
  ["R2.6G squad marker exists", squad.includes("R2.6G — Match visual convergence")],
  ["R2.6G opponent marker exists", opponent.includes("R2.6G — Match visual convergence")],
  ["captain and vice use equal 128px role bands", squad.includes("grid-template-columns: 128px minmax(0, 1fr);") && squad.includes("width: 128px;") && squad.includes("min-width: 128px;")],
  ["vice copy is concise", view.includes('class="leadership-role-label">Vice</span>') && !view.includes('class="leadership-role-label">Vicecapitano</span>')],
  ["opponent command uses canonical raised grammar", opponent.includes("var(--staff-color-bg-panel-raised)") && opponent.includes("var(--staff-shadow-panel)")],
  ["opponent working surfaces use canonical panel grammar", opponent.includes(".opponent-field-panel,\n.match-opponent-step .opponent-sheet-panel") && opponent.includes("background: var(--staff-color-bg-panel);")],
  ["opponent support surface is quiet", opponent.includes(".opponent-reading-surface") && opponent.includes("color-mix(in srgb, var(--staff-color-bg-panel) 86%, transparent)")],
  ["native Match surfaces converge on 18px radius", (opponent.match(/border-radius: 18px;/g)||[]).length >= 3 && squad.includes("border-radius: 18px;")],
  ["opponent headers use canonical border token", opponent.includes("border-bottom: 1px solid var(--staff-color-border-subtle);")],
  ["opponent visible headings use canonical text token", opponent.includes("font-size: 1rem; color: var(--staff-color-text);")],
  ["no important escalation in native owners", !squad.includes("!important") && !opponent.includes("!important")],
];
let pass=0;
for (const [label,ok] of checks) { console.log(`${ok?"PASS":"FAIL"}  ${label}`); if(ok) pass++; }
console.log(`R2.6G Match Native Visual Convergence: ${pass}/${checks.length}`);
if(pass!==checks.length) process.exit(1);
