import Dexie, { type Table } from 'dexie'
import type { VocabularyEntry } from '../types/vocabulary'
import { vocabularySchemaV1 } from './schema'

export interface StoredEntry extends VocabularyEntry { normalizedWord: string }

export class VocabularyDatabase extends Dexie {
  vocabulary!: Table<StoredEntry, string>

  constructor(name = 'VocabularyDB') {
    super(name)
    this.version(1).stores({ vocabulary: vocabularySchemaV1 })
  }
}
