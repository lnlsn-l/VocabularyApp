import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { VocabularyDatabase } from '../db/database'
import { LocalVocabularyRepository } from '../repositories/localVocabularyRepository'
import { VocabularyService } from './vocabularyService'

const databases: VocabularyDatabase[] = []
function setup() {
  const db = new VocabularyDatabase(`test-${crypto.randomUUID()}`)
  databases.push(db)
  return { db, service: new VocabularyService(new LocalVocabularyRepository(db)) }
}
afterEach(async () => { await Promise.all(databases.splice(0).map(db => db.delete())) })

describe('本地词库数据层', () => {
  it('合并导入去重、保护旧词和 ID 冲突，重复导入不增记录', async () => {
    const { service } = setup()
    await service.create({ word: 'substrate', meaning: '原有释义', note: '', status: 'learning' })
    const [entry] = await service.list()
    const backup = JSON.stringify({ version: 1, app: 'VocabularyApp', exportedAt: entry.createdAt, entries: [
      { ...entry, word: ' Substrate ', meaning: '覆盖测试' },
      { ...entry, word: 'impedance', meaning: '阻抗' },
      { ...entry, word: ' IMPEDANCE ' }, { ...entry, meaning: ' ' },
    ] })
    expect(await service.importJSON(backup)).toEqual({ imported: 1, duplicates: 2, invalid: 1 })
    const rows = await service.list()
    expect(rows.find(row => row.word === 'substrate')?.meaning).toBe('原有释义')
    expect(new Set(rows.map(row => row.id)).size).toBe(2)
    expect(await service.importJSON(backup)).toEqual({ imported: 0, duplicates: 3, invalid: 1 })
    const exported = await service.exportJSON()
    expect(exported).not.toContain('normalizedWord')
    await expect(service.importJSON('{')).rejects.toThrow('无法解析')
    expect(await service.list()).toHaveLength(2)
  })
  it('只在显式查看时记录次数，并发查看不丢计数', async () => {
    const { service } = setup()
    await service.create({ word: 'substrate', meaning: '衬底', note: '', status: 'learning' })
    const [entry] = await service.list()
    await service.list()
    expect((await service.list())[0].searchCount).toBe(0)
    await Promise.all([service.recordView(entry.id), service.recordView(entry.id)])
    expect((await service.list())[0]).toMatchObject({ searchCount: 2, updatedAt: entry.updatedAt })
    expect((await service.list())[0].lastSearchedAt).toBeTruthy()
  })
  it('关闭并重新打开数据库仍可读取词条，默认统计为零', async () => {
    const { db, service } = setup()
    await service.create({ word: ' substrate ', meaning: ' 衬底 ', note: '', status: 'learning' })
    db.close()
    await db.open()
    const [entry] = await service.list()
    expect(entry.word).toBe('substrate')
    expect(entry.searchCount).toBe(0)
    expect(entry.id).toMatch(/^[\da-f-]{36}$/)
  })

  it('并发添加大小写相同的词也只有一条记录', async () => {
    const { service } = setup()
    const results = await Promise.allSettled(['Substrate', ' substrate '].map(word =>
      service.create({ word, meaning: '衬底', note: '', status: 'learning' })))
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(await service.list()).toHaveLength(1)
  })

  it('空值不会写入数据库，编辑重复词不会覆盖原数据', async () => {
    const { service } = setup()
    await expect(service.create({ word: ' ', meaning: '衬底', note: '', status: 'learning' })).rejects.toThrow('英文')
    await expect(service.create({ word: 'x', meaning: ' ', note: '', status: 'learning' })).rejects.toThrow('中文')
    await service.create({ word: 'a', meaning: '甲', note: '', status: 'learning' })
    await service.create({ word: 'b', meaning: '乙', note: '', status: 'learning' })
    const a = (await service.list()).find(row => row.word === 'a')!
    await expect(service.update(a.id, { word: ' B ', meaning: '修改', note: '', status: 'learning' })).rejects.toThrow('已经存在')
    expect((await service.list()).find(row => row.id === a.id)?.meaning).toBe('甲')
  })
})
