import type { ImportResult, VocabularyEntry, VocabularyInput, VocabularyStatus } from '../types/vocabulary'
import type { BackupSummary, ExportSnapshot } from '../types/backupState'

export interface VocabularyRepository {
  list(): Promise<VocabularyEntry[]>
  subscribe(next: (entries: VocabularyEntry[]) => void, error: () => void): () => void
  create(entry: VocabularyEntry): Promise<void>
  update(id: string, input: VocabularyInput, now: string): Promise<void>
  setStatus(id: string, status: VocabularyStatus, now: string): Promise<void>
  remove(id: string): Promise<void>
  recordView(id: string, now: string): Promise<void>
  merge(entries: VocabularyEntry[]): Promise<Omit<ImportResult, 'invalid'>>
  backupSummary(): Promise<BackupSummary>
  subscribeBackup(next: (summary: BackupSummary) => void, error: () => void): () => void
  exportSnapshot(): Promise<ExportSnapshot>
  markExport(snapshot: ExportSnapshot, requestedAt: string): Promise<void>
  dismissReminder(until: string): Promise<void>
}
