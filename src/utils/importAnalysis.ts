import type { VocabularyEntry, ImportResult } from '../types/vocabulary'
import type { ParsedBackup } from './backup'
import { normalizeWord } from './validation'

export const differenceFields = ['meaning', 'note', 'status', 'searchCount', 'createdAt', 'updatedAt', 'lastSearchedAt'] as const
export interface ImportDifference {
  word: string
  source: 'current' | 'file'
  retained: VocabularyEntry
  incoming: VocabularyEntry
  fields: (typeof differenceFields[number])[]
}
export interface ImportAnalysis extends ImportResult {
  currentTotal: number
  validTotal: number
  rawTotal: number
  existingDuplicates: number
  fileDuplicates: number
  differences: ImportDifference[]
  idConflicts: number
}
export interface ImportPreview { analysis: ImportAnalysis; revision: number }
export type ConfirmImportResult = { changed: true; preview: ImportPreview } | { changed: false; result: ImportResult }

// 单次构建映射；与事务写入共用同一份判定，避免每条扫描整个词库。
export function analyzeImport(document: ParsedBackup, current: VocabularyEntry[]) {
  const retained = new Map(current.map(entry => [normalizeWord(entry.word), { entry, source: 'current' as 'current' | 'file' }]))
  const ids = new Set(current.map(entry => entry.id))
  const additions: VocabularyEntry[] = []
  const analysis: ImportAnalysis = {
    currentTotal: current.length, validTotal: document.entries.length, rawTotal: document.rawTotal,
    imported: 0, duplicates: 0, invalid: document.invalid,
    existingDuplicates: 0, fileDuplicates: 0, differences: [], idConflicts: 0,
  }
  for (const incoming of document.entries) {
    const key = normalizeWord(incoming.word)
    const existing = retained.get(key)
    if (existing) {
      analysis.duplicates++
      if (existing.source === 'current') analysis.existingDuplicates++
      else analysis.fileDuplicates++
      const fields = differenceFields.filter(field => existing.entry[field] !== incoming[field])
      if (fields.length) analysis.differences.push({ word: incoming.word, source: existing.source, retained: existing.entry, incoming, fields })
    } else {
      if (ids.has(incoming.id)) analysis.idConflicts++
      ids.add(incoming.id)
      retained.set(key, { entry: incoming, source: 'file' })
      additions.push(incoming)
      analysis.imported++
    }
  }
  return { analysis, additions }
}
