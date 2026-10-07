import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { UPSTREAM } from '../proxy/core.mjs'

// Use Wrangler's locked simulator version rather than a separate mismatched runtime dependency.
const require = createRequire(import.meta.url)
const runtimePath = require.resolve('miniflare', { paths: [require.resolve('wrangler/package.json')] })
const { Miniflare, convertV4MiniflareOptions } = await import(pathToFileURL(runtimePath).href)
mkdirSync('.tools', { recursive: true })
const storage = mkdtempSync(resolve('.tools/worker-test-'))
const secret = crypto.randomUUID()
let upstreamCalls = 0
const options = {
  modules: ['worker', 'core', 'quota'].map(name => ({ type: 'ESModule', path: resolve(`proxy/${name}.mjs`) })),
  modulesRoot: resolve('proxy'), compatibilityDate: '2026-10-07',
  bindings: { YOUDAO_APP_ID: 'synthetic-app', YOUDAO_APP_SECRET: secret, TRANSLATION_ENABLED: 'true', ALLOWED_ORIGINS: 'https://lnlsn-l.github.io',
    DAILY_CHAR_LIMIT: '40', MONTHLY_CHAR_LIMIT: '100', SOURCE_PER_MINUTE: '1000' },
  durableObjects: { TRANSLATION_QUOTA: { className: 'TranslationQuota', useSQLite: true } },
  resourcePersistencePath: storage,
  outboundService: async request => {
    assert.equal(request.url, UPSTREAM); assert.equal(request.method, 'POST')
    const form = new URLSearchParams(await request.text())
    assert.equal(form.get('from'), 'en'); assert.equal(form.get('to'), 'zh-CHS')
    assert.equal(form.get('q'), 'foo'); assert.equal(form.get('signType'), 'v3')
    upstreamCalls++
    return Response.json({ errorCode: '0', translation: ['运行时合成参考'], secret })
  },
  telemetry: { enabled: false },
}
let runtime = new Miniflare(convertV4MiniflareOptions(options))
const call = () => runtime.dispatchFetch('https://proxy.test/translate', { method: 'POST', headers: {
  origin: 'https://lnlsn-l.github.io', 'content-type': 'application/json', 'CF-Connecting-IP': '198.51.100.1',
}, body: '{"query":"foo"}' })
try {
  const results = await Promise.all(Array.from({ length: 30 }, call))
  assert.equal(results.filter(response => response.status === 200).length, 13)
  assert.equal(results.filter(response => response.status === 429).length, 17)
  assert.equal(upstreamCalls, 13)
  for (const response of results) assert.ok(!(await response.text()).includes(secret))
  await runtime.dispose()
  runtime = new Miniflare(convertV4MiniflareOptions(options))
  assert.equal((await call()).status, 429)
  assert.equal(upstreamCalls, 13)
  console.log('Worker runtime passed: SQLite Durable Object, 30 concurrent calls capped at 39/40 characters, restart persistence, fixed upstream, secret isolation.')
} finally { await runtime.dispose() }
