import { liveQuery } from 'dexie'
import { VocabularyDatabase, type StoredEntry } from '../db/database'
import type { VocabularyEntry, VocabularyInput, VocabularyStatus } from '../types/vocabulary'
import { normalizeWord, VocabularyError } from '../utils/validation'
import type { VocabularyRepository } from './vocabularyRepository'

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
    await this.db.transaction('rw', this.db.vocabulary, async () => {
      await this.assertUnique(entry.word)
      await this.db.vocabulary.add({ ...entry, normalizedWord: normalizeWord(entry.word) })
    })
  }

  async update(id: string, input: VocabularyInput, now: string) {
    await this.db.transaction('rw', this.db.vocabulary, async () => {
      await this.requireEntry(id)
      await this.assertUnique(input.word, id)
      await this.db.vocabulary.update(id, { ...input, normalizedWord: normalizeWord(input.word), updatedAt: now })
    })
  }

  async setStatus(id: string, status: VocabularyStatus, now: string) {
    await this.db.transaction('rw', this.db.vocabulary, async () => {
      await this.requireEntry(id)
      await this.db.vocabulary.update(id, { status, updatedAt: now })
    })
  }

  async remove(id: string) {
    await this.db.transaction('rw', this.db.vocabulary, async () => {
      await this.requireEntry(id)
      await this.db.vocabulary.delete(id)
    })
  }

  async recordView(id: string, now: string) {
    await this.db.transaction('rw', this.db.vocabulary, async () => {
      const row = await this.requireEntry(id)
      await this.db.vocabulary.update(id, { searchCount: row.searchCount + 1, lastSearchedAt: now })
    })
  }

  async merge(entries: VocabularyEntry[]) {
    return this.db.transaction('rw', this.db.vocabulary, async () => {
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
      return { imported, duplicates }
    })
  }
}
