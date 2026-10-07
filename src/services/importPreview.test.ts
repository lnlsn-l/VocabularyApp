import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, expect, it, vi } from 'vitest'
import { VocabularyDatabase } from '../db/database'
import { LocalVocabularyRepository } from '../repositories/localVocabularyRepository'
import { VocabularyService } from './vocabularyService'
import { createBackup } from '../utils/backup'

const databases: VocabularyDatabase[] = []
function setup() {
  const db = new VocabularyDatabase(`VocabularyApp.import-test-${crypto.randomUUID()}`)
  databases.push(db)
  return { db, service: new VocabularyService(new LocalVocabularyRepository(db)) }
}
const input = { word: 'substrate', meaning: '衬底', note: '', status: 'learning' as const }
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(databases.splice(0).map(db => db.delete())) })

it('预览只读且统计可相加；冲突、文件内重复、无效和 ID 冲突按统一规则分析', async () => {
  const { service } = setup()
  await service.create(input)
  const [entry] = await service.list()
  const before = await service.backupSummary()
  const text = JSON.stringify({ version: 1, app: 'VocabularyApp', exportedAt: entry.createdAt, entries: [
    { ...entry, word: ' Substrate ', meaning: '备份释义', note: '备份备注', status: 'mastered' },
    { ...entry, word: 'impedance' }, { ...entry, word: ' IMPEDANCE ', note: '不同' }, { ...entry, word: ' ' },
  ] })
  const prepared = await service.previewImport('\uFEFF' + text)
  expect(prepared.preview.analysis).toMatchObject({ rawTotal: 4, validTotal: 3, currentTotal: 1, imported: 1, duplicates: 2, invalid: 1,
    existingDuplicates: 1, fileDuplicates: 1, idConflicts: 1 })
  expect(prepared.preview.analysis.differences).toHaveLength(2)
  expect(prepared.preview.analysis.differences[0].fields).toEqual(['meaning', 'note', 'status'])
  expect(await service.backupSummary()).toEqual(before)
  expect(await service.list()).toEqual([entry])
  expect(await service.confirmImport(prepared.document, prepared.preview.revision)).toEqual({ changed: false, result: { imported: 1, duplicates: 2, invalid: 1 } })
  const rows = await service.list()
  expect(rows.find(row => row.word === 'substrate')).toEqual(entry)
  expect(new Set(rows.map(row => row.id)).size).toBe(2)
  expect((await service.backupSummary()).state.dataRevision).toBe(before.state.dataRevision + 1)
})

it('其他连接新增/编辑后第一次确认只更新预览，再次确认才合并', async () => {
  const { db, service } = setup()
  await service.create(input)
  const [entry] = await service.list()
  const prepared = await service.previewImport(createBackup([{ ...entry, id: 'new', word: 'impedance' }]))
  const otherDB = new VocabularyDatabase(db.name)
  const other = new VocabularyService(new LocalVocabularyRepository(otherDB))
  try {
    await other.create({ ...input, word: 'impedance', meaning: '保留当前' })
    await other.update(entry.id, { ...input, note: '另一个标签页' })
    const before = await service.backupSummary()
    const first = await service.confirmImport(prepared.document, prepared.preview.revision)
    expect(first.changed).toBe(true)
    if (!first.changed) throw new Error('must refresh')
    expect(first.preview.analysis).toMatchObject({ imported: 0, duplicates: 1, currentTotal: 2 })
    expect(await service.backupSummary()).toEqual(before)
    expect(await service.confirmImport(prepared.document, first.preview.revision)).toEqual({ changed: false, result: { imported: 0, duplicates: 1, invalid: 0 } })
    expect(await service.backupSummary()).toEqual(before)
    expect((await service.list()).find(row => row.word === 'impedance')?.meaning).toBe('保留当前')
  } finally { otherDB.close() }
})

it('事务中途失败撤销全部新增和 metadata，预览可重试', async () => {
  const { db, service } = setup()
  await service.create(input)
  const [entry] = await service.list()
  const prepared = await service.previewImport(createBackup([{ ...entry, id: 'a', word: 'a' }, { ...entry, id: 'b', word: 'b' }]))
  const before = await service.backupSummary()
  const add = db.vocabulary.add.bind(db.vocabulary)
  let calls = 0
  const spy = vi.spyOn(db.vocabulary, 'add').mockImplementation(row => ++calls === 2 ? Dexie.Promise.reject(new Error('full')) : add(row))
  await expect(service.confirmImport(prepared.document, prepared.preview.revision)).rejects.toThrow('已回滚')
  spy.mockRestore()
  expect(await service.list()).toEqual([entry])
  expect(await service.backupSummary()).toEqual(before)
  expect((await service.confirmImport(prepared.document, prepared.preview.revision)).changed).toBe(false)
})

it('全无效及全重复无写入，不制造待导出变化；非法外层不进入预览', async () => {
  const { service } = setup()
  await service.create(input)
  await service.requestExport(() => undefined)
  const [entry] = await service.list()
  const before = await service.backupSummary()
  for (const entries of [[entry], [{ ...entry, word: ' ' }]]) {
    const prepared = await service.previewImport(JSON.stringify({ version: 1, app: 'VocabularyApp', exportedAt: entry.createdAt, entries }))
    await service.confirmImport(prepared.document, prepared.preview.revision)
    expect(await service.backupSummary()).toEqual(before)
  }
  for (const text of ['{', '[]', '{"version":2}', '{"version":1,"entries":[]}']) {
    await expect(service.previewImport(text)).rejects.toThrow()
  }
})
