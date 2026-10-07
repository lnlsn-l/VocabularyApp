import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { createStorage } from './node-storage.mjs'
import { handleTranslate, LIMITS, signedForm, UPSTREAM } from './core.mjs'
import { quotaConfig, reserveQuota } from './quota.mjs'
import worker, { TranslationQuota } from './worker.mjs'

const env = { YOUDAO_APP_ID: 'fixture-app', YOUDAO_APP_SECRET: crypto.randomUUID(), TRANSLATION_ENABLED: 'true', ALLOWED_ORIGINS: 'http://localhost:5173' }
const stores = []
afterEach(() => { for (const storage of stores.splice(0)) storage.close() })
function setup(overrides = {}) {
  const storage = createStorage(); stores.push(storage)
  const upstream = vi.fn(async () => Response.json({ errorCode: '0', translation: ['测试参考'], sign: env.YOUDAO_APP_SECRET, speakUrl: 'https://never-load.invalid/' }))
  const reserve = vi.fn(reservation => reserveQuota(storage, reservation, quotaConfig(overrides)))
  return { storage, upstream, reserve, run: (query = 'fixture query', settings = {}) => handleTranslate(new Request('http://proxy/translate', {
    method: 'POST', headers: { origin: env.ALLOWED_ORIGINS, 'content-type': 'application/json' }, body: JSON.stringify({ query }), ...settings,
  }), { ...env, ...overrides }, { source: 'trusted-address', reserve, fetchUpstream: upstream, timeout: 20 }) }
}
describe('translation proxy', () => {
  it.each(['abc', 'abcdefghijklmnopqrst', 'abcdefghijklmnopqrstu', '电路😀abcd'.repeat(5)])('official v3 UTF-8 signature %s', async query => {
    const form = await signedForm(query, env, 'salt', 1700000000)
    const chars = Array.from(query)
    const input = chars.length > 20 ? chars.slice(0, 10).join('') + chars.length + chars.slice(-10).join('') : query
    expect(form.get('sign')).toBe(createHash('sha256').update(env.YOUDAO_APP_ID + input + 'salt1700000000' + env.YOUDAO_APP_SECRET, 'utf8').digest('hex'))
    expect(Object.fromEntries(form)).toMatchObject({ q: query, from: 'en', to: 'zh-CHS', strict: 'true', signType: 'v3', curtime: '1700000000' })
    expect(form.has('domain')).toBe(false)
  })
  it('fixed HTTPS form upstream, minimal response and no secrets in quota', async () => {
    const f = setup(); const response = await f.run('  fixture query  ')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ query: 'fixture query', source: 'youdao', translations: ['测试参考'] })
    expect(f.upstream).toHaveBeenCalledTimes(1)
    const [url, options] = f.upstream.mock.calls[0]
    expect(url).toBe(UPSTREAM); expect(options.method).toBe('POST'); expect(options.redirect).toBe('manual')
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    const reservation = f.reserve.mock.calls[0][0]
    expect(Object.keys(reservation).sort()).toEqual(['length', 'now', 'sourceId'])
    expect(JSON.stringify(reservation)).not.toContain('fixture query')
    expect(JSON.stringify(f.storage.sql.exec('SELECT * FROM buckets').toArray())).not.toContain(env.YOUDAO_APP_SECRET)
  })
  it.each(['', ' ', 'x'.repeat(201), '😀'.repeat(201)])('invalid length before quota or upstream', async query => {
    const f = setup(); expect((await f.run(query)).status).toBe(400)
    expect(f.upstream).not.toHaveBeenCalled(); expect(f.reserve).not.toHaveBeenCalled()
  })
  it('200 Unicode code points accepted; 4096 bytes, exact JSON model and content type enforced', async () => {
    const f = setup(); expect((await f.run('😀'.repeat(200))).status).toBe(200)
    for (const body of ['{', JSON.stringify({ query: 'x', url: 'https://evil.invalid' }), JSON.stringify({ query: 'x', secret: 'y' }), ' '.repeat(4097)]) {
      expect((await f.run('x', { body })).status).toBe(400)
    }
    expect((await f.run('x', { headers: { origin: env.ALLOWED_ORIGINS, 'content-type': 'text/plain' } })).status).toBe(400)
    expect(f.upstream).toHaveBeenCalledTimes(1)
  })
  it('CORS exact origin / methods / missing origin / unknown path', async () => {
    const f = setup()
    for (const origin of ['', 'https://evil.invalid', env.ALLOWED_ORIGINS + '/VocabularyApp/']) {
      const response = await f.run('x', { headers: { origin, 'content-type': 'application/json' } })
      expect(response.status).toBe(403); expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
    }
    const options = await f.run('x', { method: 'OPTIONS', body: undefined })
    expect(options.status).toBe(204); expect(options.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGINS)
    expect((await f.run('x', { method: 'GET', body: undefined })).status).toBe(405)
    expect(f.upstream).not.toHaveBeenCalled()
  })
  it.each([{ TRANSLATION_ENABLED: 'false' }, { YOUDAO_APP_ID: '' }, { YOUDAO_APP_SECRET: '' }])('disabled or missing secrets fails closed', async settings => {
    const f = setup(settings); expect(await (await f.run()).json()).toEqual({ error: { code: 'not_configured' } })
    expect(f.reserve).not.toHaveBeenCalled(); expect(f.upstream).not.toHaveBeenCalled()
  })
  it.each([
    ['401', 'quota_exceeded'], ['411', 'rate_limited'], ['412', 'rate_limited'], ['108', 'not_configured'], ['202', 'not_configured'], ['303', 'upstream_failure'], ['103', 'upstream_failure'],
  ])('HTTP 200 business error %s -> %s', async (errorCode, code) => {
    const f = setup(); f.upstream.mockImplementation(async () => Response.json({ errorCode, translation: ['不应展示'], secret: env.YOUDAO_APP_SECRET }))
    expect(await (await f.run()).json()).toEqual({ error: { code } }); expect(f.upstream).toHaveBeenCalledTimes(1)
  })
  it.each([
    [[], 'no_results'], [[' '], 'no_results'], [[null], 'upstream_failure'], [null, 'upstream_failure'],
  ])('invalid or empty result %j -> %s', async (translation, code) => {
    const f = setup(); f.upstream.mockImplementation(async () => Response.json({ errorCode: '0', translation }))
    expect(await (await f.run()).json()).toEqual({ error: { code } })
  })
  it('HTTP 429, 500, malformed JSON, oversized/chunked response and no retries', async () => {
    for (const [response, code] of [[new Response('', { status: 429 }), 'rate_limited'], [new Response('', { status: 302, headers: { Location: 'https://evil.invalid' } }), 'upstream_failure'], [new Response('', { status: 500 }), 'upstream_failure'], [new Response('{'), 'upstream_failure'],
      [new Response('x'.repeat(LIMITS.response + 1)), 'upstream_failure'], [Response.json({ translation: ['a'] }), 'upstream_failure']]) {
      const f = setup(); f.upstream.mockImplementation(async () => response)
      const result = await (await f.run()).text(); expect(JSON.parse(result)).toEqual({ error: { code } })
      expect(result).not.toContain(env.YOUDAO_APP_SECRET); expect(f.upstream).toHaveBeenCalledTimes(1)
    }
  })
  it('at most 20 results, HTML remains text with no raw metadata', async () => {
    const f = setup(); f.upstream.mockImplementation(async () => Response.json({ errorCode: '0', translation: Array(21).fill('<script>alert(1)</script>') }))
    const result = await (await f.run()).json(); expect(result.translations).toHaveLength(20)
    expect(result.translations[0]).toBe('<script>alert(1)</script>')
  })
  it('network and timeout fail safely; requests reserve quota even on failure', async () => {
    for (const code of ['network_error', 'timeout']) {
      const f = setup()
      f.upstream.mockImplementation((_url, { signal }) => code === 'network_error' ? Promise.reject(new Error(env.YOUDAO_APP_SECRET))
        : new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })))
      expect(await (await f.run()).json()).toEqual({ error: { code } })
      expect(f.storage.sql.exec("SELECT used FROM buckets WHERE key LIKE 'day:%'").toArray()[0].used).toBe(13)
    }
  })
  it('aborted caller avoids upstream; quota storage failure avoids upstream', async () => {
    const f = setup(); const controller = new AbortController(); controller.abort()
    expect((await f.run('x', { signal: controller.signal })).status).toBe(504)
    expect(f.upstream).not.toHaveBeenCalled()
    f.reserve.mockImplementation(() => { throw new Error(env.YOUDAO_APP_SECRET) })
    expect(await (await f.run()).json()).toEqual({ error: { code: 'upstream_failure' } })
    expect(f.upstream).not.toHaveBeenCalled()
  })
  it('total deadline bounds quota wait and prevents late upstream call', async () => {
    const f = setup()
    let release
    const waiting = new Promise(resolve => { release = resolve })
    const response = await handleTranslate(new Request('http://proxy/translate', { method: 'POST', headers: { origin: env.ALLOWED_ORIGINS, 'content-type': 'application/json' }, body: '{"query":"x"}' }), env,
      { source: 'trusted', reserve: () => waiting, fetchUpstream: f.upstream, totalTimeout: 10 })
    expect(await response.json()).toEqual({ error: { code: 'timeout' } })
    release({ ok: true }); await Promise.resolve()
    expect(f.upstream).not.toHaveBeenCalled()
  })
  it('daily/monthly and source rate deny before charged upstream', async () => {
    for (const limits of [{ DAILY_CHAR_LIMIT: '3' }, { MONTHLY_CHAR_LIMIT: '3' }, { SOURCE_PER_MINUTE: '1' }]) {
      const f = setup(limits); expect((await f.run('abc')).status).toBe(200)
      expect((await f.run('abc')).status).toBe(429); expect(f.upstream).toHaveBeenCalledTimes(1)
    }
  })
  it('concurrent 200 reservations cannot exceed daily cap; UTC rollover and expiry', async () => {
    const f = setup(); const now = Date.UTC(2026, 9, 7, 12)
    const limits = { daily: 100, monthly: 150, rate: 1000 }
    const results = await Promise.all(Array.from({ length: 200 }, () => Promise.resolve().then(() => reserveQuota(f.storage, { now, length: 3, sourceId: 'a'.repeat(64) }, limits))))
    expect(results.filter(result => result.ok)).toHaveLength(33)
    const tomorrow = { now: now + 86400000, length: 50, sourceId: 'b'.repeat(64) }
    expect(reserveQuota(f.storage, tomorrow, limits).ok).toBe(true)
    expect(reserveQuota(f.storage, { ...tomorrow, length: 2 }, limits).code).toBe('quota_exceeded')
    expect(f.storage.sql.exec("SELECT * FROM buckets WHERE key LIKE 'rate:%'").toArray()).toHaveLength(1)
    expect(reserveQuota(f.storage, { ...tomorrow, now: Date.UTC(2026, 10, 1) }, limits).ok).toBe(true)
    expect(() => quotaConfig({ DAILY_CHAR_LIMIT: 'NaN' })).toThrow()
  })
  it('worker uses singleton trusted CF source and DO persists across object recreation', async () => {
    const f = setup(); const alarms = { value: null }
    const ctx = { storage: { ...f.storage, getAlarm: async () => alarms.value, setAlarm: async value => { alarms.value = value } } }
    const object = new TranslationQuota(ctx, { DAILY_CHAR_LIMIT: '2' })
    const reservation = { now: Date.now(), length: 2, sourceId: 'c'.repeat(64) }
    expect(await (await object.fetch(new Request('https://quota/reserve', { method: 'POST', body: JSON.stringify(reservation) }))).json()).toEqual({ ok: true })
    const recreated = new TranslationQuota(ctx, { DAILY_CHAR_LIMIT: '2' })
    expect(await (await recreated.fetch(new Request('https://quota/reserve', { method: 'POST', body: JSON.stringify(reservation) }))).json()).toMatchObject({ ok: false })
    const namespace = { idFromName: vi.fn(), get: vi.fn() }
    const request = new Request('http://proxy/translate', { method: 'POST', headers: { origin: env.ALLOWED_ORIGINS, 'content-type': 'application/json', 'X-Forwarded-For': 'spoofed' }, body: '{"query":"a"}' })
    expect((await worker.fetch(request, { ...env, TRANSLATION_QUOTA: namespace })).status).toBe(503)
    expect(namespace.get).not.toHaveBeenCalled()
  })
})
