export const LIMITS = Object.freeze({ query: 200, body: 4096, response: 204800, translations: 20, timeout: 10000, totalTimeout: 12000 })
export const UPSTREAM = 'https://openapi.youdao.com/api'
export class ProxyError extends Error {
  constructor(code, status = 502) { super(code); this.code = code; this.status = status }
}
export function withSignal(promise, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)
    if (signal.aborted) { promise.catch(() => {}); reject(signal.reason); return }
    signal.addEventListener('abort', abort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}
export async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}
export async function signedForm(query, env, salt = crypto.randomUUID(), seconds = Math.floor(Date.now() / 1000)) {
  const chars = Array.from(query)
  const input = chars.length <= 20 ? query : chars.slice(0, 10).join('') + chars.length + chars.slice(-10).join('')
  const curtime = String(seconds)
  return new URLSearchParams({ q: query, from: 'en', to: 'zh-CHS', strict: 'true', appKey: env.YOUDAO_APP_ID,
    salt, curtime, signType: 'v3', sign: await sha256(env.YOUDAO_APP_ID + input + salt + curtime + env.YOUDAO_APP_SECRET) })
}
export async function boundedText(message, max, signal, code) {
  if (Number(message.headers.get('content-length')) > max) {
    await message.body?.cancel()
    throw new ProxyError(code, code === 'invalid_request' ? 400 : 502)
  }
  if (!message.body) return ''
  const reader = message.body.getReader()
  const chunks = []; let size = 0
  const abort = () => { void reader.cancel().catch(() => {}) }
  signal.addEventListener('abort', abort, { once: true })
  try {
    while (true) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > max) { await reader.cancel(); throw new ProxyError(code, code === 'invalid_request' ? 400 : 502) }
      chunks.push(value)
    }
    signal.throwIfAborted()
    const bytes = new Uint8Array(size); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } finally { signal.removeEventListener('abort', abort); reader.releaseLock() }
}
const configCodes = ['108', '110', '111', '112', '202', '203', '205', '206', '207']
export function translationsFrom(value) {
  if (!value || typeof value !== 'object' || typeof value.errorCode !== 'string') throw new ProxyError('upstream_failure')
  const code = value.errorCode
  if (code !== '0') {
    if (code === '401') throw new ProxyError('quota_exceeded', 429)
    if (['411', '412'].includes(code)) throw new ProxyError('rate_limited', 429)
    if (configCodes.includes(code)) throw new ProxyError('not_configured', 503)
    throw new ProxyError('upstream_failure')
  }
  if (!Array.isArray(value.translation)) throw new ProxyError('upstream_failure')
  if (value.translation.some(item => typeof item !== 'string')) throw new ProxyError('upstream_failure')
  const translations = value.translation.filter(item => item.trim()).slice(0, LIMITS.translations)
  if (!translations.length) throw new ProxyError('no_results', 404)
  return translations
}

// reserve receives only a salted source identifier, character count and UTC time; never query text.
export async function handleTranslate(request, env, { source, reserve, fetchUpstream = fetch, timeout = LIMITS.timeout, totalTimeout = LIMITS.totalTimeout } = {}) {
  const origin = request.headers.get('origin')
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean)
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin' }
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  const reply = (value, status) => new Response(JSON.stringify(value), { status, headers })
  if (!origin || !allowed.includes(origin)) return reply({ error: { code: 'forbidden' } }, 403)
  if (new URL(request.url).pathname !== '/translate') return reply({ error: { code: 'invalid_request' } }, 404)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers,
    'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } })
  if (request.method !== 'POST') return reply({ error: { code: 'invalid_request' } }, 405)
  const total = AbortSignal.timeout(totalTimeout)
  const signal = AbortSignal.any([request.signal, total])
  try {
    if (!request.headers.get('content-type')?.match(/^application\/json(?:\s*;|$)/i)) throw new ProxyError('invalid_request', 400)
    let value
    try { value = JSON.parse(await boundedText(request, LIMITS.body, signal, 'invalid_request')) }
    catch (error) { if (signal.aborted || error instanceof ProxyError) throw error; throw new ProxyError('invalid_request', 400) }
    if (!value || typeof value.query !== 'string' || Object.keys(value).length !== 1) throw new ProxyError('invalid_request', 400)
    const query = value.query.trim(); const length = Array.from(query).length
    if (!length || length > LIMITS.query) throw new ProxyError('invalid_request', 400)
    if (env.TRANSLATION_ENABLED !== 'true' || !env.YOUDAO_APP_ID || !env.YOUDAO_APP_SECRET || !source || !reserve) throw new ProxyError('not_configured', 503)
    signal.throwIfAborted()
    const now = Date.now()
    const sourceId = await sha256(env.YOUDAO_APP_SECRET + ':' + new Date(now).toISOString().slice(0, 10) + ':' + source)
    const reservation = await withSignal(Promise.resolve(reserve({ sourceId, length, now }, signal)), signal)
    if (!reservation.ok) throw new ProxyError(reservation.code, 429)
    signal.throwIfAborted()
    const upstreamSignal = AbortSignal.any([signal, AbortSignal.timeout(timeout)])
    let response
    try {
      const form = await signedForm(query, env)
      upstreamSignal.throwIfAborted()
      response = await withSignal(fetchUpstream(UPSTREAM, { method: 'POST', redirect: 'manual',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form, signal: upstreamSignal }), upstreamSignal)
      if (!response.ok) {
        await response.body?.cancel()
        throw new ProxyError(response.status === 429 ? 'rate_limited' : 'upstream_failure', response.status === 429 ? 429 : 502)
      }
      const raw = await boundedText(response, LIMITS.response, upstreamSignal, 'upstream_failure')
      let parsed
      try { parsed = JSON.parse(raw) } catch { throw new ProxyError('upstream_failure') }
      return reply({ query, source: 'youdao', translations: translationsFrom(parsed) }, 200)
    } catch (error) {
      if (upstreamSignal.aborted) throw new ProxyError(request.signal.aborted ? 'cancelled' : 'timeout', 504)
      if (error instanceof ProxyError) throw error
      throw new ProxyError('network_error')
    }
  } catch (error) {
    const safe = signal.aborted ? new ProxyError(request.signal.aborted ? 'cancelled' : 'timeout', 504)
      : error instanceof ProxyError ? error : new ProxyError('upstream_failure')
    return reply({ error: { code: safe.code } }, safe.status)
  }
}
