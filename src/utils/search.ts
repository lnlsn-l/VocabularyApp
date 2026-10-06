import type { VocabularyEntry } from '../types/vocabulary'
import type { VocabularyStatus } from '../types/vocabulary'

export type StatusFilterValue = 'all' | VocabularyStatus
export type SortValue = 'alphabet' | 'created' | 'viewed' | 'count'
export const alphabetOf = (word: string) => /^[a-z]/i.test(word.trim()) ? word.trim()[0].toUpperCase() : '#'

export function matchesSearch(entry: VocabularyEntry, query: string): boolean {
  const term = query.trim().toLowerCase()
  return !term || [entry.word, entry.meaning, entry.note].some(value => value.toLowerCase().includes(term))
}

export function filterEntries(entries: VocabularyEntry[], query: string, status: StatusFilterValue, letter: string, sort: SortValue) {
  return entries.filter(entry => matchesSearch(entry, query)
    && (status === 'all' || entry.status === status)
    && (letter === 'all' || alphabetOf(entry.word) === letter)).sort((a, b) => {
      let priority = 0
      if (sort === 'created') priority = b.createdAt.localeCompare(a.createdAt)
      if (sort === 'viewed') priority = (b.lastSearchedAt ?? '').localeCompare(a.lastSearchedAt ?? '')
      if (sort === 'count') priority = b.searchCount - a.searchCount
      return priority || a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id)
    })
}
