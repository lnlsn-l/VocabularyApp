import type { VocabularyEntry } from '../types/vocabulary'
import { validateInput, VocabularyError } from './validation'

export interface VocabularyBackup {
  version: 1
  exportedAt: string
  app: 'VocabularyApp'
  entries: VocabularyEntry[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isDate = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))

function parseEntry(value: unknown): VocabularyEntry | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()
    || typeof value.word !== 'string' || typeof value.meaning !== 'string'
    || (value.note !== undefined && typeof value.note !== 'string')
    || (value.status !== 'learning' && value.status !== 'mastered')
    || typeof value.searchCount !== 'number' || !Number.isSafeInteger(value.searchCount) || value.searchCount < 0
    || !isDate(value.createdAt) || !isDate(value.updatedAt)
    || (value.lastSearchedAt !== undefined && !isDate(value.lastSearchedAt))) return null
  try {
    const fields = validateInput({ word: value.word, meaning: value.meaning, note: value.note as string ?? '', status: value.status })
    return {
      ...fields, id: value.id.trim(), searchCount: value.searchCount,
      createdAt: new Date(value.createdAt).toISOString(), updatedAt: new Date(value.updatedAt).toISOString(),
      ...(value.lastSearchedAt ? { lastSearchedAt: new Date(value.lastSearchedAt as string).toISOString() } : {}),
    }
  } catch { return null }
}

export function parseBackup(text: string): { entries: VocabularyEntry[]; invalid: number } {
  let value: unknown
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')) }
  catch { throw new VocabularyError('JSON 无法解析，请选择完整的词库备份文件。') }
  if (!isRecord(value)) throw new VocabularyError('备份格式不正确，请使用 VocabularyApp 导出的 JSON 文件。')
  if (value.version !== 1) throw new VocabularyError('不支持该备份版本。第一版只支持 version 为 1 的备份。')
  if (value.app !== 'VocabularyApp' || !isDate(value.exportedAt) || !Array.isArray(value.entries)) {
    throw new VocabularyError('备份格式不正确：需要 app、有效的 exportedAt 和 entries 数组。')
  }
  const entries: VocabularyEntry[] = []
  let invalid = 0
  for (const row of value.entries) {
    const entry = parseEntry(row)
    if (entry) entries.push(entry)
    else invalid++
  }
  return { entries, invalid }
}

export function createBackup(entries: VocabularyEntry[]): string {
  const backup: VocabularyBackup = { version: 1, exportedAt: new Date().toISOString(), app: 'VocabularyApp', entries }
  return JSON.stringify(backup, null, 2)
}

export function downloadBackup(text: string) {
  const now = new Date()
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `vocabulary-backup-${date}.json`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
