import { readdir, readFile } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'

const root = resolve('dist')
const files = []
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    const name = relative(root, path).split(sep).join('/')
    if (entry.isSymbolicLink()) throw new Error(`Deployment must not contain links: ${name}`)
    if (entry.isDirectory()) {
      if (name !== 'assets') throw new Error(`Unexpected deployment directory: ${name}`)
      await inspect(path)
    } else {
      if (!['index.html', 'favicon.svg'].includes(name) && !/^assets\/[\w-]+\.(js|css)$/.test(name)) {
        throw new Error(`Unexpected deployment file (only app static files allowed): ${name}`)
      }
      const content = await readFile(path, 'utf8')
      if (/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) {
        throw new Error(`Possible credential in deployment file: ${name}`)
      }
      files.push(name)
    }
  }
}
await inspect(root)
const html = await readFile(resolve(root, 'index.html'), 'utf8')
for (const path of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1])) {
  if (!path.startsWith('/VocabularyApp/') || !files.includes(path.slice('/VocabularyApp/'.length))) {
    throw new Error(`Invalid or missing production asset: ${path}`)
  }
}
if (!files.includes('index.html') || !files.includes('favicon.svg') || !files.some(name => name.endsWith('.js')) || !files.some(name => name.endsWith('.css'))) {
  throw new Error('Missing required static app files')
}
console.log(`Deployment allowlist passed: ${files.join(', ')}`)
