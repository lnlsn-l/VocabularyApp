// The same SQLite transaction algorithm is used by local Node and the singleton Durable Object.
export function initializeQuota(storage) {
  storage.sql.exec('CREATE TABLE IF NOT EXISTS buckets (key TEXT PRIMARY KEY, used INTEGER NOT NULL, expires INTEGER NOT NULL)')
  storage.sql.exec('CREATE INDEX IF NOT EXISTS buckets_expiry ON buckets(expires)')
}
export function quotaConfig(env) {
  const positive = (name, fallback) => {
    const value = Number(env[name] ?? fallback)
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid quota configuration')
    return value
  }
  return { daily: positive('DAILY_CHAR_LIMIT', 5000), monthly: positive('MONTHLY_CHAR_LIMIT', 100000), rate: positive('SOURCE_PER_MINUTE', 10) }
}
export function reserveQuota(storage, { sourceId, length, now }, limits) {
  if (!/^[a-f0-9]{64}$/.test(sourceId) || !Number.isSafeInteger(length) || length < 1 || length > 200 || !Number.isSafeInteger(now)) throw new Error('Invalid reservation')
  return storage.transactionSync(() => {
    storage.sql.exec('DELETE FROM buckets WHERE expires <= ?', now)
    const date = new Date(now).toISOString()
    const minute = Math.floor(now / 60000)
    const checks = [
      { key: `day:${date.slice(0, 10)}`, amount: length, limit: limits.daily, expires: Date.parse(date.slice(0, 10)) + 86400000, code: 'quota_exceeded' },
      { key: `month:${date.slice(0, 7)}`, amount: length, limit: limits.monthly, expires: Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() + 1, 1), code: 'quota_exceeded' },
      { key: `rate:${minute}:${sourceId}`, amount: 1, limit: limits.rate, expires: (minute + 1) * 60000, code: 'rate_limited' },
    ]
    for (const check of checks) {
      const used = storage.sql.exec('SELECT used FROM buckets WHERE key = ?', check.key).toArray()[0]?.used ?? 0
      if (used + check.amount > check.limit) return { ok: false, code: check.code }
    }
    for (const check of checks) storage.sql.exec('INSERT INTO buckets (key, used, expires) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET used = used + excluded.used', check.key, check.amount, check.expires)
    return { ok: true }
  })
}
