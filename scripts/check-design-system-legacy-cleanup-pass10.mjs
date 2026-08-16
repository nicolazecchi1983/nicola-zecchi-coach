import fs from 'node:fs'

const read = p => fs.readFileSync(p, 'utf8')
const legacy = read('src/style.css')
const staff = read('src/modules/staff/staffManagement.css')
const controls = read('src/design-system/controls.css')
const main = read('src/main.js')

const checks = [
  ['staff owner exists', staff.length > 2500],
  ['staff owner imported', main.includes("./modules/staff/staffManagement.css")],
  ['staff card owned by staff module', staff.includes('.staff-member-card')],
  ['staff create flow owned by staff module', staff.includes('.staff-create-card') && staff.includes('.staff-create-actions')],
  ['staff access badges owned by staff module', staff.includes('.staff-access-badge--owner')],
  ['danger button canonicalized in controls', controls.includes('.danger-button') && controls.includes('var(--staff-color-danger-soft)')],
  ['legacy no staff member card owner', !legacy.includes('.staff-member-card {') && !legacy.includes('.staff-member-card{')],
  ['legacy no staff create owner', !legacy.includes('.staff-create-card{') && !legacy.includes('.staff-create-card {')],
  ['legacy no staff badge owner', !legacy.includes('.staff-access-badge{') && !legacy.includes('.staff-access-badge {')],
  ['legacy no danger button owner', !legacy.includes('.danger-button{') && !legacy.includes('.danger-button {')],
  ['staff hidden state has no important', staff.includes('.staff-create-card[hidden] { display: none; }') && !staff.includes('!important')],
  ['legacy remains below 5000 lines', legacy.split(/\r?\n/).length < 5000],
]
let ok=0
for (const [name, pass] of checks) {
  console.log(`${pass ? '✓' : '✗'} ${name}`)
  if (pass) ok++
}
console.log(`\nDS Legacy Cleanup Pass 10: ${ok}/${checks.length}`)
if (ok !== checks.length) process.exit(1)
