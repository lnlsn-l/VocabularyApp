export type VocabularyStatus = 'learning' | 'mastered'

export interface VocabularyEntry {
  id: string
  word: string
  meaning: string
  note: string
  status: VocabularyStatus
  searchCount: number
  createdAt: string
  updatedAt: string
  lastSearchedAt?: string
}

export interface VocabularyInput {
  word: string
  meaning: string
  note: string
  status: VocabularyStatus
}

export interface ImportResult {
  imported: number
  duplicates: number
  invalid: number
}
