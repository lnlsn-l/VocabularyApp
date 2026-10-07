import { handleTranslate } from './core.mjs'
import { initializeQuota, quotaConfig, reserveQuota } from './quota.mjs'

export class TranslationQuota {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; initializeQuota(ctx.storage) }
  async fetch(request) {
    try {
      const result = reserveQuota(this.ctx.storage, await request.json(), quotaConfig(this.env))
      // An alarm performs cleanup even when no further requests arrive.
      if (await this.ctx.storage.getAlarm() === null) await this.ctx.storage.setAlarm(Date.now() + 86400000)
      return Response.json(result)
    } catch { return Response.json({ ok: false, code: 'not_configured' }, { status: 503 }) }
  }
  async alarm() {
    this.ctx.storage.sql.exec('DELETE FROM buckets WHERE expires <= ?', Date.now())
    if (this.ctx.storage.sql.exec('SELECT key FROM buckets LIMIT 1').toArray().length) await this.ctx.storage.setAlarm(Date.now() + 86400000)
  }
}
export default {
  async fetch(request, env) {
    // Cloudflare overwrites CF-Connecting-IP at the edge. Never read X-Forwarded-For.
    return handleTranslate(request, env, {
      fetchUpstream: (url, options) => fetch(url, options),
      source: request.headers.get('CF-Connecting-IP'),
      reserve: async (reservation, signal) => {
        const stub = env.TRANSLATION_QUOTA.get(env.TRANSLATION_QUOTA.idFromName('VocabularyApp-global-v1'))
        const response = await stub.fetch('https://quota.internal/reserve', { method: 'POST', body: JSON.stringify(reservation), signal })
        if (!response.ok) throw new Error('Quota unavailable')
        return response.json()
      },
    })
  },
}
