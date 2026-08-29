import fs from 'node:fs'
const tokenCss=fs.readFileSync('src/modules/match/ui/matchTokenDisplayControl.css','utf8')
const squadCss=fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const view=fs.readFileSync('src/modules/match/ui/matchSquadView.js','utf8')
const controls=fs.readFileSync('src/design-system/controls.css','utf8')
const responsive=fs.readFileSync('src/design-system/responsive.css','utf8')
const obsolete=`  .match-squad-step .pitch-panel-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .match-squad-step .formation-reset-button--field {
    align-self: flex-start;
  }

`
const c=[
['toggle symmetric',/grid-template-columns:\s*14px minmax\(0,\s*1fr\) 14px/.test(tokenCss)],
['label center slot',/\.match-token-toggle > span\s*\{[\s\S]*?grid-column:\s*2[\s\S]*?text-align:\s*center/.test(tokenCss)],
['balancing slot',/\.match-token-toggle::after\s*\{[\s\S]*?grid-column:\s*3/.test(tokenCss)],
['check not overlay',!/:has\(input:checked\)::before\s*\{[\s\S]*?position:\s*absolute/.test(tokenCss)],
['mobile 3 equal options',/repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(tokenCss)],
['mobile symmetric toggle',/12px minmax\(0,\s*1fr\) 12px/.test(tokenCss)],
['shared local action anatomy',(view.match(/match-squad-field-action/g)||[]).length>=4],
['SVG icons',/match-squad-field-action__icon/.test(view)&&/<svg viewBox="0 0 24 24"/.test(view)],
['desktop 36px',/\.match-squad-field-action\s*\{[\s\S]*?height:\s*36px/.test(squadCss)],
['desktop 2-action grid is card-bounded',/\.pitch-panel-actions\s*\{[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)[\s\S]*?width:\s*100%/.test(squadCss)],
['mobile equal 2-action grid',/@media \(max-width:\s*760px\)[\s\S]*?\.pitch-panel-actions\s*\{[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(squadCss)],
['mobile 44px',/@media \(max-width:\s*760px\)[\s\S]*?\.match-squad-field-action\s*\{[\s\S]*?height:\s*44px/.test(squadCss)],
['desktop pitch title and actions use separate rows',squadCss.lastIndexOf('grid-template-rows: auto auto;')>squadCss.lastIndexOf('grid-template-rows: 1fr;')],
['R3.4C stack preserved',/@media \(max-width:\s*760px\)[\s\S]*?\.pitch-panel-head\s*\{[\s\S]*?flex-direction:\s*column/.test(squadCss)],
['obsolete 520 owner removed',!squadCss.includes(obsolete)],
['global button untouched',/\.staff-button,[\s\S]*?justify-content:\s*center/.test(controls)],
['responsive global untouched',!/match-squad-field-action/.test(responsive)],
['no important',!tokenCss.includes('!important')&&!squadCss.includes('!important')],
]
let p=0;for(const [l,o] of c){console.log(`${o?'PASS':'FAIL'}  ${l}`);if(o)p++}
console.log(`R3.4F Match Squad Control Anatomy: ${p}/${c.length}`);if(p!==c.length)process.exit(1)
