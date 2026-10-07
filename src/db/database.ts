import Dexie, { type Table } from 'dexie'
import type { VocabularyEntry } from '../types/vocabulary'
import { vocabularyAppMetadataSchema, vocabularySchemaV1 } from './schema'
import { initialBackupState, type BackupState } from '../types/backupState'

export interface StoredEntry extends VocabularyEntry { normalizedWord: string }

export class VocabularyDatabase extends Dexie {
  vocabulary!: Table<StoredEntry, string>
  vocabularyAppMetadata!: Table<BackupState, string>

  constructor(name = 'VocabularyDB') {
    super(name)
    this.version(1).stores({ vocabulary: vocabularySchemaV1 })
    this.version(2).stores({ vocabulary: vocabularySchemaV1, vocabularyAppMetadata: vocabularyAppMetadataSchema })
      .upgrade(async transaction => {
        const hasEntries = await transaction.table('vocabulary').count() > 0
        await transaction.table('vocabularyAppMetadata').add(initialBackupState(hasEntries))
      })
    this.on('populate', transaction => {
      return transaction.table('vocabularyAppMetadata').add(initialBackupState()).then(() => undefined)
    })
  }
}
