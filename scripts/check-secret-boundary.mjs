import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
const secrets = [randomUUID(), randomUUID()]
const env = { ...process.env, YOUDAO_APP_ID: secrets[0], YOUDAO_APP_SECRET: secrets[1] }
for (const [script, args] of [['node_modules/typescript/bin/tsc', ['-b']], ['node_modules/vite/bin/vite.js', ['build']]]) {
  const result = spawnSync(process.execPath, [script, ...args], { env, encoding: 'utf8' })
  const output = (result.stdout ?? '') + (result.stderr ?? '')
  if (secrets.some(secret => output.includes(secret))) throw new Error('Secret appeared in build output')
  if (result.status !== 0) throw new Error('Sentinel build failed; run npm run build for non-secret diagnostics')
}
function inspect(path) {
  for (const item of readdirSync(path, { withFileTypes: true })) {
    const full = resolve(path, item.name)
    if (item.isDirectory()) inspect(full)
    else if (secrets.some(secret => readFileSync(full, 'utf8').includes(secret))) throw new Error('Secret appeared in frontend artifact')
  }
}
inspect(resolve('dist'))
const files = spawnSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
if (files.status !== 0) throw new Error('Could not inspect Git boundary')
for (const file of files.stdout.split('\0').filter(Boolean)) {
  if (secrets.some(secret => readFileSync(file, 'utf8').includes(secret))) throw new Error('Secret appeared in Git tracked file')
}
console.log('Server-only sentinel secrets absent from frontend build, build output and Git tracked files.')
