import type { ImportResult, VocabularyEntry, VocabularyInput, VocabularyStatus } from '../types/vocabulary'

export interface VocabularyRepository {
  list(): Promise<VocabularyEntry[]>
  subscribe(next: (entries: VocabularyEntry[]) => void, error: () => void): () => void
  create(entry: VocabularyEntry): Promise<void>
  update(id: string, input: VocabularyInput, now: string): Promise<void>
  setStatus(id: string, status: VocabularyStatus, now: string): Promise<void>
  remove(id: string): Promise<void>
  merge(entries: VocabularyEntry[]): Promise<Omit<ImportResult, 'invalid'>>
}
