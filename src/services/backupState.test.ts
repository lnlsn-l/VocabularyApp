import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, expect, it, vi } from 'vitest'
import { VocabularyDatabase } from '../db/database'
import { vocabularySchemaV1 } from '../db/schema'
import { LocalVocabularyRepository } from '../repositories/localVocabularyRepository'
import { VocabularyService } from './vocabularyService'
import { backupStateKey, initialBackupState } from '../types/backupState'
import { shouldRemind, reminderResumeAt } from '../utils/backupReminder'

const databases: VocabularyDatabase[] = []
function setup() {
  const db = new VocabularyDatabase(`VocabularyApp.test-${crypto.randomUUID()}`)
  databases.push(db)
  const repository = new LocalVocabularyRepository(db)
  return { db, repository, service: new VocabularyService(repository) }
}
const input = { word: 'substrate', meaning: '衬底', note: '论文', status: 'learning' as const }
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(databases.splice(0).map(db => db.delete())) })

it('真实 v1 → v2 迁移保留所有字段和唯一索引，旧库不伪造历史导出', async () => {
  const name = `VocabularyApp.test-${crypto.randomUUID()}`
  const old = new Dexie(name)
  old.version(1).stores({ vocabulary: vocabularySchemaV1 })
  const row = { ...input, id: 'legacy', normalizedWord: 'substrate', searchCount: 9,
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-02-02T00:00:00.000Z', lastSearchedAt: '2026-10-01T00:00:00.000Z' }
  await old.table('vocabulary').add(row); old.close()
  const db = new VocabularyDatabase(name); databases.push(db)
  await db.open()
  expect(await db.vocabulary.get('legacy')).toEqual(row)
  expect(db.verno).toBe(2)
  const state = await db.vocabularyAppMetadata.get(backupStateKey)
  expect(state).toMatchObject({ dataRevision: 1, lastExportedRevision: 0 })
  expect(state?.lastExportRequestedAt).toBeUndefined()
  await expect(db.vocabulary.add({ ...row, id: 'duplicate' })).rejects.toThrow()
})

it('所有实际写入及统计计入 revision；纯读、无操作、重复和失败不计入', async () => {
  const { service } = setup()
  expect((await service.backupSummary()).state.dataRevision).toBe(0)
  await service.create(input)
  const [row] = await service.list()
  await service.update(row.id, input)
  await service.setStatus(row.id, 'learning')
  await expect(service.create(input)).rejects.toThrow()
  expect((await service.backupSummary()).state.dataRevision).toBe(1)
  await service.recordView(row.id)
  expect((await service.backupSummary()).state).toMatchObject({ dataRevision: 2, contentRevision: 1 })
  expect((await service.list())[0].updatedAt).toBe(row.updatedAt)
  await service.update(row.id, { ...input, meaning: '新释义' })
  await service.setStatus(row.id, 'mastered')
  await service.remove(row.id)
  expect((await service.backupSummary()).state).toMatchObject({ dataRevision: 5, contentRevision: 4 })
})

it('导出中并发写入不会被标为已导出；下载异常不伪造时间', async () => {
  const { service } = setup()
  await service.create(input)
  await expect(service.requestExport(() => { throw new Error('blocked') })).rejects.toThrow('未能发起')
  expect((await service.backupSummary()).state.lastExportRequestedAt).toBeUndefined()
  await service.requestExport(async text => {
    expect(JSON.parse(text).entries).toHaveLength(1)
    expect(text).not.toContain('dataRevision')
    await service.create({ ...input, word: 'impedance' })
  })
  expect((await service.backupSummary()).state).toMatchObject({ dataRevision: 2, lastExportedRevision: 1 })
  await service.requestExport(() => undefined)
  expect((await service.backupSummary()).state).toMatchObject({ dataRevision: 2, lastExportedRevision: 2 })
})

it('元数据写入失败整笔词条写入回滚', async () => {
  const { db, service } = setup()
  await db.open()
  vi.spyOn(db.vocabularyAppMetadata, 'put').mockImplementation(() => Dexie.Promise.reject(new Error('full')))
  await expect(service.create(input)).rejects.toThrow('保存失败')
  expect(await service.list()).toEqual([])
  expect((await service.backupSummary()).state.dataRevision).toBe(0)
})

it('同一数据库的并发连接修订不丢失，导出和暂停跨连接保存', async () => {
  const { db, service } = setup()
  const secondDB = new VocabularyDatabase(db.name)
  const second = new VocabularyService(new LocalVocabularyRepository(secondDB))
  try {
    await Promise.all([service.create(input), second.create({ ...input, word: 'impedance' })])
    expect((await second.backupSummary()).state.dataRevision).toBe(2)
    await service.requestExport(() => undefined)
    await second.dismissReminder()
    expect((await service.backupSummary()).state).toMatchObject({ lastExportedRevision: 2, reminderDismissedUntil: expect.any(String) })
  } finally { secondDB.close() }
})

it('提醒仅在未导出且有内容操作时按时间/阈值出现，暂停七天且不伪造备份', () => {
  const now = Date.parse('2026-10-07T00:00:00.000Z')
  const state = initialBackupState(true, '2026-09-01T00:00:00.000Z')
  expect(shouldRemind({ total: 1, state }, now)).toBe(true)
  expect(shouldRemind({ total: 0, state }, now)).toBe(false)
  expect(shouldRemind({ total: 1, state: { ...state, contentRevision: 0 } }, now)).toBe(false)
  expect(shouldRemind({ total: 1, state: { ...state, firstPendingContentAt: new Date(now).toISOString(), contentRevision: 50 } }, now)).toBe(true)
  expect(shouldRemind({ total: 1, state: { ...state, reminderDismissedUntil: reminderResumeAt(now) } }, now)).toBe(false)
  expect(shouldRemind({ total: 1, state: { ...state, reminderDismissedUntil: reminderResumeAt(now) } }, now + 7 * 86400000)).toBe(true)
})
