import { afterEach, expect, it, vi } from 'vitest'
import { getTranslation, translationEndpoint } from './translationService'
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
it('public URL must use HTTPS; production never falls back to loopback', () => {
  vi.stubGlobal('location', { hostname: 'lnlsn-l.github.io' })
  for (const url of ['', 'http://127.0.0.1:8787', 'https://localhost', 'https://user:key@example.com', 'https://example.com?key=abc', 'ftp://example.com']) expect(() => translationEndpoint(url)).toThrow()
  expect(translationEndpoint('https://example.com/')).toBe('https://example.com/translate')
  vi.stubGlobal('location', { hostname: 'localhost' })
  expect(translationEndpoint('http://127.0.0.1:8787')).toBe('http://127.0.0.1:8787/translate')
})
it('client sends only explicit query and rejects mismatched/malformed responses', async () => {
  vi.stubGlobal('location', { hostname: 'localhost' }); vi.stubEnv('VITE_TRANSLATION_API_BASE_URL', 'http://127.0.0.1:8787')
  const fetcher = vi.fn(async () => Response.json({ query: 'x', source: 'youdao', translations: ['参考'] }))
  vi.stubGlobal('fetch', fetcher)
  const signal = new AbortController().signal
  expect(await getTranslation(' x ', signal)).toEqual({ query: 'x', source: 'youdao', translations: ['参考'] })
  expect(fetcher.mock.calls[0]).toMatchObject(['http://127.0.0.1:8787/translate', { credentials: 'omit', body: '{"query":"x"}' }])
  for (const value of [{ query: 'other', source: 'youdao', translations: ['参考'] }, { query: 'x', source: 'other', translations: ['参考'] }, { query: 'x', source: 'youdao', translations: [] }]) {
    fetcher.mockImplementation(async () => Response.json(value)); await expect(getTranslation('x', signal)).rejects.toMatchObject({ code: 'upstream_failure' })
  }
  fetcher.mockImplementation(async () => new Response('{'))
  await expect(getTranslation('x', signal)).rejects.toMatchObject({ code: 'upstream_failure' })
})
