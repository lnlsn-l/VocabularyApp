import { createServer } from 'node:http'
import { mkdirSync } from 'node:fs'
import { Readable } from 'node:stream'
import { handleTranslate, LIMITS } from './core.mjs'
import { createStorage } from './node-storage.mjs'
import { quotaConfig, reserveQuota } from './quota.mjs'
mkdirSync('.tools/proxy', { recursive: true })
const storage = createStorage('.tools/proxy/quota.sqlite')
const limits = quotaConfig(process.env)
const env = { ...process.env, ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173' }
const server = createServer(async (incoming, outgoing) => {
  const controller = new AbortController()
  outgoing.on('close', () => { if (!outgoing.writableFinished) controller.abort() })
  try {
    const request = new Request('http://localhost:8787' + incoming.url, {
      method: incoming.method, headers: incoming.headers, signal: controller.signal,
      ...(incoming.method === 'POST' ? { body: Readable.toWeb(incoming), duplex: 'half' } : {}),
    })
    const response = await handleTranslate(request, env, {
      source: incoming.socket.remoteAddress,
      reserve: reservation => reserveQuota(storage, reservation, limits),
    })
    outgoing.writeHead(response.status, Object.fromEntries(response.headers))
    outgoing.end(await response.text())
  } catch { outgoing.writeHead(500); outgoing.end('{"error":{"code":"upstream_failure"}}') }
})
server.requestTimeout = LIMITS.totalTimeout
server.listen(8787, '127.0.0.1', () => console.log('VocabularyApp translation proxy: http://127.0.0.1:8787 (loopback only)'))
