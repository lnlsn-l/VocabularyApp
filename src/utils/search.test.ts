import { describe, expect, it } from 'vitest'
import { alphabetOf, filterEntries, matchesSearch } from './search'
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

it('字母、状态、查询可以组合，默认稳定排序且不改变原数组', () => {
  const substrate = { ...entry, id: '2', word: 'substrate', status: 'mastered' as const }
  const rows = [substrate, entry]
  expect(filterEntries(rows, 'electro', 'learning', 'E', 'alphabet')).toEqual([entry])
  expect(filterEntries(rows, '', 'all', 'all', 'alphabet')[0]).toBe(entry)
  expect(rows[0]).toBe(substrate)
  expect(alphabetOf(' 3D transistor')).toBe('#')
  expect(alphabetOf('(EMI)')).toBe('#')
  expect(alphabetOf(' electron mobility')).toBe('E')
})
