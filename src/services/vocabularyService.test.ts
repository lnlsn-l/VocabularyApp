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
    const [a] = await service.list()
    await expect(service.update(a.id, { word: ' B ', meaning: '修改', note: '', status: 'learning' })).rejects.toThrow('已经存在')
    expect((await service.list()).find(row => row.id === a.id)?.meaning).toBe('甲')
  })
})
