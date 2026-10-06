import { describe, expect, it } from 'vitest'
import { createBackup, parseBackup } from './backup'
import type { VocabularyEntry } from '../types/vocabulary'

const entry: VocabularyEntry = { id: 'test-id', word: 'substrate', meaning: '衬底', note: '', status: 'learning',
  searchCount: 3, createdAt: '2026-10-07T00:00:00.000Z', updatedAt: '2026-10-07T00:00:00.000Z' }
describe('版本化备份校验', () => {
  it('完整导出可恢复，空备份和 BOM 也可解析', () => {
    expect(parseBackup(createBackup([entry]))).toEqual({ entries: [entry], invalid: 0 })
    expect(parseBackup('\uFEFF' + createBackup([]))).toEqual({ entries: [], invalid: 0 })
  })
  it.each(['{', '[]', '{"version":2}', '{"version":1,"entries":null}'])('拒绝不合法外层格式 %s', text => {
    expect(() => parseBackup(text)).toThrow()
  })
  it('无效词条逐条计数，不将未识别字段传入数据层', () => {
    const fields = [null, { ...entry, word: ' ' }, { ...entry, status: 'x' }, { ...entry, searchCount: -1 },
      { ...entry, searchCount: 1.5 }, { ...entry, createdAt: 'yesterday' }, { ...entry, lastSearchedAt: false },
      { ...entry, note: 1 }, { ...entry, id: '' }, { ...entry, extra: 'ignored' }]
    const text = JSON.stringify({ version: 1, app: 'VocabularyApp', exportedAt: entry.createdAt, entries: fields })
    expect(parseBackup(text)).toEqual({ entries: [entry], invalid: 9 })
  })
})
