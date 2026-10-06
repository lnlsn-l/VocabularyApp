import type { VocabularyEntry } from '../types/vocabulary'

export function matchesSearch(entry: VocabularyEntry, query: string): boolean {
  const term = query.trim().toLowerCase()
  return !term || [entry.word, entry.meaning, entry.note].some(value => value.toLowerCase().includes(term))
}
