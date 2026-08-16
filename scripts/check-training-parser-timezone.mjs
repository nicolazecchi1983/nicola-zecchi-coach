import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const moduleUrl = pathToFileURL(path.resolve('src/services/trainingSheetParser.js')).href
const code = `
  import { parseTrainingSheetNarration } from ${JSON.stringify(moduleUrl)};
  const base = 'Allenamento a Mezzolara il 28 luglio 2026 alle 17:30 con focus forza intensità 4 volume 3.';
  const parsed = parseTrainingSheetNarration(base);
  if (parsed.data.date !== '2026-07-28') {
    console.error('Timezone regression: expected 2026-07-28, got', parsed.data.date);
    process.exit(1);
  }
  const invalid = parseTrainingSheetNarration('Allenamento a Mezzolara il 31 febbraio 2026 alle 17:30 con focus forza intensità 4 volume 3.');
  if (invalid.data.date !== null) {
    console.error('Invalid calendar date accepted:', invalid.data.date);
    process.exit(1);
  }
`

const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
  env: { ...process.env, TZ: 'Europe/Rome' },
  encoding: 'utf8',
})

if (result.status !== 0) {
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  process.exit(result.status || 1)
}

console.log('TRAINING PARSER TIMEZONE: OK (Europe/Rome, explicit date + invalid-date guard)')
