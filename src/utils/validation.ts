import type { VocabularyInput } from '../types/vocabulary'

export class VocabularyError extends Error {
  constructor(message: string, public readonly existingId?: string) {
    super(message)
    this.name = 'VocabularyError'
  }
}

export const normalizeWord = (word: string) => word.trim().toLowerCase()

export function validateInput(input: VocabularyInput): VocabularyInput {
  const word = input.word.trim()
  const meaning = input.meaning.trim()
  if (!word) throw new VocabularyError('请输入英文词汇或短语。')
  if (!meaning) throw new VocabularyError('请输入中文释义。')
  if (input.status !== 'learning' && input.status !== 'mastered') {
    throw new VocabularyError('请选择有效的学习状态。')
  }
  return { word, meaning, note: input.note.trim(), status: input.status }
}

export function errorMessage(error: unknown): string {
  return error instanceof VocabularyError ? error.message : '操作失败，请重试。'
}
