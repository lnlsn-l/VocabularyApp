import type { BackupSummary } from '../types/backupState'

export const reminderPolicy = { days: 14, contentChanges: 50, snoozeDays: 7 }
const day = 24 * 60 * 60 * 1000

export function shouldRemind({ state, total }: BackupSummary, now = Date.now()) {
  if (total === 0 || state.dataRevision <= state.lastExportedRevision
    || state.contentRevision <= state.lastExportedContentRevision
    || (state.reminderDismissedUntil && Date.parse(state.reminderDismissedUntil) > now)) return false
  const changes = state.contentRevision - state.lastExportedContentRevision
  const since = state.lastExportRequestedAt ?? state.firstPendingContentAt
  return changes >= reminderPolicy.contentChanges || (!!since && now - Date.parse(since) >= reminderPolicy.days * day)
}

export const reminderResumeAt = (now = Date.now()) => new Date(now + reminderPolicy.snoozeDays * day).toISOString()
