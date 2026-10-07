import { useEffect, useState } from 'react'
import type { BackupSummary } from '../types/backupState'
import { vocabularyService } from '../services/vocabularyService'

export function useBackupState() {
  const [summary, setSummary] = useState<BackupSummary>()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => vocabularyService.subscribeBackup(value => {
    setSummary(value); setFailed(false)
  }, () => setFailed(true)), [attempt])
  return { summary, failed, retry: () => { setFailed(false); setAttempt(value => value + 1) } }
}
