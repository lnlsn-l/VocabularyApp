export const translationMessages: Record<string, string> = {
  no_results: '没有取得翻译参考，可以修改查询短语后再试或手动添加。',
  invalid_request: '查询词或短语需为 1–200 个字符，请修改后再试。',
  not_configured: '翻译服务暂不可用，可手动添加。',
  network_error: '网络连接失败，请检查网络后主动重试；也可手动添加。',
  timeout: '翻译请求超时，可以主动重试或手动添加。',
  rate_limited: '查询过于频繁，请稍后主动重试或手动添加。',
  quota_exceeded: '翻译额度暂不足，请稍后再试或手动添加。',
  upstream_failure: '翻译服务返回异常，可以稍后主动重试或手动添加。',
  forbidden: '翻译服务暂不可用，可手动添加。',
}
export class TranslationError extends Error {
  constructor(public code: string) { super(translationMessages[code] ?? translationMessages.upstream_failure) }
}
export interface TranslationResult { query: string; source: 'youdao'; translations: string[] }
export function translationEndpoint(base = import.meta.env.VITE_TRANSLATION_API_BASE_URL): string {
  if (!base) throw new TranslationError('not_configured')
  try {
    const url = new URL(base)
    if (url.username || url.password || url.search || url.hash) throw new Error()
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    const currentLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
    if (url.protocol !== 'https:' && !(currentLocal && local && url.protocol === 'http:')) throw new Error()
    if (local && !currentLocal) throw new Error()
    return base.replace(/\/+$/, '') + '/translate'
  } catch { throw new TranslationError('not_configured') }
}
export async function getTranslation(query: string, signal: AbortSignal): Promise<TranslationResult> {
  const endpoint = translationEndpoint()
  query = query.trim()
  if (!query || Array.from(query).length > 200) throw new TranslationError('invalid_request')
  const deadline = AbortSignal.timeout(15000)
  const combined = AbortSignal.any([signal, deadline])
  try {
    const response = await fetch(endpoint, { method: 'POST', credentials: 'omit', redirect: 'error',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), signal: combined })
    // The client also caps data if a misconfigured proxy returns an oversized body.
    const reader = response.body?.getReader()
    if (!reader) throw new TranslationError('upstream_failure')
    const chunks: Uint8Array[] = []; let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 204800) { await reader.cancel(); throw new TranslationError('upstream_failure') }
        chunks.push(value)
      }
    } finally { reader.releaseLock() }
    const bytes = new Uint8Array(size); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    let result
    try { result = JSON.parse(new TextDecoder().decode(bytes)) } catch { throw new TranslationError('upstream_failure') }
    if (!response.ok) throw new TranslationError(result?.error?.code in translationMessages ? result.error.code
      : response.status === 429 ? 'rate_limited' : 'upstream_failure')
    if (result?.query !== query || result.source !== 'youdao' || !Array.isArray(result.translations)
      || !result.translations.length || result.translations.length > 20
      || result.translations.some((item: unknown) => typeof item !== 'string' || !item.trim())) throw new TranslationError('upstream_failure')
    return { query, source: 'youdao', translations: result.translations }
  } catch (error) {
    if (signal.aborted) throw error
    if (deadline.aborted) throw new TranslationError('timeout')
    if (error instanceof TranslationError) throw error
    throw new TranslationError('network_error')
  }
}
