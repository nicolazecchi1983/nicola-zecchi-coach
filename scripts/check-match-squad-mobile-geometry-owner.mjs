import fs from 'node:fs'

const squadCss = fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')
const marker = 'R3.5A1 — canonical mobile geometry owner.'
const start = squadCss.indexOf(marker)
const next = squadCss.indexOf('/* 0.29.61', start)
const slice = start >= 0 ? squadCss.slice(start, next > start ? next : undefined) : ''

const checks = [
  ['owner marker exists', start >= 0],
  ['global responsive has zero master owners', (responsive.match(/\.match-squad-step \.match-lineup-layout--master\s*\{/g)||[]).length===0],
  ['global responsive has zero pitch panel owners', (responsive.match(/\.match-squad-step \.pitch-panel\s*\{/g)||[]).length===0],
  ['global responsive has zero pitch element owners', (responsive.match(/\.match-squad-step \.pitch-panel \[data-football-pitch\]\s*\{/g)||[]).length===0],
  ['master width preserved', /match-lineup-layout--master\s*\{[\s\S]*?width:\s*100%[\s\S]*?max-width:\s*none/.test(slice)],
  ['master min-width preserved', /match-lineup-layout--master\s*\{[\s\S]*?min-width:\s*0/.test(slice)],
  ['master mobile gap preserved', /match-lineup-layout--master\s*\{[\s\S]*?gap:\s*12px/.test(slice)],
  ['master border-box preserved', /match-lineup-layout--master\s*\{[\s\S]*?box-sizing:\s*border-box/.test(slice)],
  ['pitch panel width preserved', /\.pitch-panel\s*\{[\s\S]*?width:\s*100%/.test(slice)],
  ['pitch panel effective padding preserved', /\.pitch-panel\s*\{[\s\S]*?padding:\s*5px/.test(slice)],
  ['pitch panel effective radius preserved', /\.pitch-panel\s*\{[\s\S]*?border-radius:\s*13px/.test(slice)],
  ['pitch element width preserved', /\[data-football-pitch\]\s*\{[\s\S]*?width:\s*100%[\s\S]*?max-width:\s*none/.test(slice)],
  ['pitch element margin preserved', /\[data-football-pitch\]\s*\{[\s\S]*?margin:\s*0/.test(slice)],
  ['pitch element border-box preserved', /\[data-football-pitch\]\s*\{[\s\S]*?box-sizing:\s*border-box/.test(slice)],
  ['R3.4F actions remain local', slice.includes('.match-squad-step .pitch-panel-actions')],
  ['global responsive no longer owns Match shell bleed', !responsive.includes('--match-mobile-content-bleed') && !responsive.includes('.match-native-legacy-host--our-team,')],
  ['Match Squad has no important escalation', !squadCss.includes('!important')],
]
let passed=0
for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'}  ${label}`);if(ok)passed++}
console.log(`R3.5A1 Match Squad Mobile Geometry Owner: ${passed}/${checks.length}`)
if(passed!==checks.length)process.exit(1)
