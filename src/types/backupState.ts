export const backupStateKey = 'VocabularyApp.backupState'

export interface BackupState {
  key: typeof backupStateKey
  dataRevision: number
  contentRevision: number
  lastExportedRevision: number
  lastExportedContentRevision: number
  lastExportRequestedAt?: string
  firstPendingContentAt?: string
  reminderDismissedUntil?: string
}

export interface ExportSnapshot {
  entries: import('./vocabulary').VocabularyEntry[]
  state: BackupState
}

export interface BackupSummary { state: BackupState; total: number }

export function initialBackupState(hasEntries = false, now = new Date().toISOString()): BackupState {
  return {
    key: backupStateKey, dataRevision: hasEntries ? 1 : 0, contentRevision: hasEntries ? 1 : 0,
    lastExportedRevision: 0, lastExportedContentRevision: 0,
    ...(hasEntries ? { firstPendingContentAt: now } : {}),
  }
}
