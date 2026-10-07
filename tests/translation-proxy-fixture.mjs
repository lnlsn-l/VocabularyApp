// Test-only transport. Production core is exercised with a controlled upstream and no real credentials.
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { handleTranslate } from '../proxy/core.mjs'
import { createStorage } from '../proxy/node-storage.mjs'
import { quotaConfig, reserveQuota } from '../proxy/quota.mjs'
const storage = createStorage()
const env = { YOUDAO_APP_ID: 'synthetic-fixture', YOUDAO_APP_SECRET: crypto.randomUUID(), TRANSLATION_ENABLED: 'true',
  ALLOWED_ORIGINS: 'http://localhost:5173', DAILY_CHAR_LIMIT: '100000', MONTHLY_CHAR_LIMIT: '100000', SOURCE_PER_MINUTE: '1000' }
createServer(async (incoming, outgoing) => {
  if (incoming.url === '/') { outgoing.end('test fixture only'); return }
  const controller = new AbortController()
  outgoing.on('close', () => { if (!outgoing.writableFinished) controller.abort() })
  const request = new Request('http://127.0.0.1:8788' + incoming.url, { method: incoming.method, headers: incoming.headers,
    ...(incoming.method === 'POST' ? { body: Readable.toWeb(incoming), duplex: 'half' } : {}), signal: controller.signal })
  const response = await handleTranslate(request, env, { source: incoming.socket.remoteAddress,
    reserve: reservation => reserveQuota(storage, reservation, quotaConfig(env)),
    fetchUpstream: async (_url, options) => {
      const query = options.body.get('q')
      return Response.json({ errorCode: '0', translation: ['合成测试参考：' + query], speakUrl: 'https://never-load.invalid/' })
    },
  })
  outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(await response.text())
}).listen(8788, '127.0.0.1')
