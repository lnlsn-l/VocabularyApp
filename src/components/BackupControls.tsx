import { useRef, useState, type RefObject } from 'react'
import { vocabularyService } from '../services/vocabularyService'
import { errorMessage, VocabularyError } from '../utils/validation'
import { useBackupState } from '../hooks/useBackupState'
import { shouldRemind } from '../utils/backupReminder'

interface Props { disabled: boolean; onNotice: (message: string) => void; inputRef?: RefObject<HTMLInputElement | null> }
export function BackupControls({ disabled, onNotice, inputRef }: Props) {
  const internalRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? internalRef
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { summary, failed, retry } = useBackupState()
  async function perform(action: () => Promise<void>) {
    setBusy(true); setError('')
    try { await action() }
    catch (cause) { setError(errorMessage(cause)) }
    finally { setBusy(false) }
  }
  async function importFile(file?: File) {
    if (!file) return
    await perform(async () => {
      if (file.size > 20 * 1024 * 1024) throw new VocabularyError('备份超过 20 MB，请拆分为较小的备份文件后导入。')
      let text: string
      try { text = await file.text() }
      catch { throw new VocabularyError('无法读取所选文件，请重新选择可读取的 JSON 备份。') }
      const result = await vocabularyService.importJSON(text)
      onNotice(`成功导入：${result.imported}；重复跳过：${result.duplicates}；无效数据：${result.invalid}。`)
    })
  }
  return <div className="backup-controls">
    <div className="backup-buttons">
      <button disabled={disabled || busy} onClick={() => void perform(async () => {
        await vocabularyService.requestExport()
        onNotice('已发起 JSON 下载，请在浏览器下载列表中确认文件已保存。')
      })}>导出词库</button>
      <button disabled={disabled || busy} onClick={() => ref.current?.click()}>{busy ? '处理中…' : '导入 JSON'}</button>
      <input ref={ref} type="file" hidden aria-label="选择 JSON 备份" accept=".json,application/json" disabled={disabled || busy}
        onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void importFile(file) }} />
    </div>
    {summary && <div className="backup-state" aria-label="备份状态" aria-live="polite">
      <p>最近发起导出：{summary.state.lastExportRequestedAt ? new Date(summary.state.lastExportRequestedAt).toLocaleString('zh-CN') : '尚未发起导出'}</p>
      <p>{summary.state.dataRevision > summary.state.lastExportedRevision ? '存在未导出变化' : summary.state.lastExportRequestedAt ? '自上次发起导出后无新增变化' : '当前词库为空，暂无待导出变化'}</p>
      {shouldRemind(summary) && <div className="backup-reminder" role="status">词库有未导出的内容变化，请导出并确认保留 JSON 文件。
        <button disabled={busy} onClick={() => void perform(() => vocabularyService.dismissReminder())}>稍后提醒（7 天）</button>
      </div>}
    </div>}
    {failed && <p role="alert">无法读取备份状态。<button onClick={retry}>重试备份状态</button></p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>
}
