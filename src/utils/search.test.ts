import { describe, expect, it } from 'vitest'
import { matchesSearch } from './search'
import type { VocabularyEntry } from '../types/vocabulary'

const entry: VocabularyEntry = { id: '1', word: 'electromagnetic interference', meaning: '电磁干扰', note: '微波论文',
  status: 'learning', searchCount: 0, createdAt: '2026-10-07T00:00:00.000Z', updatedAt: '2026-10-07T00:00:00.000Z' }
describe('统一实时搜索', () => {
  it.each(['', ' ele ', 'ELECTRO', 'interference', '电磁', '干扰', '微波'])('匹配 %s', query => {
    expect(matchesSearch(entry, query)).toBe(true)
  })
  it('未匹配时返回 false，搜索不会修改统计', () => {
    expect(matchesSearch(entry, 'substrate')).toBe(false)
    expect(entry.searchCount).toBe(0)
  })
})
