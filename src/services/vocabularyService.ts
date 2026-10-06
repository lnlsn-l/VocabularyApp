import { LocalVocabularyRepository } from '../repositories/localVocabularyRepository'
import type { VocabularyRepository } from '../repositories/vocabularyRepository'
import type { VocabularyInput, VocabularyStatus } from '../types/vocabulary'
import type { VocabularyEntry } from '../types/vocabulary'
import { validateInput, VocabularyError } from '../utils/validation'
import { createBackup, parseBackup } from '../utils/backup'

export class VocabularyService {
  constructor(private readonly repository: VocabularyRepository) {}

  private async perform<T>(action: () => Promise<T>, message: string): Promise<T> {
    try { return await action() }
    catch (error) {
      if (error instanceof VocabularyError) throw error
      throw new VocabularyError(message)
    }
  }

  list() {
    return this.perform(() => this.repository.list(), '无法读取本地词库。请确认浏览器允许此网站使用 IndexedDB，并重试。')
  }

  subscribe(next: (entries: VocabularyEntry[]) => void, error: (message: string) => void) {
    return this.repository.subscribe(next, () => error('无法读取本地词库。请确认浏览器允许此网站使用存储，点击重试。'))
  }

  async create(input: VocabularyInput) {
    const fields = validateInput(input)
    const now = new Date().toISOString()
    return this.perform(() => this.repository.create({
      ...fields, id: crypto.randomUUID(), searchCount: 0, createdAt: now, updatedAt: now,
    }), '保存失败。请检查浏览器存储空间和网站存储权限，原有数据不会被覆盖。')
  }

  update(id: string, input: VocabularyInput) {
    const fields = validateInput(input)
    return this.perform(() => this.repository.update(id, fields, new Date().toISOString()), '修改失败，请重试。')
  }

  setStatus(id: string, status: VocabularyStatus) {
    return this.perform(() => this.repository.setStatus(id, status, new Date().toISOString()), '状态保存失败，请重试。')
  }

  remove(id: string) {
    return this.perform(() => this.repository.remove(id), '删除失败，请重试。')
  }

  recordView(id: string) {
    return this.perform(() => this.repository.recordView(id, new Date().toISOString()), '查看记录保存失败，请重试。')
  }

  async exportJSON() { return createBackup(await this.list()) }

  async importJSON(text: string) {
    const { entries, invalid } = parseBackup(text)
    const result = await this.perform(() => this.repository.merge(entries), '导入保存失败。本次合并已回滚，原有词库未被覆盖，请重试。')
    return { ...result, invalid }
  }
}

export const vocabularyService = new VocabularyService(new LocalVocabularyRepository())
