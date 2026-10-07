import { DatabaseSync } from 'node:sqlite'
import { initializeQuota } from './quota.mjs'
export function createStorage(path = ':memory:') {
  const db = new DatabaseSync(path)
  const storage = {
    sql: { exec(query, ...bindings) {
      const statement = db.prepare(query)
      if (/^SELECT/i.test(query)) return { toArray: () => statement.all(...bindings) }
      statement.run(...bindings)
      return { toArray: () => [] }
    } },
    transactionSync(callback) {
      db.exec('BEGIN IMMEDIATE')
      try { const result = callback(); db.exec('COMMIT'); return result }
      catch (error) { db.exec('ROLLBACK'); throw error }
    },
    close: () => db.close(),
  }
  initializeQuota(storage)
  return storage
}
