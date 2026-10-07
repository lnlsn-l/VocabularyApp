import { expect, it } from 'vitest'
import { filterEntries } from './search'
import { analyzeImport } from './importAnalysis'
import type { VocabularyEntry } from '../types/vocabulary'

it.each([1000, 5000, 10000])('%i 条基础搜索、筛选与导入分析', size => {
  const rows: VocabularyEntry[] = Array.from({ length: size }, (_, index) => ({
    id: String(index), word: `electronic term ${String(index).padStart(5, '0')}`, meaning: `测试 ${index}`, note: '半导体',
    status: index % 2 === 0 ? 'learning' : 'mastered', searchCount: index,
    createdAt: '2026-10-07T00:00:00.000Z', updatedAt: '2026-10-07T00:00:00.000Z',
  }))
  const start = performance.now()
  expect(filterEntries(rows, '半导体', 'learning', 'E', 'count')).toHaveLength(size / 2)
  const searchMs = performance.now() - start
  const analyzeStart = performance.now()
  const entries = rows.map(row => ({ ...row, note: '备份备注' }))
  const { analysis } = analyzeImport({ entries, invalid: 0, rawTotal: size, exportedAt: rows[0].createdAt, version: 1 }, rows)
  expect(analysis).toMatchObject({ imported: 0, duplicates: size, validTotal: size })
  expect(analysis.differences).toHaveLength(size)
  console.log(`规模 ${size}: 搜索/组合筛选 ${searchMs.toFixed(2)}ms；导入分析 ${(performance.now() - analyzeStart).toFixed(2)}ms`)
})
