import { liveQuery } from 'dexie'
import { VocabularyDatabase, type StoredEntry } from '../db/database'
import type { VocabularyEntry, VocabularyInput, VocabularyStatus } from '../types/vocabulary'
import { normalizeWord, VocabularyError } from '../utils/validation'
import type { VocabularyRepository } from './vocabularyRepository'
import { backupStateKey, type BackupState, type ExportSnapshot, type BackupSummary } from '../types/backupState'

// 数据库内部的去重索引不泄露到 UI 或备份格式。
function toEntry(row: StoredEntry): VocabularyEntry {
  return {
    id: row.id, word: row.word, meaning: row.meaning, note: row.note,
    status: row.status, searchCount: row.searchCount,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
    ...(row.lastSearchedAt ? { lastSearchedAt: row.lastSearchedAt } : {}),
  }
}

export class LocalVocabularyRepository implements VocabularyRepository {
  constructor(private readonly db = new VocabularyDatabase()) {}

  private async state(): Promise<BackupState> {
    const state = await this.db.vocabularyAppMetadata.get(backupStateKey)
    if (!state) throw new VocabularyError('无法读取备份状态，请重试。')
    return state
  }

  private async changed(content: boolean) {
    const state = await this.state()
    await this.db.vocabularyAppMetadata.put({
      ...state, dataRevision: state.dataRevision + 1,
      contentRevision: state.contentRevision + (content ? 1 : 0),
      ...(content && !state.firstPendingContentAt ? { firstPendingContentAt: new Date().toISOString() } : {}),
    })
  }

  async exportSnapshot(): Promise<ExportSnapshot> {
    return this.db.transaction('r', this.db.vocabulary, this.db.vocabularyAppMetadata, async () => ({ entries: await this.list(), state: await this.state() }))
  }

  async backupSummary(): Promise<BackupSummary> {
    return this.db.transaction('r', this.db.vocabulary, this.db.vocabularyAppMetadata, async () => ({ total: await this.db.vocabulary.count(), state: await this.state() }))
  }

  subscribeBackup(next: (summary: BackupSummary) => void, error: () => void) {
    const subscription = liveQuery(() => this.backupSummary()).subscribe({ next, error })
    return () => subscription.unsubscribe()
  }

  async markExport(snapshot: ExportSnapshot, requestedAt: string) {
    await this.db.transaction('rw', this.db.vocabularyAppMetadata, async () => {
      const state = await this.state()
      // 并发导出按快照修订号单调更新，不把读取快照之后的写入标成已导出。
      if (snapshot.state.dataRevision < state.lastExportedRevision) return
      await this.db.vocabularyAppMetadata.put({
        ...state, lastExportedRevision: snapshot.state.dataRevision,
        lastExportedContentRevision: snapshot.state.contentRevision, lastExportRequestedAt: requestedAt,
        firstPendingContentAt: state.contentRevision === snapshot.state.contentRevision ? undefined : state.firstPendingContentAt,
        reminderDismissedUntil: undefined,
      })
    })
  }

  async dismissReminder(until: string) {
    await this.db.transaction('rw', this.db.vocabularyAppMetadata, async () => {
      await this.db.vocabularyAppMetadata.put({ ...await this.state(), reminderDismissedUntil: until })
    })
  }

  async list() { return (await this.db.vocabulary.toArray()).map(toEntry) }

  subscribe(next: (entries: VocabularyEntry[]) => void, error: () => void) {
    let cancelled = false
    let subscription: { unsubscribe(): void } | undefined
    // 显式捕获初始化错误，避免 liveQuery 等待数据库恢复时一直停在加载状态。
    void this.db.open().then(() => {
      if (!cancelled) subscription = liveQuery(() => this.list()).subscribe({ next, error })
    }).catch(() => { if (!cancelled) error() })
    return () => { cancelled = true; subscription?.unsubscribe() }
  }

  private async assertUnique(word: string, exceptId?: string) {
    const existing = await this.db.vocabulary.where('normalizedWord').equals(normalizeWord(word)).first()
    if (existing && existing.id !== exceptId) {
      throw new VocabularyError('该词已经存在于词库中。', existing.id)
    }
  }

  private async requireEntry(id: string) {
    const row = await this.db.vocabulary.get(id)
    if (!row) throw new VocabularyError('该词条已不存在，请刷新列表后重试。')
    return row
  }

  async create(entry: VocabularyEntry) {
    await this.db.transaction('rw', this.db.vocabulary, this.db.vocabularyAppMetadata, async () => {
      await this.assertUnique(entry.word)
      await this.db.vocabulary.add({ ...entry, normalizedWord: normalizeWord(entry.word) })
      await this.changed(true)
    })
  }

  async update(id: string, input: VocabularyInput, now: string) {
    await this.db.transaction('rw', this.db.vocabulary, this.db.vocabularyAppMetadata, async () => {
      const row = await this.requireEntry(id)
      await this.assertUnique(input.word, id)
      if (row.word === input.word && row.meaning === input.meaning && row.note === input.note && row.status === input.status) return
      await this.db.vocabulary.update(id, { ...input, normalizedWord: normalizeWord(input.word), updatedAt: now })
      await this.changed(true)
    })
  }

  async setStatus(id: string, status: VocabularyStatus, now: string) {
    await this.db.transaction('rw', this.db.vocabulary, this.db.vocabularyAppMetadata, async () => {
      const row = await this.requireEntry(id)
      if (row.status === status) return
      await this.db.vocabulary.update(id, { status, updatedAt: now })
      await this.changed(true)
    })
  }

  async remove(id: string) {
    await this.db.transaction('rw', this.db.vocabulary, this.db.vocabularyAppMetadata, async () => {
      await this.requireEntry(id)
      await this.db.vocabulary.delete(id)
      await this.changed(true)
    })
  }

  async recordView(id: string, now: string) {
    await this.db.transaction('rw', this.db.vocabulary, this.db.vocabularyAppMetadata, async () => {
      const row = await this.requireEntry(id)
      await this.db.vocabulary.update(id, { searchCount: row.searchCount + 1, lastSearchedAt: now })
      await this.changed(false)
    })
  }

  async merge(entries: VocabularyEntry[]) {
    return this.db.transaction('rw', this.db.vocabulary, this.db.vocabularyAppMetadata, async () => {
      const existing = await this.db.vocabulary.toArray()
      const words = new Set(existing.map(row => row.normalizedWord))
      const ids = new Set(existing.map(row => row.id))
      let imported = 0
      let duplicates = 0
      for (const entry of entries) {
        const normalizedWord = normalizeWord(entry.word)
        if (words.has(normalizedWord)) { duplicates++; continue }
        // 不同词条发生 ID 冲突时重新生成 ID，绝不覆盖旧数据。
        const id = ids.has(entry.id) ? crypto.randomUUID() : entry.id
        await this.db.vocabulary.add({ ...entry, id, normalizedWord })
        ids.add(id)
        words.add(normalizedWord)
        imported++
      }
      if (imported > 0) await this.changed(true)
      return { imported, duplicates }
    })
  }
}
