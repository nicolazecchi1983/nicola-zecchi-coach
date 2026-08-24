import fs from 'node:fs'

const css = fs.readFileSync('src/modules/match/ui/matchSquad.css','utf8')
const responsive = fs.readFileSync('src/design-system/responsive.css','utf8')

function mediaBlocks(width){
  const marker = `@media (max-width: ${width}px) {`
  let from = 0
  const out = []
  while(true){
    const start = css.indexOf(marker, from)
    if(start < 0) break
    let depth = 0
    let bodyStart = -1
    let done = false
    for(let i=start; i<css.length; i++){
      if(css[i] === '{'){
        depth += 1
        if(bodyStart < 0) bodyStart = i + 1
      } else if(css[i] === '}'){
        depth -= 1
        if(depth === 0){
          out.push(css.slice(bodyStart, i))
          from = i + 1
          done = true
          break
        }
      }
    }
    if(!done) break
  }
  return out
}

function selectorBodies(blocks, selector){
  const out = []
  for(const block of blocks){
    let from = 0
    const marker = `${selector} {`
    while(true){
      const start = block.indexOf(marker, from)
      if(start < 0) break
      const brace = block.indexOf('{', start)
      let depth = 1
      let i = brace + 1
      for(; i<block.length && depth; i++){
        if(block[i] === '{') depth += 1
        else if(block[i] === '}') depth -= 1
      }
      out.push(block.slice(brace + 1, i - 1))
      from = i
    }
  }
  return out
}

const selector = '.match-squad-step .match-lineup-layout--master'
const b1180 = selectorBodies(mediaBlocks(1180), selector)
const b980 = selectorBodies(mediaBlocks(980), selector)
const b1040 = selectorBodies(mediaBlocks(1040), selector)
const b760 = selectorBodies(mediaBlocks(760), selector)

const columnOwners = [
  ['1180', b1180],
  ['980', b980],
  ['1040', b1040],
  ['760', b760],
].filter(([, bodies]) => bodies.some((body) => body.includes('grid-template-columns')))
 .map(([width]) => width)

const checks = [
  ['desktop equal-column refinement remains', css.includes('.match-squad-step .squad-command-leadership,\n.match-squad-step .match-lineup-layout--master {\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n}')],
  ['1040 is sole responsive column owner', columnOwners.length === 1 && columnOwners[0] === '1040'],
  ['1040 has one master owner', b1040.length === 1],
  ['1040 stacks operational core', b1040[0]?.includes('grid-template-columns: 1fr;')],
  ['1040 preserves 720px cap', b1040[0]?.includes('max-width: 720px;')],
  ['1180 has zero master owner', b1180.length === 0],
  ['980 has zero master owner', b980.length === 0],
  ['760 has one geometry-only master owner', b760.length === 1],
  ['760 master has no column declaration', !b760[0]?.includes('grid-template-columns')],
  ['760 preserves full width', b760[0]?.includes('width: 100%;') && b760[0]?.includes('max-width: none;')],
  ['760 preserves 12px gap', b760[0]?.includes('gap: 12px;')],
  ['global responsive has zero master owner', !responsive.includes('.match-squad-step .match-lineup-layout--master')],
  ['1180 command adaptation remains', mediaBlocks(1180).join('\n').includes('.match-squad-step .squad-command-primary')],
  ['980 bench adaptation remains', mediaBlocks(980).join('\n').includes('.match-squad-step .bench-grid--slots')],
  ['no important escalation', !css.includes('!important')],
]

let passed = 0
for(const [label, ok] of checks){
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if(ok) passed += 1
}
console.log(`R3.5A2 Match Squad Operational Core Breakpoint Owner: ${passed}/${checks.length}`)
if(passed !== checks.length) process.exit(1)
